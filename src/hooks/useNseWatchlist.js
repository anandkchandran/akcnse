import { useState, useEffect, useRef, useCallback } from 'react';
import { isMarketOpen } from '../constants';
import { API_BASE } from '../utils/api.js';

const REFRESH_MS       = 120_000; // 2 minutes
const MOVERS_REFRESH_MS = 90_000; // 90 seconds — slightly faster than batch

// ── Top Picks pool (long-term quality, all caps) ──────────────────────────────
// Used only for the "Top Picks" tab; gainers/losers come from server-side scan.
const LONG_TERM_POOL = [
  // Large-cap: Banking & Finance
  'HDFCBANK',  'ICICIBANK',  'KOTAKBANK',  'AXISBANK',   'SBIN',
  'INDUSINDBK','BAJFINANCE', 'BAJAJFINSV', 'HDFCLIFE',   'SBILIFE',
  // Large-cap: IT & Tech
  'TCS',       'INFY',       'HCLTECH',    'WIPRO',      'TECHM',
  // Large-cap: Consumer & FMCG
  'HINDUNILVR','ITC',        'NESTLEIND',  'TATACONSUM', 'ASIANPAINT',
  'TITAN',     'DMART',      'PIDILITIND', 'ZOMATO',
  // Large-cap: Pharma
  'SUNPHARMA', 'DRREDDY',    'DIVISLAB',   'CIPLA',      'APOLLOHOSP',
  // Large-cap: Auto
  'MARUTI',    'BAJAJ-AUTO', 'HEROMOTOCO', 'EICHERMOT',  'M&M',
  // Large-cap: Energy & Infra
  'RELIANCE',  'ONGC',       'NTPC',       'POWERGRID',  'LT',
  'BHARTIARTL','INDIGO',
  // Select mid-caps with strong fundamentals
  'BRITANNIA', 'COLPAL',    'TVSMOTOR',   'POLYCAB',
  'LTTS',      'KPITTECH',  'CAMS',       'ALKEM',
  // Select small-caps (high-conviction)
  'HAPPSTMNDS','LATENTVIEW',
];

/**
 * useNseWatchlist
 *
 * - gainers / losers  : from GET /api/nse/market-movers
 *     Server scans ~450 NSE symbols, sorts, caches 2 min.
 *     No pre-defined pool needed — any stock can appear.
 *
 * - longTermPicks      : from POST /api/nse/batch (LONG_TERM_POOL)
 *     Curated quality picks, ranked by session strength.
 *
 * - customStocks       : from same batch call as longTermPicks.
 */
export function useNseWatchlist(customSymbols = []) {
  // ── Market movers state ──────────────────────────────────────────────────
  const [gainers,    setGainers]    = useState([]);
  const [losers,     setLosers]     = useState([]);
  const [moversLoading, setMoversLoading] = useState(true);
  const [moversError,   setMoversError]   = useState(null);
  const [scanned,    setScanned]    = useState(0);

  // ── Batch (Top Picks + custom) state ────────────────────────────────────
  const [quotes,     setQuotes]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [lastRefresh,setLastRefresh]= useState(null);

  const mountedRef  = useRef(true);
  const moversTimer = useRef(null);
  const batchTimer  = useRef(null);
  const customKey   = [...new Set(customSymbols)].sort().join(',');

  // ── Fetch market-wide gainers / losers ───────────────────────────────────
  const fetchMovers = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/nse/market-movers`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (!mountedRef.current) return;
      setGainers(data.gainers || []);
      setLosers(data.losers  || []);
      setScanned(data.scanned || 0);
      setMoversLoading(false);
      setMoversError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      setMoversError(err.message);
      setMoversLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch Top Picks + custom symbols ────────────────────────────────────
  const fetchBatch = useCallback(async () => {
    const all = [...new Set([...LONG_TERM_POOL, ...customSymbols])];
    try {
      const res = await fetch(`${API_BASE}/api/nse/batch`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ symbols: all }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (!mountedRef.current) return;
      setQuotes(data);
      setLastRefresh(new Date());
      setLoading(false);
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err.message);
      setLoading(false);
    }
  }, [customKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;

    // Market movers — fire immediately, then every 90s
    setMoversLoading(true);
    fetchMovers();
    clearInterval(moversTimer.current);
    moversTimer.current = setInterval(fetchMovers, MOVERS_REFRESH_MS);

    // Batch (top picks + custom) — fire immediately, then every 2min
    setLoading(true);
    fetchBatch();
    clearInterval(batchTimer.current);
    batchTimer.current = setInterval(fetchBatch, REFRESH_MS);

    return () => {
      mountedRef.current = false;
      clearInterval(moversTimer.current);
      clearInterval(batchTimer.current);
    };
  }, [fetchMovers, fetchBatch]);

  // ── Derived: Long-term picks ─────────────────────────────────────────────
  const longTermPicks = (() => {
    const pool = quotes.filter(q => LONG_TERM_POOL.includes(q.symbol) && q.price > 0);
    if (!pool.length) return [];
    return [...pool].sort((a, b) => b.change - a.change).slice(0, 50);
  })();

  // ── Derived: Custom stocks ───────────────────────────────────────────────
  const customStocks = customSymbols
    .map(id => quotes.find(q => q.symbol === id))
    .filter(Boolean);

  // UI helpers
  const marketOpen = isMarketOpen();
  const prevSessionDate = !marketOpen
    ? (quotes.find(q => q.prevSessionDate)?.prevSessionDate ?? null)
    : null;

  // Combined loading / error for the header spinner
  const combinedLoading = loading || moversLoading;
  const combinedError   = error || moversError;

  const refresh = useCallback(() => {
    setMoversLoading(true);
    setLoading(true);
    fetchMovers();
    fetchBatch();
  }, [fetchMovers, fetchBatch]);

  return {
    gainers, losers, longTermPicks,
    quotes, customStocks,
    loading: combinedLoading,
    error:   combinedError,
    lastRefresh, marketOpen, prevSessionDate,
    scanned,  // number of stocks scanned by market-movers
    refresh,
  };
}
