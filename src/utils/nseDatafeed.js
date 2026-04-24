/**
 * TradingView JS API datafeed adapter for NSE equities via Yahoo Finance proxy
 * This allows TradingView Lightweight Charts to use our server-proxied data.
 *
 * Alternatively, the TradingViewWidget can use TradingView's built-in NSE data
 * by passing NSE:SYMBOL directly (which is what TradingViewWidget.jsx does).
 */

import { API_BASE } from './api.js';

// Map timeframe ID → Yahoo Finance interval
const TF_TO_YF = {
  '5m':  '5m',
  '15m': '15m',
  '1h':  '60m',
  '1d':  '1d',
};

// Map timeframe ID → TradingView resolution string
const TF_TO_TV_RES = {
  '5m':  '5',
  '15m': '15',
  '1h':  '60',
  '1d':  'D',
};

export function getSupportedResolutions() {
  return ['5', '15', '60', 'D'];
}

export function createNseDatafeed(symbol, timeframe) {
  return {
    onReady(callback) {
      setTimeout(() => callback({
        supported_resolutions: getSupportedResolutions(),
        exchanges: [{ value: 'NSE', name: 'NSE', desc: 'National Stock Exchange India' }],
        symbols_types: [{ name: 'Equity', value: 'equity' }],
      }), 0);
    },

    resolveSymbol(symbolName, onSymbolResolvedCallback, onResolveErrorCallback) {
      const sym = symbolName.replace('NSE:', '');
      setTimeout(() => onSymbolResolvedCallback({
        name:               sym,
        full_name:          `NSE:${sym}`,
        description:        sym,
        type:               'equity',
        session:            '0915-1530',
        timezone:           'Asia/Kolkata',
        exchange:           'NSE',
        minmov:             5,
        pricescale:         100,
        has_intraday:       true,
        intraday_multipliers: ['5', '15', '60'],
        has_daily:          true,
        has_weekly_and_monthly: false,
        supported_resolutions: getSupportedResolutions(),
        volume_precision:   0,
        data_status:        'streaming',
        currency_code:      'INR',
      }), 0);
    },

    async getBars(symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) {
      try {
        const sym = symbolInfo.name;
        const tfId = Object.keys(TF_TO_TV_RES).find(k => TF_TO_TV_RES[k] === resolution) || '1d';

        const response = await fetch(`${API_BASE}/api/nse/chart`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ symbol: sym, timeframe: tfId }),
        });

        if (!response.ok) throw new Error(`Server error ${response.status}`);
        const data = await response.json();

        if (!data.candles?.length) {
          onHistoryCallback([], { noData: true });
          return;
        }

        const bars = data.candles
          .filter(c => c.timestamp && c.close)
          .map(c => ({
            time:   c.timestamp * 1000,
            open:   c.open,
            high:   c.high,
            low:    c.low,
            close:  c.close,
            volume: c.volume,
          }))
          .sort((a, b) => a.time - b.time);

        onHistoryCallback(bars, { noData: bars.length === 0 });
      } catch (err) {
        onErrorCallback(err.message);
      }
    },

    subscribeBars(symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback) {
      // Real-time streaming not implemented; chart refreshes on interval
    },

    unsubscribeBars(subscriberUID) {},

    searchSymbols(userInput, exchange, symbolType, onResultReadyCallback) {
      onResultReadyCallback([]);
    },
  };
}
