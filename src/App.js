import React, { useState, useCallback, useEffect, useRef } from 'react';
import './App.css';

import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { EQUITY_SYMBOLS, TIMEFRAMES } from './constants';
import { useMarketData } from './hooks/useMarketData';
import { initAnalytics, trackSymbolChange, trackTimeframeChange } from './utils/analytics';

import Header                 from './components/Header';
import TickerRow              from './components/TickerRow';
import { PriceChart, RSIChart, MACDChart } from './components/Charts';
import TradingViewWidget      from './components/TradingViewWidget';
import { SignalCard, SignalBreakdown, IndicatorValues, Disclaimer } from './components/SignalPanel';
import WatchList              from './components/WatchList';
import PaperTrading           from './components/PaperTrading';
import ClaudePanel            from './components/ClaudePanel';
import GeminiPanel            from './components/GeminiPanel';

const WATCHLIST_KEY = 'akcnse_custom_watchlist';

function loadWatchlist() {
  try {
    const stored = JSON.parse(localStorage.getItem(WATCHLIST_KEY) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch { return []; }
}

// ── Mobile tab bar ────────────────────────────────────────────────────────────
const MOB_TABS = [
  { id: 'markets', icon: '🇮🇳', label: 'Markets' },
  { id: 'chart',   icon: '📊', label: 'Chart'   },
  { id: 'signal',  icon: '📈', label: 'Signal'  },
];

function MobileTabBar({ active, onChange, C }) {
  return (
    <nav className="mob-tabbar" style={{ background: C.card, borderColor: C.border }}>
      {MOB_TABS.map(t => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            className="mob-tabbar__btn"
            onClick={() => onChange(t.id)}
            style={{
              background: isActive ? `${C.bull}18` : C.card,
              color:      isActive ? C.bull        : C.muted,
            }}
          >
            <span className="mob-tabbar__icon">{t.icon}</span>
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}

// ── Main app ──────────────────────────────────────────────────────────────────
function AppInner() {
  const [symbol,    setSymbol]    = useState(EQUITY_SYMBOLS[0]);
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[4]); // 1D default
  const [view,      setView]      = useState('indicators');
  const [mobTab,    setMobTab]    = useState('markets');

  // ── Analytics init ────────────────────────────────────────────────────────
  useEffect(() => { initAnalytics(); }, []);

  // Track symbol / timeframe changes (skip the very first render)
  const prevSymRef = useRef(null);
  const prevTfRef  = useRef(null);
  useEffect(() => {
    if (prevSymRef.current && prevSymRef.current !== symbol) {
      trackSymbolChange(symbol, timeframe);
    }
    prevSymRef.current = symbol;
  }, [symbol]);  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (prevTfRef.current && prevTfRef.current !== timeframe) {
      trackTimeframeChange(symbol, timeframe);
    }
    prevTfRef.current = timeframe;
  }, [timeframe]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Custom watchlist (persisted to localStorage) ─────────────────────────
  const [watchlistIds, setWatchlistIds] = useState(loadWatchlist);

  const addToWatchlist = useCallback((sym) => {
    setWatchlistIds(prev => {
      if (prev.includes(sym.id)) return prev;
      const next = [...prev, sym.id];
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeFromWatchlist = useCallback((symId) => {
    setWatchlistIds(prev => {
      const next = prev.filter(id => id !== symId);
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const { colors: C } = useTheme();

  const {
    candles, chartData, ticker, inds, signal,
    loading, error, lastUpdate, refresh,
  } = useMarketData(symbol, timeframe);

  return (
    <div className="app" style={{ background: C.bg, color: C.text }}>

      {/* ── Header ── */}
      <Header
        symbol={symbol}            timeframe={timeframe}
        view={view}                loading={loading}
        lastUpdate={lastUpdate}
        onSymbol={setSymbol}       onTimeframe={setTimeframe}
        onView={setView}           onRefresh={refresh}
        onAddToWatchlist={addToWatchlist}
      />

      {/* ── Error banner ── */}
      {error && (
        <div style={{
          background:   '#f8514912',
          border:       '1px solid #f8514940',
          margin:       '8px 12px 0',
          borderRadius:  6,
          padding:      '7px 14px',
          fontSize:      11,
          color:         C.bear,
          fontFamily:   "'Raleway', sans-serif",
          flexShrink:    0,
        }}>
          ⚠ {error}
        </div>
      )}

      {/* ── Loading splash ── */}
      {loading && !candles.length && (
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          flexDirection:  'column',
          gap:             12,
          flex:            1,
          color:           C.muted,
        }}>
          <div className="spinner">₹</div>
          <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13 }}>
            Loading {symbol.label} · {timeframe.label} from NSE…
          </div>
          <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 10, color: C.muted }}>
            Requires <code style={{ fontFamily: "'Roboto Mono', monospace" }}>node server.js</code> on :4001
          </div>
        </div>
      )}

      {/* ── Main 3-column layout ── */}
      {(!loading || candles.length > 0) && (
        <>
          <TickerRow ticker={ticker} symbol={symbol} />

          <div className="container">
            <div className="main-row">

              {/* ── Left: Watchlist ── */}
              <div
                className={`col-watch${mobTab === 'markets' ? ' mob-active' : ''}`}
                style={{ borderRight: `1px solid ${C.border}` }}
              >
                <WatchList
                  currentSymbol={symbol}
                  onSelect={(s) => { setSymbol(s); setMobTab('chart'); }}
                  customIds={watchlistIds}
                  onAdd={addToWatchlist}
                  onRemove={removeFromWatchlist}
                />
              </div>

              {/* ── Centre: Charts ── */}
              <div className={`col-chart${mobTab === 'chart' ? ' mob-active' : ''}`}>
                {view === 'tradingview'
                  ? <TradingViewWidget symbol={symbol} candles={candles} inds={inds} />
                  : (
                    <>
                      <PriceChart data={chartData} cpr={inds?.cpr} />
                      <RSIChart   data={chartData} />
                      <MACDChart  data={chartData} />
                    </>
                  )
                }
              </div>

              {/* ── Right: Signal + AI + Paper trading ── */}
              <div
                className={`col-signal${mobTab === 'signal' ? ' mob-active' : ''}`}
                style={{ borderLeft: `1px solid ${C.border}` }}
              >
                <SignalCard      signal={signal} />
                <SignalBreakdown signal={signal} />
                <IndicatorValues inds={inds} candles={candles} />

                {/* AI analysis: Claude in dev, Gemini in prod */}
                {import.meta.env.DEV
                  ? <ClaudePanel
                      symbol={symbol}  timeframe={timeframe}
                      ticker={ticker}  inds={inds}
                      signal={signal}  candles={candles}
                    />
                  : <GeminiPanel
                      symbol={symbol}  timeframe={timeframe}
                      ticker={ticker}  inds={inds}
                      signal={signal}  candles={candles}
                    />
                }

                <PaperTrading ticker={ticker} symbol={symbol} />
                <Disclaimer lastUpdate={lastUpdate} />
              </div>

            </div>
          </div>

          {/* ── Mobile tab bar ── */}
          <MobileTabBar active={mobTab} onChange={setMobTab} C={C} />
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
