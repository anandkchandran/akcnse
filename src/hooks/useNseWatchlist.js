import { useState, useEffect, useRef, useCallback } from 'react';
import { isMarketOpen } from '../constants';
import { API_BASE } from '../utils/api.js';

const REFRESH_MS        = 120_000; // 2 minutes — custom watchlist
const MOVERS_REFRESH_MS =  90_000; // 90 seconds — market-wide scan (also feeds Top Picks)

/**
 * useNseWatchlist
 *
 * - gainers / losers / topPicks  : from GET /api/nse/market-movers
 *     Server scans ~320 NSE symbols, applies quality filters, caches 2 min.
 *     topPicks = stocks with 0.3–15 % gain, price ≥ ₹50, has volume.
 *
 * - customStocks                 : from POST /api/nse/batch (only when customIds present)
 */
export function useNseWatchlist(customSymbols = []) {
  // ── Market movers + top picks state ─────────────────────────────────────
  const [gainers,       setGainers]       = useState([]);
  const [losers,        setLosers]        = useState([]);
  const [topPicks,      setTopPicks]      = useState([]);
  const [moversLoading, setMoversLoading] = useState(true);
  const [moversError,   setMoversError]   = useState(null);
  const [scanned,       setScanned]       = useState(0);
  const [lastRefresh,   setLastRefresh]   = useState(null);
  const [marketOpen,    setMarketOpen]    = useState(isMarketOpen());
  const [prevSessionDate, setPrevSessionDate] = useState(null);

  // ── Custom watchlist state ───────────────────────────────────────────────
  const [customQuotes,  setCustomQuotes]  = useState([]);
  const [customLoading, setCustomLoading] = useState(false);
  const [customError,   setCustomError]   = useState(null);

  const mountedRef    = useRef(true);
  const moversTimer   = useRef(null);
  const customTimer   = useRef(null);
  const customKey     = [...new Set(customSymbols)].sort().join(',');

  // ── Fetch market-wide scan (gainers, losers, topPicks) ──────────────────
  const fetchMovers = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/nse/market-movers`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (!mountedRef.current) return;
      setGainers(data.gainers   || []);
      setLosers(data.losers     || []);
      setTopPicks(data.topPicks || []);
      setScanned(data.scanned   || 0);
      setMarketOpen(!!data.marketOpen);
      setMoversLoading(false);
      setMoversError(null);
      setLastRefresh(new Date());

      // Extract prevSessionDate from first quote's name fallback — not available
      // here, but keep the field for WatchList compat (it checks prevSessionDate).
      setPrevSessionDate(null);
    } catch (err) {
      if (!mountedRef.current) return;
      setMoversError(err.message);
      setMoversLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch custom watchlist symbols ──────────────────────────────────────
  const fetchCustom = useCallback(async () => {
    const ids = [...new Set(customSymbols)];
    if (!ids.length) { setCustomQuotes([]); return; }
    setCustomLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/nse/batch`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ symbols: ids }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (!mountedRef.current) return;
      setCustomQuotes(data);
      setCustomLoading(false);
      setCustomError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      setCustomError(err.message);
      setCustomLoading(false);
    }
  }, [customKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;

    // Market movers + top picks — fire immediately, then every 90s
    setMoversLoading(true);
    fetchMovers();
    clearInterval(moversTimer.current);
    moversTimer.current = setInterval(fetchMovers, MOVERS_REFRESH_MS);

    // Custom watchlist — fire immediately if any, then every 2 min
    fetchCustom();
    clearInterval(customTimer.current);
    customTimer.current = setInterval(fetchCustom, REFRESH_MS);

    return () => {
      mountedRef.current = false;
      clearInterval(moversTimer.current);
      clearInterval(customTimer.current);
    };
  }, [fetchMovers, fetchCustom]);

  // ── Derived: custom stocks in order ─────────────────────────────────────
  const customStocks = customSymbols
    .map(id => customQuotes.find(q => q.symbol === id))
    .filter(Boolean);

  const loading = moversLoading || (customSymbols.length > 0 && customLoading);
  const error   = moversError   || customError;

  const refresh = useCallback(() => {
    setMoversLoading(true);
    fetchMovers();
    fetchCustom();
  }, [fetchMovers, fetchCustom]);

  return {
    gainers, losers,
    longTermPicks: topPicks,  // alias: WatchList still reads longTermPicks
    topPicks,
    customStocks,
    quotes:        customQuotes,
    loading,
    error,
    lastRefresh,
    marketOpen,
    prevSessionDate,
    scanned,
    refresh,
  };
}
