import React, { useState, useRef, useEffect, useCallback } from 'react';
import { EQUITY_SYMBOLS, TIMEFRAMES, marketStatus } from '../constants';
import { fmtDateTime } from '../utils/format';
import { useTheme } from '../contexts/ThemeContext';

import { API_BASE } from '../utils/api.js';

// ── Market status bar ─────────────────────────────────────────────────────────
export function RefreshBar({ lastUpdate, symbol, loading }) {
  const { colors: C } = useTheme();
  const status = marketStatus();

  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
      padding:        '5px 16px',
      background:      C.bg,
      borderBottom:   `1px solid ${C.border}`,
      fontSize:        11,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          display:      'inline-block',
          width:         7, height: 7,
          borderRadius: '50%',
          background:   loading ? '#fbbf24' : status.open ? '#10d67a' : '#f85149',
          boxShadow:    loading ? '0 0 6px #fbbf2480' : status.open ? '0 0 6px #10d67a80' : 'none',
          animation:    (loading || status.open) ? 'statusPulse 2s ease-in-out infinite' : 'none',
          flexShrink:   0,
        }} />
        <span style={{
          fontFamily:   "'Raleway', sans-serif",
          fontWeight:    600,
          color:         loading ? C.muted : status.open ? C.bull : C.muted,
          letterSpacing: 0.4,
        }}>
          {loading ? 'Fetching data…' : `${symbol?.label} · ${status.label}`}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: C.muted, fontFamily: "'Raleway', sans-serif" }}>Last refreshed:</span>
        <span className="mono" style={{ color: lastUpdate ? C.bright : C.muted, fontWeight: 500, fontSize: 11 }}>
          {lastUpdate ? fmtDateTime(lastUpdate) : '—'}
        </span>
      </div>
    </div>
  );
}

// ── Symbol search ─────────────────────────────────────────────────────────────
// Shows current symbol name when idle; switches to live filter on focus.
// Validates arbitrary NSE tickers against the server (like crypto-terminal
// validates against Binance) so any NSE-listed stock can be loaded.
function SymbolSearch({ symbol, onSymbol, onAddToWatchlist }) {
  const { colors: C } = useTheme();
  const [query,    setQuery]    = useState('');
  const [open,     setOpen]     = useState(false);
  const [checking, setChecking] = useState(false);
  const [badSym,   setBadSym]   = useState(false);
  const wrapRef  = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false); setQuery(''); setBadSym(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const q = query.trim().toUpperCase();

  // Known symbols that match the query — ticker, company name, or sector
  const filtered = q.length === 0
    ? EQUITY_SYMBOLS.slice(0, 12)
    : EQUITY_SYMBOLS.filter(s =>
        s.id.startsWith(q) ||
        s.label.toUpperCase().includes(q) ||
        (s.name  || '').toUpperCase().includes(q) ||
        (s.sector || '').toUpperCase().includes(q)
      ).slice(0, 12);

  // Validate arbitrary ticker against NSE via proxy server
  const validateAndSelect = useCallback(async (raw) => {
    const cleaned = raw.trim().toUpperCase().replace(/[^A-Z0-9&]/g, '');
    if (!cleaned) return;

    // Already in known list — just select it
    const known = EQUITY_SYMBOLS.find(s => s.id === cleaned);
    if (known) { onSymbol(known); setOpen(false); setQuery(''); return; }

    setChecking(true);
    setBadSym(false);
    try {
      const res = await fetch(`${API_BASE}/api/nse/chart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: cleaned, timeframe: '1d' }),
      });
      const data = await res.json();
      if (res.ok && data.candles?.length > 0) {
        // Valid NSE symbol — build a dynamic symbol object
        const dynSym = {
          label:   cleaned,
          id:      cleaned,
          yahoo:   `${cleaned}.NS`,
          tv:      `NSE:${cleaned}`,
          sector:  data.ticker?.name ? 'NSE Equity' : 'NSE Equity',
          dynamic: true,
        };
        onSymbol(dynSym);
        setOpen(false);
        setQuery('');
      } else {
        setBadSym(true);
      }
    } catch {
      setBadSym(true);
    } finally {
      setChecking(false);
    }
  }, [onSymbol]);

  const handleKey = (e) => {
    if (e.key === 'Enter') {
      if (filtered.length === 1) {
        onSymbol(filtered[0]); setOpen(false); setQuery('');
      } else if (q) {
        validateAndSelect(q);
      }
    }
    if (e.key === 'Escape') { setOpen(false); setQuery(''); setBadSym(false); }
  };

  const borderColor = badSym ? '#f85149' : open ? '#3b82f6' : C.border;

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {/* Input — shows symbol name when idle, becomes search on focus */}
      <div style={{
        display:    'flex',
        alignItems: 'center',
        gap:         6,
        background:  C.bg,
        border:     `1px solid ${borderColor}`,
        borderRadius: 6,
        padding:    '4px 10px',
        minWidth:    160,
        transition: 'border-color 0.15s',
      }}>
        <span style={{ color: C.muted, fontSize: 11 }}>⌕</span>
        <input
          ref={inputRef}
          value={open ? query : ''}
          placeholder={symbol.label}
          onFocus={() => { setOpen(true); setBadSym(false); }}
          onChange={e => { setQuery(e.target.value); setBadSym(false); }}
          onKeyDown={handleKey}
          style={{
            background: 'transparent',
            border:     'none',
            outline:    'none',
            fontFamily: "'Raleway', sans-serif",
            fontSize:    12,
            fontWeight:  open ? 400 : 700,
            color:       open ? C.text : C.bright,
            width:       120,
            cursor:     'text',
          }}
        />
        {checking && (
          <span style={{ fontSize: 10, color: '#3b82f6', animation: 'statusPulse 1s infinite' }}>…</span>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position:    'absolute',
          top:         '110%',
          left:         0,
          zIndex:       999,
          background:   C.card,
          border:       `1px solid ${C.border}`,
          borderRadius: 7,
          minWidth:     270,
          maxHeight:    300,
          overflowY:   'auto',
          boxShadow:   '0 8px 24px #00000060',
        }}>

          {/* Validate-on-NSE row: shown when query doesn't match known list */}
          {q && filtered.length === 0 && (
            <div style={{ padding: '8px 12px' }}>
              {badSym ? (
                <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: '#f85149' }}>
                  ✗ "{q}" not found on NSE
                </div>
              ) : (
                <div
                  onClick={() => validateAndSelect(q)}
                  style={{
                    fontFamily: "'Raleway', sans-serif", fontSize: 11, color: '#3b82f6',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <span style={{ fontSize: 13 }}>⊕</span>
                  Search "{q}" on NSE
                </div>
              )}
            </div>
          )}

          {/* "Search on NSE" shortcut even when partial matches exist */}
          {q && filtered.length > 0 && filtered.length < 12 && (
            <div
              onClick={() => validateAndSelect(q)}
              style={{
                padding: '5px 12px',
                fontFamily: "'Raleway', sans-serif", fontSize: 10, color: '#3b82f6',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                borderBottom: `1px solid ${C.border}20`,
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#1a2a40'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span>⊕</span> Load "{q}" directly from NSE
            </div>
          )}

          {/* Known symbol rows */}
          {filtered.map(s => (
            <div
              key={s.id}
              onClick={() => { onSymbol(s); setOpen(false); setQuery(''); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '7px 12px', cursor: 'pointer',
                background: s.id === symbol.id ? '#1e3a5f' : 'transparent',
                borderBottom: `1px solid ${C.border}20`,
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#1a2a40'}
              onMouseLeave={e => e.currentTarget.style.background = s.id === symbol.id ? '#1e3a5f' : 'transparent'}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, fontWeight: 700, color: C.bright }}>
                    {s.label}
                  </span>
                  <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 9, color: C.muted }}>
                    {s.sector}
                  </span>
                </div>
                {s.name && (
                  <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 10, color: C.text, marginTop: 1 }}>
                    {s.name}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexShrink: 0 }}>
                {s.id === symbol.id && <span style={{ fontSize: 9, color: '#10d67a' }}>✓</span>}
                <button
                  className="button-accent"
                  onClick={e => { e.stopPropagation(); onAddToWatchlist(s); }}
                  style={{ fontSize: 9, padding: '2px 6px' }}
                >+ Watch</button>
              </div>
            </div>
          ))}

          <div style={{
            padding: '5px 12px', borderTop: `1px solid ${C.border}30`,
            fontFamily: "'Raleway', sans-serif", fontSize: 9, color: C.muted,
          }}>
            {q ? 'Enter or click ⊕ to load any NSE ticker' : 'Type any NSE symbol (e.g. ZOMATO, PAYTM)'}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main header ───────────────────────────────────────────────────────────────
export default function Header({
  symbol, timeframe, view, loading, lastUpdate,
  onSymbol, onTimeframe, onView, onRefresh, onAddToWatchlist,
}) {
  const { colors: C, theme, toggleTheme } = useTheme();

  return (
    <div className="app-header-wrap" style={{ background: C.card }}>
      <header
        className="app-header"
        style={{ background: C.card, borderBottom: `1px solid ${C.border}` }}
      >
        {/* ── Brand ── */}
        <div className="brand">
          <span className="brand-name">₹ THEAKCNSE</span>
          <span style={{
            fontSize:      8,
            fontFamily:   "'Raleway', sans-serif",
            fontWeight:    700,
            color:        '#10d67a',
            background:   '#10d67a18',
            border:       '1px solid #10d67a40',
            padding:      '1px 5px',
            borderRadius:  3,
            letterSpacing: 0.8,
          }}>NSE</span>
        </div>

        {/* ── Controls ── */}
        <div className="controls">

          <SymbolSearch
            symbol={symbol}
            onSymbol={onSymbol}
            onAddToWatchlist={onAddToWatchlist}
          />

          {/* Timeframe pill */}
          <div className="pill-group">
            {TIMEFRAMES.map(t => (
              <button
                key={t.id}
                onClick={() => onTimeframe(t)}
                className={timeframe.id === t.id ? 'button-accent' : ''}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* View pill */}
          <div className="pill-group">
            {[
              { id: 'indicators',  label: 'Indicators'  },
              { id: 'tradingview', label: 'Candle Chart' },
            ].map(v => (
              <button
                key={v.id}
                onClick={() => onView(v.id)}
                className={view === v.id ? 'button-accent' : ''}
              >
                {v.label}
              </button>
            ))}
          </div>

          <button className="button-accent" onClick={onRefresh} disabled={loading}>
            {loading ? '…' : '↻ Refresh'}
          </button>

          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀' : '🌙'}
          </button>

        </div>
      </header>

      <RefreshBar lastUpdate={lastUpdate} symbol={symbol} loading={loading} />
    </div>
  );
}
