import React, { useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Candlestick chart powered by TradingView Lightweight Charts (open-source).
 * Uses our own Yahoo Finance / NSE data — no TradingView account required.
 * https://tradingview.github.io/lightweight-charts/
 */

const LW_CDN = 'https://cdn.jsdelivr.net/npm/lightweight-charts@4.2.0/dist/lightweight-charts.standalone.production.js';

// Singleton loader — only injects the <script> once per page
let _lwPromise = null;
function loadLW() {
  if (window.LightweightCharts) return Promise.resolve(window.LightweightCharts);
  if (_lwPromise) return _lwPromise;
  _lwPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src     = LW_CDN;
    s.onload  = () => resolve(window.LightweightCharts);
    s.onerror = () => {
      _lwPromise = null;
      reject(new Error('Could not load Lightweight Charts from CDN'));
    };
    document.head.appendChild(s);
  });
  return _lwPromise;
}

export default function TradingViewWidget({ symbol, candles, inds }) {
  const { theme, colors: C } = useTheme();
  const wrapRef  = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!wrapRef.current || !candles?.length) return;

    let cancelCleanup = () => {};

    loadLW().then(LW => {
      if (!wrapRef.current) return; // unmounted while loading

      // Destroy previous chart instance
      if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }

      const dark = theme === 'dark';

      const chart = LW.createChart(wrapRef.current, {
        width:  wrapRef.current.clientWidth,
        height: 440,
        layout: {
          background: { type: 'solid', color: dark ? '#0d1117' : '#f9fafb' },
          textColor:  dark ? '#8ca3be' : '#374151',
          fontFamily: "'Roboto Mono', monospace",
          fontSize:   11,
        },
        grid: {
          vertLines: { color: dark ? '#1a2236' : '#e5e7eb', style: 1 },
          horzLines: { color: dark ? '#1a2236' : '#e5e7eb', style: 1 },
        },
        crosshair:       { mode: 1 },
        rightPriceScale: { borderColor: dark ? '#1a2236' : '#d1d5db' },
        timeScale: {
          borderColor:    dark ? '#1a2236' : '#d1d5db',
          timeVisible:    true,
          secondsVisible: false,
        },
      });

      chartRef.current = chart;

      // ── Deduplicate & sort candles by timestamp ───────────────────────────────
      const seen = new Set();
      const ohlc = candles
        .filter(c => c.timestamp && c.close != null && !seen.has(c.timestamp) && seen.add(c.timestamp))
        .sort((a, b) => a.timestamp - b.timestamp);

      // ── Candlestick series ────────────────────────────────────────────────────
      const candleSeries = chart.addCandlestickSeries({
        upColor:         '#22c55e',
        downColor:       '#ef4444',
        borderUpColor:   '#22c55e',
        borderDownColor: '#ef4444',
        wickUpColor:     '#22c55e',
        wickDownColor:   '#ef4444',
      });
      candleSeries.setData(ohlc.map(c => ({
        time:  c.timestamp,
        open:  c.open,
        high:  c.high,
        low:   c.low,
        close: c.close,
      })));

      // ── Volume histogram (overlaid at bottom 18% of chart) ───────────────────
      const volSeries = chart.addHistogramSeries({
        priceFormat:   { type: 'volume' },
        priceScaleId:  '',                       // separate scale
        scaleMargins:  { top: 0.82, bottom: 0 },
      });
      volSeries.setData(ohlc.map(c => ({
        time:  c.timestamp,
        value: c.volume ?? 0,
        color: c.close >= c.open ? '#22c55e28' : '#ef444428',
      })));

      // ── EMA overlay helper ────────────────────────────────────────────────────
      const addEma = (values, color, title) => {
        if (!values?.length) return;
        // Align indicator array with the de-duped/sorted ohlc array
        const tsIndex = new Map(candles.map((c, i) => [c.timestamp, i]));
        const pts = ohlc
          .map(c => ({ time: c.timestamp, value: values[tsIndex.get(c.timestamp)] }))
          .filter(p => p.value != null && isFinite(p.value));
        if (!pts.length) return;
        chart.addLineSeries({
          color,
          lineWidth: 1,
          title,
          crosshairMarkerVisible: false,
          lastValueVisible: true,
          priceLineVisible: false,
        }).setData(pts);
      };

      addEma(inds?.e9,  '#f59e0b', 'EMA9');
      addEma(inds?.e21, '#8b5cf6', 'EMA21');
      addEma(inds?.e50, '#64748b', 'EMA50');

      chart.timeScale().fitContent();

      // ── Responsive resize ─────────────────────────────────────────────────────
      const ro = new ResizeObserver(() => {
        if (chartRef.current && wrapRef.current) {
          chartRef.current.applyOptions({ width: wrapRef.current.clientWidth });
        }
      });
      ro.observe(wrapRef.current);

      cancelCleanup = () => {
        ro.disconnect();
        if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }
      };
    }).catch(err => console.error('[LightweightCharts]', err));

    return () => cancelCleanup();
  }, [candles, inds, theme]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      background:   C.card,
      border:       `1px solid ${C.border}`,
      borderRadius: 8,
      overflow:     'hidden',
      marginBottom: 10,
    }}>
      {/* ── Header bar ──────────────────────────────────────────────────────── */}
      <div style={{
        padding:      '6px 12px',
        borderBottom: `1px solid ${C.border}`,
        display:      'flex',
        alignItems:   'center',
        gap:           6,
      }}>
        <span style={{
          fontFamily:    "'Raleway', sans-serif",
          fontSize:       10,
          fontWeight:     600,
          color:          C.muted,
          textTransform: 'uppercase',
          letterSpacing:  0.8,
        }}>
          Candlestick Chart
        </span>
        <span style={{
          fontFamily:  "'Raleway', sans-serif",
          fontSize:     8,
          color:        '#3b82f6',
          background:  '#3b82f618',
          border:      '1px solid #3b82f630',
          padding:     '1px 6px',
          borderRadius: 3,
        }}>
          {symbol.tv}
        </span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          {[['EMA9','#f59e0b'],['EMA21','#8b5cf6'],['EMA50','#64748b']].map(([l, c]) => (
            <span key={l} style={{ fontFamily: "'Roboto Mono', monospace", fontSize: 9, color: c }}>● {l}</span>
          ))}
        </span>
      </div>

      {/* ── Chart area ──────────────────────────────────────────────────────── */}
      {!candles?.length ? (
        <div style={{
          height:          440,
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          color:            C.muted,
          fontFamily:      "'Raleway', sans-serif",
          fontSize:         13,
        }}>
          Loading chart data…
        </div>
      ) : (
        <div ref={wrapRef} style={{ width: '100%', height: 440 }} />
      )}
    </div>
  );
}
