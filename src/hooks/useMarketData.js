import { useState, useEffect, useCallback, useRef } from 'react';
import { calcEMA, calcRSI, calcMACD, calcBollingerBands, calcCPR, buildChartData } from '../utils/indicators';
import { computeSignal } from '../utils/signals';
import { CANDLE_LIMIT, REFRESH_INTERVAL } from '../constants';

import { API_BASE } from '../utils/api.js';
import { trackDataLoadTime, trackApiError } from '../utils/analytics';

// ── Compute all indicators from candle array ──────────────────────────────────
function computeIndicators(candles, timeframeId) {
  const prices = candles.map(c => c.close);
  return {
    e9:  calcEMA(prices, 9),
    e21: calcEMA(prices, 21),
    e50: calcEMA(prices, 50),
    rsi: calcRSI(prices, 14),
    macd: calcMACD(prices),
    bb:  calcBollingerBands(prices),
    cpr: calcCPR(candles, timeframeId),
  };
}

// ── Main hook ─────────────────────────────────────────────────────────────────
export function useMarketData(symbol, timeframe) {
  const [state, setState] = useState({
    candles:    [],
    chartData:  [],
    ticker:     null,
    inds:       null,
    signal:     null,
    loading:    true,
    error:      null,
    lastUpdate: null,
  });

  const timerRef   = useRef(null);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    const fetchStart = Date.now();

    try {
      const response = await fetch(`${API_BASE}/api/nse/chart`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ symbol: symbol.id, timeframe: timeframe.id }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${response.status}`);
      }

      const data = await response.json();

      if (data.error) throw new Error(data.error);

      const candles = data.candles || [];
      if (candles.length < 30) {
        throw new Error(
          candles.length === 0
            ? `No market data available for ${symbol.label} — Yahoo Finance may be rate-limiting. Try again shortly.`
            : `Insufficient candle data (${candles.length} candles) — need at least 30.`
        );
      }

      // Trim to CANDLE_LIMIT
      const trimmed = candles.slice(-CANDLE_LIMIT);

      const inds      = computeIndicators(trimmed, timeframe.id);
      const signal    = computeSignal(trimmed, inds);
      const chartData = buildChartData(trimmed, inds, 120);

      const rawTicker  = data.ticker || {};
      // If ticker price is 0 (stale meta), use last candle close
      const lastClose  = trimmed[trimmed.length - 1]?.close ?? 0;
      const tickerPrice = rawTicker.price || lastClose;

      const ticker = {
        price:     tickerPrice,
        prevClose: rawTicker.prevClose || 0,
        change:    rawTicker.change    || 0,
        high24:    rawTicker.high24    || 0,
        low24:     rawTicker.low24     || 0,
        volume:    rawTicker.volume    || 0,
        name:      rawTicker.name      || symbol.label,
        currency:  rawTicker.currency  || 'INR',
        exchange:  rawTicker.exchange  || 'NSE',
      };

      if (!mountedRef.current) return;
      trackDataLoadTime(symbol, timeframe, Date.now() - fetchStart);
      setState({
        candles:    trimmed,
        chartData,
        ticker,
        inds,
        signal,
        loading:    false,
        error:      null,
        lastUpdate: new Date(),
      });
    } catch (err) {
      if (!mountedRef.current) return;
      const msg = err.message || 'Failed to fetch market data';
      trackApiError('/api/nse/chart', msg, { symbol_id: symbol.id, timeframe: timeframe.label });
      setState(prev => ({
        ...prev,
        loading: false,
        error:   msg,
      }));
    }
  }, [symbol, timeframe]);

  useEffect(() => {
    mountedRef.current = true;
    load();
    clearInterval(timerRef.current);
    timerRef.current = setInterval(load, REFRESH_INTERVAL);
    return () => {
      mountedRef.current = false;
      clearInterval(timerRef.current);
    };
  }, [load]);

  return { ...state, refresh: load };
}
