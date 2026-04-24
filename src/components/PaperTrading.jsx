import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { fmtPrice } from '../utils/format';

// ── Constants ─────────────────────────────────────────────────────────────────
const STARTING_BALANCE = 100000;
const STORAGE_KEY      = 'akcnse_paper_trading';

// ── Persistence ───────────────────────────────────────────────────────────────
function loadState() {
  try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
}
function saveState(balance, positions, history) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ balance, positions, history })); } catch {}
}

// ── P&L helpers ───────────────────────────────────────────────────────────────
const calcPnl = (pos, p) => (!p || !pos) ? 0 : (p - pos.entry) * pos.qty;
const calcPct = (pos, p) => (!p || !pos) ? 0 : ((p - pos.entry) / pos.entry) * 100;

export default function PaperTrading({ ticker, symbol }) {
  const { colors: C } = useTheme();
  const price = ticker?.price ?? 0;

  const [balance,   setBalance]   = useState(STARTING_BALANCE);
  const [positions, setPositions] = useState([]);
  const [history,   setHistory]   = useState([]);
  const [tab,       setTab]       = useState('trade');
  const [collapsed, setCollapsed] = useState(false);
  const [qty,       setQty]       = useState('10');
  const [sl,        setSl]        = useState('');
  const [tp,        setTp]        = useState('');

  // Persist / restore
  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setBalance(saved.balance ?? STARTING_BALANCE);
      setPositions(saved.positions ?? []);
      setHistory((saved.history ?? []).slice(-50));
    }
  }, []);
  useEffect(() => { saveState(balance, positions, history); }, [balance, positions, history]);

  // Auto SL / TP
  useEffect(() => {
    if (!price || !positions.length) return;
    const toClose = [];
    positions.forEach(pos => {
      if (pos.sl && price <= pos.sl) toClose.push({ pos, exitPrice: pos.sl, reason: 'SL' });
      else if (pos.tp && price >= pos.tp) toClose.push({ pos, exitPrice: pos.tp, reason: 'TP' });
    });
    if (!toClose.length) return;
    const ids = new Set(toClose.map(t => t.pos.id));
    setPositions(prev => prev.filter(p => !ids.has(p.id)));
    setHistory(prev => [...prev, ...toClose.map(({ pos, exitPrice, reason }) => ({
      ...pos, exitPrice, exitAt: new Date().toISOString(),
      pnl: (exitPrice - pos.entry) * pos.qty, reason,
    }))].slice(-50));
    toClose.forEach(({ pos, exitPrice }) =>
      setBalance(b => b + pos.entry * pos.qty + (exitPrice - pos.entry) * pos.qty)
    );
  }, [price, positions]);

  // Buy
  const handleBuy = useCallback(() => {
    const qtyNum = parseInt(qty, 10);
    if (!qtyNum || qtyNum <= 0 || !price) return;
    const cost = price * qtyNum;
    if (cost > balance) return;
    setPositions(prev => [...prev, {
      id: `${Date.now()}`, symbol: symbol.id, entry: price, qty: qtyNum,
      sl: sl ? parseFloat(sl) : null, tp: tp ? parseFloat(tp) : null,
      openAt: new Date().toISOString(),
    }]);
    setBalance(b => b - cost);
    setSl(''); setTp('');
  }, [qty, price, balance, sl, tp, symbol]);

  // Close
  const closePosition = useCallback((posId) => {
    const pos = positions.find(p => p.id === posId);
    if (!pos) return;
    const pnl = (price - pos.entry) * pos.qty;
    setPositions(prev => prev.filter(p => p.id !== posId));
    setHistory(prev => [...prev, { ...pos, exitPrice: price, exitAt: new Date().toISOString(), pnl, reason: 'Manual' }].slice(-50));
    setBalance(b => b + pos.entry * pos.qty + pnl);
  }, [positions, price]);

  const handleReset = () => {
    if (!window.confirm('Reset paper trading? All positions and history will be cleared.')) return;
    setBalance(STARTING_BALANCE); setPositions([]); setHistory([]);
  };

  // Computed
  const myPositions = positions.filter(p => p.symbol === symbol.id);
  const openPnl     = myPositions.reduce((s, p) => s + calcPnl(p, price), 0);
  const openValue   = myPositions.reduce((s, p) => s + p.entry * p.qty, 0);
  const equity      = balance + openValue + openPnl;
  const totalReturn = ((equity - STARTING_BALANCE) / STARTING_BALANCE) * 100;
  const qtyNum      = parseInt(qty, 10) || 0;
  const cost        = price * qtyNum;
  const canBuy      = cost > 0 && cost <= balance && price > 0;
  const slNum       = sl ? parseFloat(sl) : null;
  const tpNum       = tp ? parseFloat(tp) : null;
  const slPct       = slNum && price ? ((slNum - price) / price * 100).toFixed(1) : null;
  const tpPct       = tpNum && price ? ((tpNum - price) / price * 100).toFixed(1) : null;

  // Shared styles
  const label = (text) => (
    <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: C.muted, marginBottom: 4 }}>
      {text}
    </div>
  );

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 12px 10px', marginBottom: 10 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: collapsed ? 0 : 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15 }}>📋</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, fontWeight: 800, color: C.bright, letterSpacing: 0.3 }}>
                Paper Trading
              </span>
              <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 8, fontWeight: 700, color: C.rupee, background: `${C.rupee}18`, border: `1px solid ${C.rupee}40`, padding: '1px 5px', borderRadius: 3 }}>
                INR
              </span>
            </div>
            {!collapsed && (
              <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 9, color: C.muted, marginTop: 1 }}>
                Virtual · ₹1L balance · No real money
              </div>
            )}
          </div>
        </div>
        <button className={collapsed ? 'button-accent' : ''} onClick={() => setCollapsed(c => !c)}
          style={{ padding: '2px 8px', fontSize: 13, lineHeight: 1 }}>
          {collapsed ? '+' : '−'}
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Balance cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
            {[
              { label: 'Cash', value: `₹${fmtPrice(balance)}`, color: C.bright },
              { label: 'Equity', value: `₹${fmtPrice(equity)}`, sub: `${totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(2)}%`, color: totalReturn >= 0 ? C.bull : C.bear },
            ].map(card => (
              <div key={card.label} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 5, padding: '6px 8px' }}>
                <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: C.muted, marginBottom: 3 }}>
                  {card.label}
                </div>
                <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: card.color }}>
                  {card.value}
                </div>
                {card.sub && (
                  <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 9, color: card.color }}>{card.sub}</div>
                )}
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 3, marginBottom: 10 }}>
            {[
              { id: 'trade',     label: 'Trade' },
              { id: 'positions', label: `Positions (${myPositions.length})` },
              { id: 'history',   label: 'History' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={tab === t.id ? 'button-accent' : ''}
                style={{ flex: 1, fontSize: 10, padding: '5px 2px', fontWeight: tab === t.id ? 700 : 500 }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Trade tab ── */}
          {tab === 'trade' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

              {/* LTP row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.bg, borderRadius: 5, padding: '6px 10px', border: `1px solid ${C.border}` }}>
                <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, fontWeight: 700, color: C.muted }}>
                  {symbol.label} LTP
                </span>
                <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: C.price }}>
                  ₹{fmtPrice(price)}
                </span>
              </div>

              {/* Quantity */}
              <div>
                {label('Quantity')}
                <input
                  type="number" value={qty} min="1"
                  onChange={e => setQty(e.target.value)}
                  style={{ width: '100%', height: 30, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, padding: '0 8px', fontFamily: "'Roboto Mono', monospace", fontSize: 12, color: C.bright, outline: 'none', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                  {[5, 10, 25, 50].map(q => (
                    <button key={q} onClick={() => setQty(String(q))}
                      className={parseInt(qty) === q ? 'button-accent' : ''}
                      style={{ flex: 1, padding: '3px 0', fontSize: 10, fontWeight: 700 }}>
                      {q}
                    </button>
                  ))}
                </div>
                {qtyNum > 0 && price > 0 && (
                  <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 9, color: cost > balance ? C.bear : C.muted, marginTop: 3 }}>
                    Cost: ₹{fmtPrice(cost)}{cost > balance ? ' · ⚠ Insufficient balance' : ''}
                  </div>
                )}
              </div>

              {/* Stop Loss */}
              <div>
                {label(<>Stop Loss <span style={{ color: C.bear, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>{slPct ? `${slPct}%` : '(optional)'}</span></>)}
                <input
                  type="number" value={sl}
                  onChange={e => setSl(e.target.value)}
                  placeholder={price ? `e.g. ₹${fmtPrice(price * 0.97)}` : 'Stop loss price'}
                  style={{ width: '100%', height: 30, background: C.bg, border: `1px solid ${sl ? '#f8514960' : C.border}`, borderRadius: 4, padding: '0 8px', fontFamily: "'Roboto Mono', monospace", fontSize: 11, color: C.bright, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Take Profit */}
              <div>
                {label(<>Take Profit <span style={{ color: C.bull, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>{tpPct ? `+${tpPct}%` : '(optional)'}</span></>)}
                <input
                  type="number" value={tp}
                  onChange={e => setTp(e.target.value)}
                  placeholder={price ? `e.g. ₹${fmtPrice(price * 1.03)}` : 'Take profit price'}
                  style={{ width: '100%', height: 30, background: C.bg, border: `1px solid ${tp ? '#10d67a60' : C.border}`, borderRadius: 4, padding: '0 8px', fontFamily: "'Roboto Mono', monospace", fontSize: 11, color: C.bright, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Buy */}
              <button
                onClick={handleBuy} disabled={!canBuy}
                style={{
                  width: '100%', padding: '8px 0', fontSize: 12, fontWeight: 700,
                  borderRadius: 5, border: `1px solid ${canBuy ? '#10d67a60' : C.border}`,
                  background: canBuy ? '#10d67a20' : 'transparent',
                  color: canBuy ? '#10d67a' : C.muted,
                  fontFamily: "'Raleway', sans-serif", boxSizing: 'border-box',
                }}
              >
                ▲ BUY {qtyNum > 0 ? `${qtyNum} × ${symbol.label}` : symbol.label}
              </button>

              {/* Reset */}
              <button onClick={handleReset} className="button-danger"
                style={{ width: '100%', fontSize: 9, padding: '4px 0', boxSizing: 'border-box' }}>
                Reset Paper Account
              </button>
            </div>
          )}

          {/* ── Positions tab ── */}
          {tab === 'positions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {myPositions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', fontFamily: "'Raleway', sans-serif", fontSize: 11, color: C.muted }}>
                  No open positions for {symbol.label}
                </div>
              ) : myPositions.map(pos => {
                const pnl = calcPnl(pos, price);
                const pct = calcPct(pos, price);
                const clr = pnl >= 0 ? C.bull : C.bear;
                return (
                  <div key={pos.id} style={{ background: C.bg, border: `1px solid ${clr}30`, borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <div>
                        <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, fontWeight: 700, color: C.bright }}>
                          {pos.qty} × {pos.symbol}
                        </div>
                        <div className="mono" style={{ fontSize: 10, color: C.muted }}>Entry ₹{fmtPrice(pos.entry)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: clr }}>
                          {pnl >= 0 ? '+' : ''}₹{fmtPrice(Math.abs(pnl))}
                        </div>
                        <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 9, color: clr }}>
                          {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                      {pos.sl && <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 9, color: C.bear, background: '#f8514918', border: '1px solid #f8514940', padding: '1px 6px', borderRadius: 3 }}>SL ₹{fmtPrice(pos.sl)}</span>}
                      {pos.tp && <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 9, color: C.bull, background: '#10d67a18', border: '1px solid #10d67a40', padding: '1px 6px', borderRadius: 3 }}>TP ₹{fmtPrice(pos.tp)}</span>}
                      <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 9, color: C.muted }}>LTP ₹{fmtPrice(price)}</span>
                    </div>
                    <button onClick={() => closePosition(pos.id)} className="button-danger"
                      style={{ width: '100%', fontSize: 10, padding: '4px 0', boxSizing: 'border-box' }}>
                      ✕ Close Position
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── History tab ── */}
          {tab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', fontFamily: "'Raleway', sans-serif", fontSize: 11, color: C.muted }}>
                  No closed trades yet
                </div>
              ) : [...history].reverse().slice(0, 20).map((h, i) => {
                const clr = h.pnl >= 0 ? C.bull : C.bear;
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: C.bg, borderRadius: 4, border: `1px solid ${clr}20` }}>
                    <div>
                      <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 10, fontWeight: 700, color: C.text }}>
                        {h.qty}×{h.symbol}
                      </div>
                      <div className="mono" style={{ fontSize: 9, color: C.muted }}>
                        ₹{fmtPrice(h.entry)} → ₹{fmtPrice(h.exitPrice)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="mono" style={{ fontSize: 11, fontWeight: 700, color: clr }}>
                        {h.pnl >= 0 ? '+' : ''}₹{fmtPrice(Math.abs(h.pnl))}
                      </div>
                      <span style={{
                        fontFamily: "'Raleway', sans-serif", fontSize: 9,
                        color: h.reason === 'SL' ? C.bear : h.reason === 'TP' ? C.bull : C.muted,
                        background: h.reason === 'SL' ? '#f8514918' : h.reason === 'TP' ? '#10d67a18' : 'transparent',
                        padding: '1px 5px', borderRadius: 3,
                      }}>{h.reason}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
