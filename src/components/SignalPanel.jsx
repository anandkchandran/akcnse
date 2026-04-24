import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { fmtPrice, fmtDateTime } from '../utils/format';

// ── Helpers ───────────────────────────────────────────────────────────────────
const sigColor = (type, C) =>
  type.includes('bull') ? C.bull :
  type.includes('bear') ? C.bear :
  C.neutral;

const sigBg = (type) =>
  type.includes('bull') ? '#10d67a12' :
  type.includes('bear') ? '#f8514912' :
  '#d4a01712';

const sigIcon = (type) =>
  type.includes('bull') ? '▲' :
  type.includes('bear') ? '▼' :
  '◆';

const sectionHeadStyle = {
  fontFamily:    "'Raleway', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  fontSize:       10,
  fontWeight:     700,
  textTransform:  'uppercase',
  letterSpacing:  1,
};

function Section({ title, children }) {
  const { colors: C } = useTheme();
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        ...sectionHeadStyle,
        color:         C.muted,
        marginBottom:  8,
        borderBottom:  `1px solid ${C.border}`,
        paddingBottom: 4,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, color }) {
  const { colors: C } = useTheme();
  return (
    <div style={{
      display:        'flex',
      justifyContent: 'space-between',
      alignItems:     'center',
      padding:        '5px 8px',
      marginBottom:   3,
      background:     C.bg,
      borderRadius:   5,
      border:         `1px solid ${color}22`,
    }}>
      <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: C.muted }}>{label}</span>
      <span className="mono" style={{ fontSize: 12, fontWeight: 600, color }}>{value}</span>
    </div>
  );
}

// ── Signal Card ───────────────────────────────────────────────────────────────
export function SignalCard({ signal }) {
  const { colors: C } = useTheme();

  if (!signal) {
    return (
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, marginBottom: 10 }}>
        <div style={{ ...sectionHeadStyle, color: C.muted, marginBottom: 8 }}>AI Signal</div>
        <div style={{ fontFamily: "'Raleway', sans-serif", color: C.muted, fontSize: 12, textAlign: 'center', padding: '20px 0' }}>
          Analysing market data…
        </div>
      </div>
    );
  }

  const ac = signal.action === 'BUY' ? C.bull : signal.action === 'SELL' ? C.bear : C.neutral;
  const actionLabel = signal.action === 'BUY' ? '▲ BUY' : signal.action === 'SELL' ? '▼ SELL' : '◆ HOLD';

  return (
    <div style={{
      background:   C.card,
      border:       `1px solid ${ac}30`,
      borderRadius: 8,
      padding:      16,
      marginBottom: 10,
    }}>
      {/* Action + Confidence */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{ ...sectionHeadStyle, color: C.muted }}>Algo Signal</div>
            <span style={{
              fontFamily:   "'Raleway', sans-serif",
              fontSize:      8,
              fontWeight:    700,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              color:         '#10d67a',
              background:   '#10d67a18',
              border:       '1px solid #10d67a40',
              padding:      '1px 6px',
              borderRadius:  3,
            }}>NSE Cash</span>
          </div>
          <div className="mono" style={{ fontSize: 42, fontWeight: 700, color: ac, letterSpacing: 3, lineHeight: 1 }}>
            {signal.action}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ ...sectionHeadStyle, color: C.muted, marginBottom: 4 }}>Confidence</div>
          <div className="mono" style={{ fontSize: 30, fontWeight: 600, color: ac }}>{signal.confidence}%</div>
        </div>
      </div>

      {/* Confidence bar */}
      <div style={{ background: C.grid, borderRadius: 3, height: 5, marginBottom: 16 }}>
        <div style={{
          width:      `${signal.confidence}%`,
          height:     '100%',
          background:  ac,
          borderRadius: 3,
          transition: 'width 0.6s ease',
        }} />
      </div>

      {/* Strategy */}
      <Section title="Entry / Exit Strategy (INR)">
        <Row label="Entry"       value={`₹${fmtPrice(signal.entry)}`}    color="#60a5fa" />
        <Row label="Target 1"   value={`₹${fmtPrice(signal.target1)}`}   color={C.bull} />
        <Row label="Target 2"   value={`₹${fmtPrice(signal.target2)}`}   color="#00c853" />
        <Row label="Stop Loss"  value={`₹${fmtPrice(signal.stopLoss)}`}  color={C.bear} />
        <Row label="Risk:Reward" value={signal.rr}                        color="#a78bfa" />
      </Section>
    </div>
  );
}

// ── Signal Breakdown ──────────────────────────────────────────────────────────
export function SignalBreakdown({ signal }) {
  const { colors: C } = useTheme();
  if (!signal?.signals?.length) return null;

  return (
    <div style={{
      background:   C.card,
      border:       `1px solid ${C.border}`,
      borderRadius: 8,
      padding:      14,
      marginBottom: 10,
    }}>
      <Section title={`Signal Breakdown · Score: ${signal.score > 0 ? '+' : ''}${signal.score}`}>
        {signal.signals.map((s, i) => (
          <div
            key={i}
            style={{
              display:       'flex',
              alignItems:    'flex-start',
              gap:            8,
              padding:       '5px 8px',
              marginBottom:   4,
              background:    sigBg(s.type),
              borderRadius:   5,
              border:        `1px solid ${sigColor(s.type, C)}20`,
            }}
          >
            <span style={{ fontSize: 9, color: sigColor(s.type, C), marginTop: 1, flexShrink: 0 }}>
              {sigIcon(s.type)}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily:  "'Raleway', sans-serif",
                fontSize:     9,
                fontWeight:   700,
                color:        sigColor(s.type, C),
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginBottom:  2,
              }}>
                {s.indicator}
              </div>
              <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 10, color: C.text, lineHeight: 1.4 }}>
                {s.message}
              </div>
            </div>
            <span className="mono" style={{
              fontSize:   10,
              fontWeight: 700,
              color:      sigColor(s.type, C),
              flexShrink: 0,
            }}>
              {s.points > 0 ? '+' : ''}{s.points}
            </span>
          </div>
        ))}
      </Section>
    </div>
  );
}

// ── Indicator Values ──────────────────────────────────────────────────────────
export function IndicatorValues({ inds, candles }) {
  const { colors: C } = useTheme();
  if (!inds || !candles?.length) return null;

  const n     = candles.length - 1;
  const price = candles[n].close;
  const f2    = (v) => v != null && isFinite(v) ? (+v).toFixed(2) : '—';
  const fINR  = (v) => v != null && isFinite(v) ? `₹${(+v).toFixed(2)}` : '—';

  const rsiV  = inds.rsi[n];
  const rsiColor = !rsiV ? C.muted
    : rsiV > 70 ? C.bear : rsiV < 30 ? C.bull
    : rsiV >= 50 ? C.bull : C.bear;

  const hist  = inds.macd.histogram[n];
  const macdColor = hist == null ? C.muted : hist >= 0 ? C.bull : C.bear;

  const bb    = inds.bb[n];
  const e9v   = inds.e9[n];
  const e21v  = inds.e21[n];
  const e50v  = inds.e50[n];

  const indicators = [
    { label: 'Price',       value: fINR(price),        color: '#60a5fa' },
    { label: 'EMA 9',       value: fINR(e9v),           color: C.ema9   },
    { label: 'EMA 21',      value: fINR(e21v),          color: C.ema21  },
    { label: 'EMA 50',      value: fINR(e50v),          color: C.ema50  },
    { label: 'RSI (14)',    value: f2(rsiV),             color: rsiColor },
    { label: 'MACD',        value: f2(inds.macd.macdLine[n]),   color: C.macd  },
    { label: 'MACD Signal', value: f2(inds.macd.signalLine[n]), color: C.signal },
    { label: 'Histogram',   value: f2(hist),             color: macdColor },
    { label: 'BB Upper',    value: fINR(bb?.upper),      color: '#a78bfa' },
    { label: 'BB Middle',   value: fINR(bb?.middle),     color: C.muted  },
    { label: 'BB Lower',    value: fINR(bb?.lower),      color: '#a78bfa' },
  ];

  return (
    <div style={{
      background:   C.card,
      border:       `1px solid ${C.border}`,
      borderRadius: 8,
      padding:      14,
      marginBottom: 10,
    }}>
      <Section title="Indicator Values">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {indicators.map(({ label, value, color }) => (
            <div key={label} style={{
              display:        'flex',
              justifyContent: 'space-between',
              alignItems:     'center',
              padding:        '4px 7px',
              background:     C.bg,
              borderRadius:   4,
              border:        `1px solid ${C.border}30`,
            }}>
              <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 9, color: C.muted }}>{label}</span>
              <span className="mono" style={{ fontSize: 10, fontWeight: 600, color }}>{value}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ── Disclaimer ────────────────────────────────────────────────────────────────
export function Disclaimer({ lastUpdate }) {
  const { colors: C } = useTheme();
  return (
    <div style={{
      background:   C.card,
      border:       `1px solid ${C.border}`,
      borderRadius: 8,
      padding:      '10px 14px',
      marginBottom: 10,
    }}>
      <div style={{
        fontFamily:  "'Raleway', sans-serif",
        fontSize:     9,
        color:        C.muted,
        lineHeight:   1.6,
      }}>
        <strong style={{ color: C.text }}>⚠ Disclaimer:</strong>{' '}
        akcnse is for educational and informational purposes only. This is <strong>not financial advice</strong>.
        NSE equity trading involves substantial risk. Always consult a SEBI-registered advisor.
        Data sourced from Yahoo Finance — may be delayed up to 15 minutes.
        {lastUpdate && (
          <span style={{ display: 'block', marginTop: 4, color: C.muted }}>
            Last data: {fmtDateTime(lastUpdate)}
          </span>
        )}
      </div>
    </div>
  );
}
