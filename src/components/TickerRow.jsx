import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { fmtPrice, fmtVolume, fmtPct } from '../utils/format';

export default function TickerRow({ ticker, symbol }) {
  const { colors: C } = useTheme();
  if (!ticker) return null;

  const up  = ticker.change >= 0;
  const pc  = up ? C.bull : C.bear;

  return (
    <div style={{
      display:      'flex',
      alignItems:   'center',
      gap:           0,
      padding:      '0 14px',
      background:    C.card,
      borderBottom: `1px solid ${C.border}`,
      overflowX:    'auto',
      flexWrap:     'nowrap',
    }}>
      {/* ── Symbol + sector badge ── */}
      <div style={{
        padding:     '10px 18px 10px 4px',
        borderRight: `1px solid ${C.border}`,
        marginRight:  16,
        flexShrink:   0,
      }}>
        <div style={{
          fontFamily:   "'Raleway', sans-serif",
          fontSize:      18,
          fontWeight:    800,
          color:         C.bright,
          letterSpacing: 0.5,
          lineHeight:    1,
          marginBottom:  4,
        }}>
          {symbol.label}
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{
            fontFamily:    "'Raleway', sans-serif",
            fontSize:       8,
            fontWeight:     700,
            textTransform:  'uppercase',
            letterSpacing:  1,
            color:          '#10d67a',
            background:    '#10d67a18',
            border:        '1px solid #10d67a40',
            padding:       '1px 6px',
            borderRadius:   3,
          }}>
            NSE
          </span>
          {symbol.sector && (
            <span style={{
              fontFamily:    "'Raleway', sans-serif",
              fontSize:       8,
              fontWeight:     600,
              color:          C.muted,
              background:    `${C.border}50`,
              padding:       '1px 5px',
              borderRadius:   3,
            }}>
              {symbol.sector}
            </span>
          )}
        </div>
      </div>

      {/* ── Price — hero element ── */}
      <div style={{ paddingRight: 24, borderRight: `1px solid ${C.border}`, marginRight: 16, flexShrink: 0 }}>
        <div style={{
          fontFamily:    "'Raleway', sans-serif",
          fontSize:       10,
          fontWeight:     600,
          color:          C.muted,
          textTransform:  'uppercase',
          letterSpacing:  0.8,
          marginBottom:   3,
        }}>
          LTP
        </div>
        <div className="mono" style={{ fontSize: 26, fontWeight: 700, color: pc, lineHeight: 1 }}>
          ₹{fmtPrice(ticker.price)}
        </div>
      </div>

      {/* ── Change ── */}
      <Stat
        label="Day Change"
        value={fmtPct(ticker.change)}
        color={pc}
        badge={up ? '▲' : '▼'}
        C={C}
      />

      {/* ── Day High / Low ── */}
      <Stat label="Day High" value={`₹${fmtPrice(ticker.high24)}`} color="#60a5fa" C={C} />
      <Stat label="Day Low"  value={`₹${fmtPrice(ticker.low24)}`}  color="#60a5fa" C={C} />

      {/* ── Volume ── */}
      <Stat label="Volume (Shares)" value={fmtVolume(ticker.volume)} color="#a78bfa" C={C} />

      {/* ── Prev Close ── */}
      {ticker.prevClose > 0 && (
        <Stat label="Prev Close" value={`₹${fmtPrice(ticker.prevClose)}`} color={C.muted} C={C} />
      )}
    </div>
  );
}

function Stat({ label, value, color, badge, C }) {
  return (
    <div style={{
      padding:     '10px 18px 10px 0',
      marginRight:  16,
      flexShrink:   0,
    }}>
      <div style={{
        fontFamily:    "'Raleway', sans-serif",
        fontSize:       10,
        fontWeight:     600,
        color:          C.muted,
        textTransform:  'uppercase',
        letterSpacing:  0.8,
        marginBottom:   4,
      }}>
        {label}
      </div>
      <div className="mono" style={{
        fontSize:   17,
        fontWeight: 700,
        color,
        lineHeight: 1,
        display:    'flex',
        alignItems: 'center',
        gap:         4,
      }}>
        {badge && <span style={{ fontSize: 11 }}>{badge}</span>}
        {value}
      </div>
    </div>
  );
}
