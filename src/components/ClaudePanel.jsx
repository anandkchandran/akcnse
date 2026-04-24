import React, { useState, useCallback, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { fmtPrice } from '../utils/format';
import { getClaudeAnalysis, abortClaudeAnalysis } from '../utils/claude';

const sigColor = (s) => {
  if (!s) return '#d4a017';
  if (s === 'LONG')  return '#10d67a';
  if (s === 'SHORT') return '#f85149';
  return '#d4a017';
};
const recBg = (s) => sigColor(s) + '18';

function AnalysisResult({ result }) {
  const { colors: C } = useTheme();
  if (!result) return null;
  const sig   = result.signal;
  const trade = result.trade || {};
  const fp    = (v) => v != null && isFinite(+v) ? `₹${fmtPrice(+v)}` : '—';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          fontFamily:  "'Raleway', sans-serif", fontSize: 22, fontWeight: 800,
          color:        sigColor(sig), background: recBg(sig),
          border:      `1px solid ${sigColor(sig)}40`,
          padding:     '4px 16px', borderRadius: 6, letterSpacing: 1.5,
        }}>
          {sig === 'LONG' ? '▲ LONG' : sig === 'SHORT' ? '▼ SHORT' : '◆ HOLD'}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 9, color: C.muted }}>Confidence</div>
          <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: sigColor(sig) }}>
            {result.confidence ?? '—'}%
          </div>
        </div>
      </div>

      {result.summary && (
        <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: C.text, lineHeight: 1.6, marginBottom: 10 }}>
          {result.summary}
        </div>
      )}

      {result.agreement_with_algo && (
        <div style={{
          fontFamily:  "'Raleway', sans-serif", fontSize: 10,
          padding:    '4px 8px', borderRadius: 4, marginBottom: 10,
          background: '#3b82f618', color: '#60a5fa',
          border:     '1px solid #3b82f630',
        }}>
          {result.agreement_with_algo}
        </div>
      )}

      {sig !== 'HOLD' && trade.entry && (
        <>
          <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
            Trade Setup (INR)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
            {[
              { label: 'Entry',     value: fp(trade.entry),     sub: trade.entry_type },
              { label: 'Stop Loss', value: fp(trade.stop_loss), color: '#f85149' },
              { label: 'TP1',       value: fp(trade.tp1),       color: '#10d67a' },
              { label: 'TP2',       value: fp(trade.tp2),       color: '#10d67a' },
            ].map(({ label, value, sub, color }) => (
              <div key={label} style={{
                background:   C.bg, borderRadius: 4, padding: '6px 8px',
                border:       `1px solid ${color ? color + '30' : C.border}`,
              }}>
                <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 8, color: color || C.muted, marginBottom: 2 }}>{label}</div>
                <div className="mono" style={{ fontSize: 11, fontWeight: 700, color: color || C.bright }}>{value}</div>
                {sub && <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 8, color: C.muted }}>{sub}</div>}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {[
              { label: 'Risk:Reward',  value: trade.risk_reward  || '—', color: '#3b82f6' },
              { label: 'Horizon',      value: trade.time_horizon || '—' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ flex: 1, background: C.bg, borderRadius: 4, padding: '6px 8px', border: `1px solid ${C.border}` }}>
                <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 8, color: C.muted, marginBottom: 2 }}>{label}</div>
                <div className="mono" style={{ fontSize: 10, fontWeight: 700, color: color || C.text }}>{value}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {result.key_reasons?.length > 0 && (
        <>
          <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Key Reasons</div>
          {result.key_reasons.map((r, i) => (
            <div key={i} style={{
              fontFamily:  "'Raleway', sans-serif", fontSize: 10, color: C.text,
              padding:    '4px 0 4px 8px',
              borderLeft: '2px solid #3b82f660',
              marginBottom: 4, lineHeight: 1.5,
            }}>
              {r}
            </div>
          ))}
        </>
      )}

      {result.invalidation && (
        <div style={{
          fontFamily: "'Raleway', sans-serif", fontSize: 10, color: '#f97316',
          background: '#f9731612', border: '1px solid #f9731630',
          borderRadius: 4, padding: '6px 10px', marginTop: 8,
        }}>
          ⚡ Invalidation: {result.invalidation}
        </div>
      )}
    </div>
  );
}

export default function ClaudePanel({ symbol, timeframe, ticker, inds, signal, candles }) {
  const { colors: C } = useTheme();
  const [result,    setResult]    = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const abortCtrl = useRef(null);

  const analyze = useCallback(async () => {
    if (!candles?.length || !inds) return;
    setLoading(true); setError(null); setResult(null);
    abortCtrl.current = new AbortController();
    try {
      const res = await getClaudeAnalysis(
        { symbol, timeframe, ticker, inds, signal, candles },
        null,
        abortCtrl.current.signal
      );
      setResult(res);
    } catch (err) {
      if (err.message !== 'ABORTED') setError(err.message);
      else setError('Analysis cancelled.');
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe, ticker, inds, signal, candles]);

  const abort = () => {
    abortCtrl.current?.abort();
    abortClaudeAnalysis();
    setLoading(false);
    setError('Analysis cancelled.');
  };

  return (
    <div style={{
      background:   C.card,
      border:       '1px solid #3b82f630',
      borderRadius:  8,
      padding:       16,
      marginBottom:  10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: collapsed ? 0 : 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>◈</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, fontWeight: 700, color: C.bright }}>
                Claude Analysis
              </span>
              <span style={{
                fontFamily:  "'Raleway', sans-serif", fontSize: 8, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: 0.8,
                color: '#a78bfa', background: '#a78bfa18',
                border: '1px solid #a78bfa40', padding: '1px 6px', borderRadius: 3,
              }}>Dev</span>
            </div>
            {!collapsed && (
              <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 9, color: C.muted }}>
                Requires local claude CLI · NSE equity signal · INR
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => setCollapsed(c => !c)}
          style={{
            background: 'transparent', border: `1px solid ${C.border}`,
            borderRadius: 4, color: C.muted, cursor: 'pointer',
            fontSize: 11, padding: '2px 7px', fontFamily: "'Raleway', sans-serif",
          }}
        >
          {collapsed ? '+' : '−'}
        </button>
      </div>

      {!collapsed && (
        <>
          <div style={{ marginBottom: 12 }}>
            {loading ? (
              <button onClick={abort} style={{
                width: '100%', fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 11,
                padding: '7px 10px', borderRadius: 5, cursor: 'pointer',
                border: '1px solid #f8514960', background: '#f8514918', color: '#f85149',
                boxSizing: 'border-box',
              }}>
                ■ Stop
              </button>
            ) : (
              <button onClick={analyze} disabled={!candles?.length} style={{
                width: '100%', fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 11,
                padding: '7px 10px', borderRadius: 5,
                cursor: candles?.length ? 'pointer' : 'not-allowed',
                border: '1px solid #3b82f660',
                background: '#3b82f615',
                color: candles?.length ? '#60a5fa' : C.muted,
                transition: 'all 0.15s', boxSizing: 'border-box',
              }}>
                ◈ Analyse with Claude
              </button>
            )}
          </div>

          {loading && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
              background: C.bg, border: '1px solid #3b82f630', borderRadius: 6, marginBottom: 10,
            }}>
              <div style={{ display: 'flex', gap: 3 }}>
                {['#3b82f6','#a78bfa','#60a5fa'].map((col, i) => (
                  <div key={i} style={{
                    width: 5, height: 5, borderRadius: '50%', background: col,
                    animation: `claudeDot 1.2s ${i * 0.2}s ease-in-out infinite`,
                  }} />
                ))}
              </div>
              <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: '#60a5fa' }}>
                Analysing {symbol.label} on {timeframe.label}…
              </div>
            </div>
          )}

          {error && !loading && (
            <div style={{
              fontFamily: "'Raleway', sans-serif", fontSize: 11,
              color: '#f85149', background: '#f8514912',
              border: '1px solid #f8514930', borderRadius: 5,
              padding: '8px 12px', marginBottom: 10,
            }}>
              ⚠ {error}
            </div>
          )}

          {result && !loading && <AnalysisResult result={result} />}

          {!result && !loading && !error && (
            <div style={{
              textAlign: 'center', padding: '20px 0',
              fontFamily: "'Raleway', sans-serif", fontSize: 11, color: C.muted,
            }}>
              Click "Analyse with Claude" for AI equity signal
            </div>
          )}

          <style>{`
            @keyframes claudeDot {
              0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
              40% { opacity: 1; transform: scale(1.2); }
            }
          `}</style>
        </>
      )}
    </div>
  );
}
