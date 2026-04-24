import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useNseWatchlist } from '../hooks/useNseWatchlist';
import { EQUITY_SYMBOLS } from '../constants';
import { fmtPrice, fmtVolume } from '../utils/format';

// ── Individual stock row ──────────────────────────────────────────────────────
function StockRow({ stock, isActive, onSelect, onRemove, C }) {
  const isGainer = stock.change >= 0;
  const clr      = isGainer ? C.bull : C.bear;

  return (
    <div
      onClick={() => onSelect(stock.symbol)}
      style={{
        display:     'flex',
        alignItems:  'center',
        padding:     '7px 10px',
        cursor:      'pointer',
        borderLeft:  isActive ? `3px solid ${clr}` : '3px solid transparent',
        background:  isActive ? `${clr}12` : 'transparent',
        borderBottom: `1px solid ${C.border}18`,
        transition:  'background 0.1s',
        gap:          4,
        WebkitTapHighlightColor: 'transparent',
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = `${C.muted}10`; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isActive ? `${clr}12` : 'transparent'; }}
    >
      {/* Left: symbol + price */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
          <span style={{
            fontFamily:   "'Raleway', sans-serif",
            fontSize:      11,
            fontWeight:    800,
            color:         isActive ? clr : C.bright,
            letterSpacing: 0.2,
            overflow:      'hidden',
            textOverflow:  'ellipsis',
            whiteSpace:    'nowrap',
          }}>
            {stock.symbol}
          </span>
          <span style={{ fontFamily: "'Roboto Mono', monospace", fontSize: 11, fontWeight: 700, color: clr, flexShrink: 0, marginLeft: 4 }}>
            {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: "'Roboto Mono', monospace", fontSize: 10, fontWeight: 600, color: C.text }}>
            ₹{fmtPrice(stock.price)}
          </span>
          <span style={{ fontFamily: "'Roboto Mono', monospace", fontSize: 10, fontWeight: 600, color: C.text }}>
            {fmtVolume(stock.volume)}
          </span>
        </div>
      </div>

      {/* Remove button (only for custom watchlist) */}
      {onRemove && (
        <button
          onClick={e => { e.stopPropagation(); onRemove(stock.symbol); }}
          title="Remove from watchlist"
          style={{
            background:   'transparent',
            border:       'none',
            color:         C.muted,
            fontSize:      13,
            padding:      '0 2px',
            lineHeight:    1,
            flexShrink:    0,
            opacity:       0.5,
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = C.bear; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.color = C.muted; }}
        >
          ×
        </button>
      )}
    </div>
  );
}

// ── Inline add-to-watchlist search ────────────────────────────────────────────
function AddEquitySearch({ onAdd, C }) {
  const [query,  setQuery]  = useState('');
  const [open,   setOpen]   = useState(false);
  const wrapRef  = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false); setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const q = query.trim().toUpperCase();
  const results = q.length < 1 ? [] : EQUITY_SYMBOLS.filter(s =>
    s.id.startsWith(q) || s.label.toUpperCase().includes(q)
  ).slice(0, 8);

  return (
    <div ref={wrapRef} style={{ position: 'relative', padding: '6px 10px' }}>
      <div style={{
        display:      'flex',
        alignItems:   'center',
        gap:           5,
        background:    C.bg,
        border:       `1px solid ${open ? '#3b82f6' : C.border}`,
        borderRadius:  5,
        padding:      '4px 8px',
        transition:   'border-color 0.15s',
      }}>
        <span style={{ color: C.muted, fontSize: 11 }}>+</span>
        <input
          ref={inputRef}
          value={query}
          placeholder="Add equity to watchlist…"
          onFocus={() => setOpen(true)}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && results.length === 1) { onAdd(results[0]); setQuery(''); }
            if (e.key === 'Escape') { setOpen(false); setQuery(''); }
          }}
          style={{
            background: 'transparent',
            border:     'none',
            outline:    'none',
            fontFamily: "'Raleway', sans-serif",
            fontSize:    11,
            color:       C.text,
            width:       '100%',
          }}
        />
      </div>

      {open && results.length > 0 && (
        <div style={{
          position:    'absolute',
          top:         'calc(100% - 2px)',
          left:         10,
          right:        10,
          zIndex:       500,
          background:   C.card,
          border:       `1px solid ${C.border}`,
          borderRadius: 6,
          maxHeight:    220,
          overflowY:   'auto',
          boxShadow:   '0 6px 20px #00000060',
        }}>
          {results.map(s => (
            <div
              key={s.id}
              onClick={() => { onAdd(s); setQuery(''); setOpen(false); }}
              style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                padding:        '6px 10px',
                cursor:         'pointer',
                borderBottom:   `1px solid ${C.border}20`,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#1a2a4060'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, fontWeight: 700, color: C.bright }}>
                {s.label}
              </span>
              <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 9, color: C.muted }}>
                {s.sector}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main WatchList component ──────────────────────────────────────────────────
export default function WatchList({ currentSymbol, onSelect, customIds = [], onAdd, onRemove }) {
  const { colors: C } = useTheme();
  const [tab, setTab] = useState('picks'); // picks | gainers | losers

  const { gainers, losers, recommended, customStocks, loading, error, lastRefresh, refresh, marketOpen, prevSessionDate } =
    useNseWatchlist(customIds);

  const handleSelect = (symbolId) => {
    const sym = EQUITY_SYMBOLS.find(s => s.id === symbolId);
    if (sym) onSelect(sym);
  };

  // ── Tab definitions ─────────────────────────────────────────────────────────
  const TABS = [
    { id: 'picks',   label: '★ Picks',   color: '#f59e0b' },
    { id: 'gainers', label: '▲ Gainers', color: C.bull    },
    { id: 'losers',  label: '▼ Losers',  color: C.bear    },
  ];

  const listMap = {
    picks: recommended,
    gainers,
    losers,
  };
  const list = listMap[tab] ?? [];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <div style={{
        padding:     '10px 10px 6px',
        borderBottom: `1px solid ${C.border}`,
        background:   C.card,
        flexShrink:   0,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              fontFamily:    "'Raleway', sans-serif",
              fontSize:       10,
              fontWeight:     700,
              color:          C.muted,
              textTransform: 'uppercase',
              letterSpacing:  1,
            }}>
              NSE Equities
            </span>
            {!loading && (
              <span style={{
                fontFamily:    "'Raleway', sans-serif",
                fontSize:       8,
                fontWeight:     700,
                color:          marketOpen ? C.bull : '#f59e0b',
                background:    marketOpen ? `${C.bull}18` : '#f59e0b18',
                border:        `1px solid ${marketOpen ? `${C.bull}40` : '#f59e0b40'}`,
                borderRadius:   3,
                padding:       '1px 5px',
                letterSpacing:  0.5,
                whiteSpace:    'nowrap',
              }}>
                {marketOpen ? '1H change' : (prevSessionDate ? `Prev · ${prevSessionDate}` : 'Prev Session')}
              </span>
            )}
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            style={{
              fontFamily:  "'Raleway', sans-serif",
              fontSize:     10,
              padding:     '2px 7px',
              borderRadius: 3,
              border:      `1px solid ${C.border}`,
              background:  'transparent',
              color:        loading ? C.muted : C.text,
            }}
          >
            {loading ? '…' : '↻'}
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 3 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex:         1,
                fontFamily:  "'Raleway', sans-serif",
                fontWeight:   tab === t.id ? 800 : 700,
                fontSize:     11,
                padding:     '5px 4px',
                borderRadius: 4,
                border:      `1px solid ${tab === t.id ? `${t.color}60` : C.border}`,
                background:   tab === t.id ? `${t.color}18` : 'transparent',
                color:        tab === t.id ? t.color : C.text,
                textTransform: 'none',
                whiteSpace:   'nowrap',
              }}
            >
              {t.label}
              {t.id === 'picks' && recommended.length > 0 && (
                <span style={{ marginLeft: 4, background: `${t.color}30`, borderRadius: 3, padding: '0 4px', fontSize: 8 }}>
                  {recommended.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Subtitle ── */}
      {!loading && (
        <div style={{
          padding:    '4px 10px',
          borderBottom: `1px solid ${C.border}20`,
          fontFamily: "'Raleway', sans-serif",
          fontSize:    8,
          color:       C.muted,
          flexShrink:  0,
          letterSpacing: 0.3,
        }}>
          {tab === 'picks' && (
            marketOpen
              ? 'Top 10 by momentum × volume · 1H change'
              : `Top 10 by momentum × volume · last session${prevSessionDate ? ` (${prevSessionDate})` : ''}`
          )}
          {(tab === 'gainers' || tab === 'losers') && (
            marketOpen
              ? 'Ranked by hourly change · NSE live'
              : `Ranked by last session change${prevSessionDate ? ` · ${prevSessionDate}` : ''} · market closed`
          )}
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div style={{
          padding:     '7px 10px',
          background:   '#f8514912',
          borderBottom: `1px solid ${C.border}`,
          fontFamily:  "'Raleway', sans-serif",
          fontSize:     9,
          color:        '#f85149',
          flexShrink:   0,
        }}>
          ⚠ {error.includes('fetch') || error.includes('server') || error.includes('ECONNREFUSED')
            ? 'Start node server.js to load live data'
            : error}
        </div>
      )}

      {/* ── Loading ── */}
      {loading && list.length === 0 && (
        <div style={{
          flex:           1,
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          justifyContent: 'center',
          gap:            8,
          color:          C.muted,
        }}>
          <div style={{ fontSize: 20, animation: 'statusPulse 1.5s infinite' }}>₹</div>
          <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11 }}>Loading NSE data…</div>
        </div>
      )}

      {/* ── Empty Picks (server not running) ── */}
      {!loading && tab === 'picks' && list.length === 0 && (
        <div style={{
          padding:    '20px 12px',
          fontFamily: "'Raleway', sans-serif",
          fontSize:    11,
          color:       C.muted,
          textAlign:  'center',
          lineHeight:  1.6,
        }}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>★</div>
          No data yet.
          <br />
          <span style={{ fontSize: 10 }}>Requires node server.js<br />to score live NSE data.</span>
        </div>
      )}

      {/* ── Stock list ── */}
      {!loading && list.length > 0 && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {list.map(stock => (
            <StockRow
              key={stock.symbol}
              stock={stock}
              isActive={stock.symbol === currentSymbol?.id}
              onSelect={handleSelect}
              onRemove={null}
              C={C}
            />
          ))}
        </div>
      )}

      {/* ── Footer ── */}
      {lastRefresh && (
        <div style={{
          padding:     '4px 10px',
          borderTop:   `1px solid ${C.border}`,
          fontFamily:  "'Raleway', sans-serif",
          fontSize:     8,
          color:        C.muted,
          flexShrink:   0,
        }}>
          Updated {lastRefresh.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })} IST
        </div>
      )}

      <style>{`@keyframes statusPulse { 0%,100%{opacity:1} 50%{opacity:.35} }`}</style>
    </div>
  );
}
