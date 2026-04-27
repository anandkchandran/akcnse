import { useState, useEffect, useRef, useCallback } from 'react';
import { isMarketOpen } from '../constants';

import { API_BASE } from '../utils/api.js';
const REFRESH_MS = 120_000; // 2 minutes

// ── Cap-segmented pools ───────────────────────────────────────────────────────

// Large-cap: Nifty 50 universe
const LARGE_CAP_POOL = [
  'RELIANCE',   'TCS',        'INFY',       'HDFCBANK',   'ICICIBANK',
  'HINDUNILVR', 'WIPRO',      'BAJFINANCE', 'SBIN',       'AXISBANK',
  'LT',         'KOTAKBANK',  'ITC',        'TITAN',      'SUNPHARMA',
  'TATAMOTORS', 'TATASTEEL',  'ADANIPORTS', 'POWERGRID',  'NTPC',
  'MARUTI',     'BHARTIARTL', 'NESTLEIND',  'DRREDDY',    'HCLTECH',
  'M&M',        'ONGC',       'COALINDIA',  'JSWSTEEL',   'ASIANPAINT',
  'BAJAJFINSV', 'BAJAJ-AUTO', 'HEROMOTOCO', 'EICHERMOT',  'TECHM',
  'DIVISLAB',   'ULTRACEMCO', 'HINDALCO',   'VEDL',       'BPCL',
  'TATACONSUM', 'TATAPOWER',  'INDIGO',     'DMART',      'ZOMATO',
  'INDUSINDBK', 'HDFCLIFE',   'SBILIFE',    'BANKBARODA', 'PNB',
];

// Mid-cap: quality names across sectors
const MID_CAP_POOL = [
  // FMCG
  'BRITANNIA', 'COLPAL',    'DABUR',      'GODREJCP',   'EMAMILTD',  'ASTRAL',
  // Auto
  'ASHOKLEY',  'TVSMOTOR',  'BALKRISIND',
  // Infra / Real-estate / Cement
  'DLF',       'GODREJPROP','OBEROIRLTY', 'LODHA',
  'SHREECEM',  'ACC',       'AMBUJACEM',
  // Industrials / Chemicals
  'DEEPAKNTR', 'POLYCAB',   'CUMMINSIND', 'BHEL',
  // Energy
  'GAIL',      'IOC',       'HPCL',
  // IT
  'LTTS',      'KPITTECH',  'TATATECH',
  // Banking / Finance
  'UNIONBANK', 'CAMS',      'KFINTECH',
  // Pharma
  'ALKEM',     'SYNGENE',   'METROPOLIS',
];

// Small-cap: high-growth / emerging names
const SMALL_CAP_POOL = [
  'HAPPSTMNDS', 'LATENTVIEW', 'TANLA',
  'RAILTEL',    'AAVAS',      'DELHIVERY',
];

// Broad pool for gainers / losers (all caps)
const BROAD_POOL = [...LARGE_CAP_POOL, ...MID_CAP_POOL, ...SMALL_CAP_POOL];

// Curated long-term pool — blue-chips + select quality mid/small-caps
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
 * Fetch live quotes for NIFTY 50 + any custom symbols.
 *
 * The server resolves which `change` value to use:
 *   - Market open  → regularMarketChangePercent (real-time intraday)
 *   - Market closed → candle-derived prevSessionChange (last complete session)
 *
 * The hook just consumes `change` as returned; no client-side swapping needed.
 *
 * @param {string[]} customSymbols  – extra symbol IDs to include
 */
export function useNseWatchlist(customSymbols = []) {
  const [quotes,      setQuotes]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const mountedRef = useRef(true);
  const timerRef   = useRef(null);

  // Stable key so useCallback re-runs only when the custom list changes
  const customKey = [...new Set(customSymbols)].sort().join(',');

  const fetchAll = useCallback(async () => {
    const all = [...new Set([...BROAD_POOL, ...LONG_TERM_POOL, ...customSymbols])];
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

  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);
    fetchAll();
    clearInterval(timerRef.current);
    timerRef.current = setInterval(fetchAll, REFRESH_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(timerRef.current);
    };
  }, [fetchAll]);

  // ── Derived lists ─────────────────────────────────────────────────────────────
  // `change` already contains the right value (intraday or last-session) from server
  const broadQuotes = quotes.filter(q => BROAD_POOL.includes(q.symbol) && q.price > 0);
  const sorted      = [...broadQuotes].sort((a, b) => b.change - a.change);

  // Gainers: top 50 best performers across all caps
  const gainers = sorted.slice(0, 50);
  // Losers: bottom 50 worst performers across all caps
  const losers  = [...sorted].reverse().slice(0, 50);

  // Long-term picks (top 50): full blue-chip pool sorted by today's relative strength.
  // Ranks the 50-stock quality pool by session % change so the currently strongest
  // names bubble to the top — still a "buy and hold" list, just ordered by momentum.
  const longTermPicks = (() => {
    const pool = quotes.filter(q => LONG_TERM_POOL.includes(q.symbol) && q.price > 0);
    if (!pool.length) return [];
    return [...pool]
      .sort((a, b) => b.change - a.change)
      .slice(0, 50);
  })();

  // Live-priced custom stocks (same order as customSymbols)
  const customStocks = customSymbols
    .map(id => quotes.find(q => q.symbol === id))
    .filter(Boolean);

  // UI badge: use client-side market check (fast, no server round-trip)
  const marketOpen = isMarketOpen();

  // prevSessionDate from any quote that has one (all will have the same date)
  const prevSessionDate = !marketOpen
    ? (quotes.find(q => q.prevSessionDate)?.prevSessionDate ?? null)
    : null;

  return {
    gainers, losers, longTermPicks,
    quotes, customStocks,
    loading, error, lastRefresh,
    marketOpen, prevSessionDate,
    refresh: fetchAll,
  };
}
