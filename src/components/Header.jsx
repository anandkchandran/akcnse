import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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

// ── Search helpers ─────────────────────────────────────────────────────────────

// Score a symbol against a query (higher = better match)
function scoreSymbol(s, raw) {
  const q = raw.trim().toUpperCase();
  if (!q) return 0;
  const id      = s.id.toUpperCase();
  const name    = (s.name    || '').toUpperCase();
  const label   = (s.label  || '').toUpperCase();
  const sector  = (s.sector || '').toUpperCase();
  const aliases = (s.aliases || []).map(a => a.toUpperCase());
  const nameWords = name.split(/\s+/);

  if (id === q)                                          return 100;
  if (label === q)                                       return 99;
  if (id.startsWith(q))                                  return 90;
  if (name.startsWith(q))                                return 85;
  if (aliases.some(a => a === q))                        return 82;
  if (aliases.some(a => a.startsWith(q)))                return 72;
  if (nameWords.some(w => w.startsWith(q)))              return 68;
  if (aliases.some(a => a.includes(q)))                  return 56;
  if (id.includes(q))                                    return 50;
  if (name.includes(q))                                  return 45;
  if (sector.includes(q))                                return 22;
  return 0;
}

// Highlight the matched portion of text
function Highlight({ text, query }) {
  if (!query) return <>{text}</>;
  const idx = text.toUpperCase().indexOf(query.toUpperCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ color: '#60a5fa', fontWeight: 700 }}>{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}

// ── Sector colours ────────────────────────────────────────────────────────────
const SECTOR_COLORS = {
  Banking:  '#3b82f6', IT:       '#a78bfa', Auto:    '#fbbf24',
  Pharma:   '#10d67a', FMCG:     '#f97316', Finance: '#60a5fa',
  Energy:   '#f85149', Infra:    '#94a3b8', Metal:   '#c0cfe0',
  Power:    '#facc15', Telecom:  '#34d399', Consumer:'#fb923c',
  Mining:   '#a3a3a3',
};
function sectorColor(s) { return SECTOR_COLORS[s] || '#6b7280'; }

const BROWSE_SECTORS = ['All', 'Banking', 'IT', 'Auto', 'Pharma', 'FMCG', 'Finance', 'Energy', 'Infra', 'Consumer'];

// ── Symbol search ─────────────────────────────────────────────────────────────
function SymbolSearch({ symbol, onSymbol }) {
  const { colors: C, theme } = useTheme();
  const [query,    setQuery]    = useState('');
  const [open,     setOpen]     = useState(false);
  const [checking, setChecking] = useState(false);
  const [badSym,   setBadSym]   = useState(false);
  const [sector,   setSector]   = useState('All');
  const [focusIdx, setFocusIdx] = useState(-1);
  const wrapRef  = useRef(null);
  const inputRef = useRef(null);
  const listRef  = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false); setQuery(''); setBadSym(false); setFocusIdx(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Reset focus index when results change
  useEffect(() => { setFocusIdx(-1); }, [query, sector]);

  const q = query.trim();

  // Filtered + scored results
  const results = useMemo(() => {
    let pool = EQUITY_SYMBOLS;
    if (sector !== 'All') pool = pool.filter(s => s.sector === sector);

    if (!q) return pool.slice(0, 10);

    return pool
      .map(s => ({ s, score: scoreSymbol(s, q) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(({ s }) => s);
  }, [q, sector]);

  // Validate arbitrary ticker against NSE via proxy server
  const validateAndSelect = useCallback(async (raw) => {
    const cleaned = raw.trim().toUpperCase().replace(/[^A-Z0-9&-]/g, '');
    if (!cleaned) return;
    const known = EQUITY_SYMBOLS.find(s => s.id === cleaned);
    if (known) { onSymbol(known); setOpen(false); setQuery(''); return; }

    setChecking(true); setBadSym(false);
    try {
      const res  = await fetch(`${API_BASE}/api/nse/chart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: cleaned, timeframe: '1d' }),
      });
      const data = await res.json();
      if (res.ok && data.candles?.length > 0) {
        const dynSym = {
          label:   cleaned, id: cleaned,
          yahoo:   `${cleaned}.NS`, tv: `NSE:${cleaned}`,
          sector:  'NSE Equity', dynamic: true,
        };
        onSymbol(dynSym); setOpen(false); setQuery('');
      } else {
        setBadSym(true);
      }
    } catch {
      setBadSym(true);
    } finally {
      setChecking(false);
    }
  }, [onSymbol]);

  const selectResult = useCallback((s) => {
    onSymbol(s); setOpen(false); setQuery(''); setBadSym(false); setFocusIdx(-1);
  }, [onSymbol]);

  const handleKey = (e) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      if (focusIdx >= 0 && results[focusIdx]) {
        selectResult(results[focusIdx]);
      } else if (results.length === 1) {
        selectResult(results[0]);
      } else if (q) {
        validateAndSelect(q);
      }
    } else if (e.key === 'Escape') {
      setOpen(false); setQuery(''); setBadSym(false); setFocusIdx(-1);
    }
  };

  // Scroll focused item into view
  useEffect(() => {
    if (focusIdx >= 0 && listRef.current) {
      const el = listRef.current.querySelector(`[data-idx="${focusIdx}"]`);
      if (el) el.scrollIntoView({ block: 'nearest' });
    }
  }, [focusIdx]);

  const isDark = theme === 'dark';
  const borderColor = badSym ? '#f85149' : open ? '#3b82f6' : C.border;
  const noExactMatch = q && results.length === 0;
  const hasPartialResults = q && results.length > 0 && results.length < 10;

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {/* ── Input box ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: C.bg, border: `1px solid ${borderColor}`,
        borderRadius: 6, padding: '4px 10px',
        minWidth: 180, transition: 'border-color 0.15s',
      }}>
        <span style={{ color: C.muted, fontSize: 12, flexShrink: 0 }}>⌕</span>
        <input
          ref={inputRef}
          value={open ? query : ''}
          placeholder={open ? 'Search by name, brand, ticker…' : (symbol.name || symbol.label)}
          onFocus={() => { setOpen(true); setBadSym(false); }}
          onChange={e => { setQuery(e.target.value); setBadSym(false); }}
          onKeyDown={handleKey}
          style={{
            background: 'transparent', border: 'none', outline: 'none',
            fontFamily: "'Raleway', sans-serif",
            fontSize:   open ? 12 : 11,
            fontWeight: open ? 400 : 700,
            color:      open ? C.text : C.bright,
            width:      open ? 170 : 145,
            cursor:     'text',
            transition: 'width 0.15s',
          }}
        />
        {checking && (
          <span style={{ fontSize: 10, color: '#3b82f6', animation: 'statusPulse 1s infinite', flexShrink: 0 }}>…</span>
        )}
        {open && query && (
          <button
            onClick={() => { setQuery(''); setBadSym(false); inputRef.current?.focus(); }}
            style={{
              background: 'transparent', border: 'none', padding: '0 2px',
              color: C.muted, cursor: 'pointer', fontSize: 12, flexShrink: 0, lineHeight: 1,
            }}
          >✕</button>
        )}
      </div>

      {/* ── Dropdown ── */}
      {open && (
        <div style={{
          position: 'absolute', top: '110%', left: 0, zIndex: 999,
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 8, minWidth: 320, maxHeight: 400,
          overflowY: 'hidden', boxShadow: '0 8px 32px #00000070',
          display: 'flex', flexDirection: 'column',
        }}>

          {/* ── Sector chips (browse mode — only shown when no query) ── */}
          {!q && (
            <div style={{
              display: 'flex', gap: 5, padding: '8px 10px 6px',
              overflowX: 'auto', flexShrink: 0,
              borderBottom: `1px solid ${C.border}30`,
            }}>
              {BROWSE_SECTORS.map(sec => {
                const active = sector === sec;
                const col = sec === 'All' ? '#6b7280' : sectorColor(sec);
                return (
                  <button
                    key={sec}
                    onClick={() => setSector(sec)}
                    style={{
                      flexShrink: 0, fontFamily: "'Raleway', sans-serif",
                      fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
                      padding: '3px 8px', borderRadius: 20, cursor: 'pointer',
                      background: active ? `${col}25` : 'transparent',
                      color:      active ? col : C.muted,
                      border:     `1px solid ${active ? `${col}60` : C.border}`,
                      transition: 'all 0.12s',
                    }}
                  >
                    {sec}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Section label ── */}
          <div style={{
            padding: '5px 12px 3px', flexShrink: 0,
            fontFamily: "'Raleway', sans-serif", fontSize: 9,
            color: C.muted, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase',
          }}>
            {q
              ? `${results.length} match${results.length !== 1 ? 'es' : ''} for "${q}"`
              : sector === 'All' ? 'Popular stocks' : `${sector} stocks`
            }
          </div>

          {/* ── Result rows ── */}
          <div ref={listRef} style={{ overflowY: 'auto', flex: 1 }}>

            {/* No match: offer NSE lookup */}
            {noExactMatch && (
              <div style={{ padding: '8px 12px' }}>
                {badSym ? (
                  <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: '#f85149' }}>
                    ✗ "{q.toUpperCase()}" not found on NSE
                  </div>
                ) : (
                  <div
                    onClick={() => validateAndSelect(q)}
                    style={{
                      fontFamily: "'Raleway', sans-serif", fontSize: 11, color: '#3b82f6',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                      padding: '7px 10px', borderRadius: 6,
                      background: '#3b82f610', border: '1px solid #3b82f630',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#3b82f620'}
                    onMouseLeave={e => e.currentTarget.style.background = '#3b82f610'}
                  >
                    <span style={{ fontSize: 15 }}>⊕</span>
                    <div>
                      <div style={{ fontWeight: 700 }}>Search "{q.toUpperCase()}" directly on NSE</div>
                      <div style={{ fontSize: 9, color: C.muted, marginTop: 1 }}>Load any NSE-listed ticker not in the built-in list</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Symbol rows */}
            {results.map((s, idx) => {
              const isCurrent = s.id === symbol.id;
              const isFocused = idx === focusIdx;
              const col = sectorColor(s.sector);
              const bg = isFocused
                ? (isDark ? '#1a2d45' : '#dbeafe')
                : isCurrent
                  ? (isDark ? '#1e3a5f' : '#eff6ff')
                  : 'transparent';

              return (
                <div
                  key={s.id}
                  data-idx={idx}
                  onClick={() => selectResult(s)}
                  onMouseEnter={() => setFocusIdx(idx)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', cursor: 'pointer',
                    background: bg, borderBottom: `1px solid ${C.border}15`,
                    transition: 'background 0.08s',
                  }}
                >
                  {/* Left: company name + ticker row */}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                      fontFamily: "'Raleway', sans-serif", fontSize: 12,
                      fontWeight: 700, color: C.bright,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      <Highlight text={s.name || s.label} query={q} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                      <span className="mono" style={{ fontSize: 10, color: C.muted, fontWeight: 500 }}>
                        <Highlight text={s.label} query={q} />
                      </span>
                      <span style={{
                        fontSize: 8, fontFamily: "'Raleway', sans-serif", fontWeight: 700,
                        color: col, background: `${col}18`,
                        border: `1px solid ${col}28`, padding: '0 5px', borderRadius: 10,
                        letterSpacing: 0.3,
                      }}>
                        {s.sector}
                      </span>
                    </div>
                  </div>

                  {/* Right: active check */}
                  {isCurrent && (
                    <span style={{ fontSize: 12, color: '#10d67a', flexShrink: 0, marginLeft: 8 }}>✓</span>
                  )}
                </div>
              );
            })}

            {/* Partial results: also offer direct NSE lookup */}
            {hasPartialResults && (
              <div
                onClick={() => validateAndSelect(q)}
                style={{
                  padding: '6px 12px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontFamily: "'Raleway', sans-serif", fontSize: 10, color: '#3b82f6',
                  borderTop: `1px solid ${C.border}20`,
                }}
                onMouseEnter={e => e.currentTarget.style.background = isDark ? '#0d1628' : '#f0f4ff'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span>⊕</span> Load "{q.toUpperCase()}" directly from NSE
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div style={{
            padding: '5px 12px', borderTop: `1px solid ${C.border}30`, flexShrink: 0,
            fontFamily: "'Raleway', sans-serif", fontSize: 9, color: C.muted,
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span>{q ? '↑↓ navigate · Enter to select' : 'Type a name, brand, or ticker'}</span>
            <span>Esc to close</span>
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
