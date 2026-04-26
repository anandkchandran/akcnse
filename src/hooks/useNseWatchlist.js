import { useState, useEffect, useRef, useCallback } from 'react';
import { isMarketOpen } from '../constants';

import { API_BASE } from '../utils/api.js';
const REFRESH_MS = 120_000; // 2 minutes

// Broad pool for gainers / losers / short-term scoring (Nifty 50 + Nifty Next 50 highlights)
const NIFTY50 = [
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

// Curated long-term blue-chip pool (quality > momentum)
const LONG_TERM_POOL = [
  'HDFCBANK',  'TCS',       'INFY',      'ICICIBANK',  'RELIANCE',
  'WIPRO',     'ASIANPAINT','TITAN',     'KOTAKBANK',  'NESTLEIND',
  'HCLTECH',   'SUNPHARMA', 'MARUTI',    'BHARTIARTL', 'BAJFINANCE',
  'LT',        'AXISBANK',  'DRREDDY',   'HINDUNILVR', 'DIVISLAB',
  'ULTRACEMCO','TATACONSUM','HDFCLIFE',  'SBILIFE',    'BAJAJFINSV',
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
    const all = [...new Set([...NIFTY50, ...LONG_TERM_POOL, ...customSymbols])];
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
  const niftyQuotes = quotes.filter(q => NIFTY50.includes(q.symbol));
  const sorted      = [...niftyQuotes].sort((a, b) => b.change - a.change);

  // Gainers: top 15 best performers
  const gainers = sorted.slice(0, 15);
  // Losers: bottom 15 worst performers
  const losers  = [...sorted].reverse().slice(0, 15);

  // Short-term picks (15): high momentum × volume — intraday / swing trading focus
  const shortTermPicks = (() => {
    const valid = niftyQuotes.filter(q => q.volume > 0 && q.price > 0);
    if (!valid.length) return [];
    const maxVol    = Math.max(...valid.map(q => q.volume));
    const minChange = Math.min(...valid.map(q => q.change));
    const maxChange = Math.max(...valid.map(q => q.change));
    const chgRange  = maxChange - minChange || 1;
    return [...valid]
      .map(q => ({
        ...q,
        _score: ((q.change - minChange) / chgRange) * 0.6 + (q.volume / maxVol) * 0.4,
      }))
      .sort((a, b) => b._score - a._score)
      .slice(0, 15);
  })();

  // Long-term picks (15): blue-chip pool sorted by today's relative strength
  const longTermPicks = (() => {
    const pool = quotes.filter(q => LONG_TERM_POOL.includes(q.symbol) && q.price > 0);
    if (!pool.length) return [];
    // Sort by change desc so strongest performers in the blue-chip basket appear first
    return [...pool]
      .sort((a, b) => b.change - a.change)
      .slice(0, 15);
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
    gainers, losers, shortTermPicks, longTermPicks,
    quotes, customStocks,
    loading, error, lastRefresh,
    marketOpen, prevSessionDate,
    refresh: fetchAll,
  };
}
