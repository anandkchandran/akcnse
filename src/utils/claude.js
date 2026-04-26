/**
 * Claude AI integration for akcnse — NSE Equities Terminal
 * Routes through local proxy server (server.js on :4001)
 * which spawns the locally-installed claude CLI.
 */

import { API_BASE } from './api.js';
const PROXY_URL = `${API_BASE}/api/claude`;
const MODEL     = 'sonnet';

// ── Candle count based on timeframe ──────────────────────────────────────────
function candleCountForTf(tfId) {
  if (tfId === '5m')  return 30;
  if (tfId === '15m') return 24;
  if (tfId === '30m') return 20;
  if (tfId === '45m') return 16;
  if (tfId === '1h')  return 20;
  if (tfId === '1w')  return 12;
  if (tfId === '1mo') return 12;
  return 10; // 1d
}

// Trailing series of indicator values (oldest → newest)
function series(arr, n, count = 6, decimals = 2) {
  return Array.from({ length: count }, (_, i) => {
    const v = arr[n - (count - 1 - i)];
    return v != null ? (+v).toFixed(decimals) : '—';
  }).join(' → ');
}

export function buildPrompt({ symbol, timeframe, ticker, inds, signal, candles }) {
  const n     = candles.length - 1;
  const price = ticker?.price ?? candles[n].close;
  const fp    = (v) => v != null && isFinite(v) ? (+v).toFixed(2) : '—';
  const f2    = (v) => v != null && isFinite(v) ? (+v).toFixed(2) : '—';
  const fINR  = (v) => v != null && isFinite(v) ? `₹${(+v).toFixed(2)}` : '—';

  // ── Current indicator readings ──────────────────────────────────────────────
  const rsiV = inds.rsi[n];
  const rsiInterp = !rsiV ? '—'
    : rsiV > 75 ? `${f2(rsiV)} — Extremely overbought`
    : rsiV > 65 ? `${f2(rsiV)} — Overbought`
    : rsiV >= 50 ? `${f2(rsiV)} — Bullish territory`
    : rsiV >= 35 ? `${f2(rsiV)} — Bearish territory`
    : rsiV >= 25 ? `${f2(rsiV)} — Oversold`
    : `${f2(rsiV)} — Extremely oversold`;

  const hist  = inds.macd.histogram[n];
  const prevH = inds.macd.histogram[n - 1];
  const macdInterp = hist == null ? '—'
    : hist > 0 && prevH < 0 ? 'Bullish crossover (fresh signal)'
    : hist < 0 && prevH > 0 ? 'Bearish crossover (fresh signal)'
    : hist > 0 && hist > prevH ? 'Positive & rising (strengthening bull)'
    : hist > 0 ? 'Positive (mild bull bias)'
    : hist < 0 && hist < prevH ? 'Negative & falling (strengthening bear)'
    : 'Negative (mild bear bias)';

  const e9v = inds.e9[n], e21v = inds.e21[n], e50v = inds.e50[n];
  const emaAlign = !e9v ? '—'
    : e9v > e21v && e21v > e50v ? 'Bullish — EMA9 > EMA21 > EMA50'
    : e9v < e21v && e21v < e50v ? 'Bearish — EMA9 < EMA21 < EMA50'
    : 'Mixed — ranging / consolidation';

  const bb    = inds.bb[n];
  const bbPos = bb?.upper != null
    ? ((price - bb.lower) / (bb.upper - bb.lower) * 100).toFixed(0)
    : null;
  const bbInterp = bbPos == null ? '—'
    : price < bb.lower  ? 'BELOW lower band (extreme oversold)'
    : price > bb.upper  ? 'ABOVE upper band (extreme overbought)'
    : bbPos < 25        ? `Lower quarter (${bbPos}%) — near support`
    : bbPos > 75        ? `Upper quarter (${bbPos}%) — near resistance`
    : `Mid-band (${bbPos}% of range)`;

  // ── CPR (Central Pivot Range) ───────────────────────────────────────────────
  const cpr = inds.cpr;
  const cprSection = cpr ? (() => {
    const fp2 = v => v != null ? `₹${(+v).toFixed(2)}` : '—';
    const pos  = price > cpr.R1  ? `ABOVE R1 — strong bullish breakout zone`
               : price > cpr.TC  ? `Above Top CPR (TC) — bullish; pivot range is now support`
               : price >= cpr.BC ? `Inside CPR (between BC and TC) — consolidation / indecision`
               : price > cpr.S1  ? `Below Bottom CPR (BC) — bearish; pivot range is resistance`
               :                   `BELOW S1 — strong bearish breakdown zone`;
    return `
═══════════════════════════════════════════════════════════
CPR — CENTRAL PIVOT RANGE (based on previous session H/L/C)
═══════════════════════════════════════════════════════════
Pivot (P)      : ${fp2(cpr.P)}
Top CPR (TC)   : ${fp2(cpr.TC)}
Bottom CPR (BC): ${fp2(cpr.BC)}
R1             : ${fp2(cpr.R1)}
R2             : ${fp2(cpr.R2)}
S1             : ${fp2(cpr.S1)}
S2             : ${fp2(cpr.S2)}
CPR Width      : ${cpr.widthPct.toFixed(3)}% — ${cpr.tight ? 'TIGHT (trending day expected — ride the breakout)' : cpr.wide ? 'WIDE (rangebound day — fade moves at extremes)' : 'Normal'}
Price Position : ${pos}

CPR trading rules:
  • Above TC + holding → bullish; TC/P = support levels to watch
  • Below BC + holding → bearish; BC/P = resistance levels to watch
  • Inside CPR → wait for decisive breakout before entering
  • Tight CPR → strong directional move likely once breakout occurs
  • R1/R2 = potential resistance targets for longs
  • S1/S2 = potential support targets for shorts`;
  })() : '\nCPR data not available for this chart.';


  // ── Indicator series (last 6 readings) ─────────────────────────────────────
  const rsiSeries  = series(inds.rsi, n, 6, 1);
  const histSeries = series(inds.macd.histogram, n, 6, 3);
  const e9Series   = series(inds.e9,  n, 6, 2);
  const closeSeries = Array.from({ length: 6 }, (_, i) => {
    const c = candles[n - (5 - i)];
    return c ? `₹${fp(c.close)}` : '—';
  }).join(' → ');

  // ── Candle table ─────────────────────────────────────────────────────────────
  const candleCount = candleCountForTf(timeframe.id);
  const rows = candles.slice(-candleCount).map(c =>
    `  ${(c.datetime || c.time).padEnd(14)} | ₹${fp(c.open).padStart(10)} | ₹${fp(c.high).padStart(10)} | ₹${fp(c.low).padStart(10)} | ₹${fp(c.close).padStart(10)} | ${c.volume.toFixed(0).padStart(12)}`
  ).join('\n');

  const algoSigs = signal?.signals?.slice(0, 6).map(s =>
    `    • [${s.type.includes('bull') ? 'BULL' : s.type.includes('bear') ? 'BEAR' : 'NEUT'}] ${s.indicator}: ${s.message} (${s.points > 0 ? '+' : ''}${s.points}pts)`
  ).join('\n') || '    (not computed yet)';

  const marketStatus = ticker?.change >= 0 ? 'BULLISH' : 'BEARISH';
  const sector = symbol.sector || 'NSE Equity';

  return `You are a senior Indian equity market technical analyst and portfolio manager with 15 years of NSE/BSE experience.
Analyze the following live NSE equity data and produce a professional trade recommendation in INR.

═══════════════════════════════════════════════════════════
STOCK SNAPSHOT
═══════════════════════════════════════════════════════════
Symbol     : ${symbol.label} (NSE)
Company    : ${ticker?.name || symbol.label}
Sector     : ${sector}
Timeframe  : ${timeframe.label}
Price      : ₹${fp(price)}
Day Change : ${ticker?.change != null ? (ticker.change > 0 ? '+' : '') + f2(ticker.change) + '%' : '—'}
Day High   : ₹${fp(ticker?.high24)}
Day Low    : ₹${fp(ticker?.low24)}
Volume     : ${ticker?.volume != null ? ticker.volume.toLocaleString('en-IN') : '—'} shares
Market Bias: ${marketStatus}

═══════════════════════════════════════════════════════════
TECHNICAL INDICATORS — CURRENT VALUES
═══════════════════════════════════════════════════════════
RSI (14)          : ${rsiInterp}
MACD (12,26,9)    : ${macdInterp}
  └ MACD Line     : ${f2(inds.macd.macdLine[n])}
  └ Signal Line   : ${f2(inds.macd.signalLine[n])}
  └ Histogram     : ${f2(hist)}
Bollinger Bands   : ${bbInterp}
  └ Upper         : ₹${fp(bb?.upper)}
  └ Middle        : ₹${fp(bb?.middle)}
  └ Lower         : ₹${fp(bb?.lower)}
EMA Alignment     : ${emaAlign}
  └ EMA9          : ₹${fp(e9v)}
  └ EMA21         : ₹${fp(e21v)}
  └ EMA50         : ₹${fp(e50v)}
ATR (14)          : ₹${f2(signal?.atr)} (volatility measure)

═══════════════════════════════════════════════════════════
INDICATOR TRENDS — last 6 ${timeframe.label} candles (oldest → newest)
═══════════════════════════════════════════════════════════
RSI series        : ${rsiSeries}
MACD Hist series  : ${histSeries}
EMA9 series       : ${e9Series}
Close series      : ${closeSeries}

${cprSection}

═══════════════════════════════════════════════════════════
ALGORITHM PRE-SIGNAL (weighted indicator scoring)
═══════════════════════════════════════════════════════════
Action     : ${signal?.action ?? 'CALCULATING'}
Score      : ${signal?.score ?? '—'} (range: -200 to +200)
Confidence : ${signal?.confidence ?? '—'}%
Signals fired:
${algoSigs}

═══════════════════════════════════════════════════════════
RECENT PRICE ACTION (last ${candleCount} ${timeframe.label} candles) — All prices in INR
═══════════════════════════════════════════════════════════
  Date/Time       |       Open    |       High    |        Low    |      Close    |       Volume
${rows}

═══════════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════════
Provide a comprehensive trade analysis for ${symbol.label} NSE equity on the ${timeframe.label} timeframe.
This is a CASH equity position on NSE (not futures/options). Focus on:
- Swing/positional trade opportunities
- Key support/resistance levels in INR
- Entry on retest or breakout
- Delivery vs intraday framing based on timeframe
- Capital preservation with clear stop loss

Key instructions:
- All prices must be in INR (₹)
- Use the INDICATOR TRENDS series to assess momentum
- Identify key support/resistance from the price action table
- Use CPR levels as primary S/R reference: TC/BC/P/R1/R2/S1/S2
- Note whether price is above TC (bullish), inside CPR (neutral), or below BC (bearish)
- Tight CPR = strong trending day expected; factor that into conviction and sizing
- Consider volume confirmation (high volume breakouts are more reliable)
- NSE market hours: 9:15 AM - 3:30 PM IST (Mon-Fri)
- Scale time horizon to ${timeframe.label}: 5m/15m/30m/45m=intraday, 1h=swing 1-3d, 1D=positional 1-4wks, 1W/1M=long-term investment

Respond with ONLY valid JSON (no markdown fences, no text outside JSON):
{
  "signal": "LONG | SHORT | HOLD",
  "confidence": <integer 0-100>,
  "summary": "<2-3 sentence professional summary of the equity setup>",
  "agreement_with_algo": "<AGREE | DISAGREE | PARTIALLY AGREE> — <one sentence why>",
  "trade": {
    "entry_type": "<MARKET | LIMIT | SCALED>",
    "entry": <number — ideal entry price in INR>,
    "entry_note": "<brief entry tactic>",
    "tp1": <number — first take profit in INR>,
    "tp2": <number — second take profit in INR>,
    "stop_loss": <number — hard stop in INR>,
    "risk_reward": "<string e.g. 1:2.4>",
    "time_horizon": "<intraday (<1d) | swing (2-5d) | positional (1-4wk)>"
  },
  "position_sizing": "<conservative/moderate/aggressive> — <brief reasoning based on risk %>",
  "key_reasons": [
    "<specific indicator-based reason 1>",
    "<specific indicator-based reason 2>",
    "<specific indicator-based reason 3>"
  ],
  "risks": [
    "<key risk 1>",
    "<key risk 2>",
    "<key risk 3>"
  ],
  "invalidation": "<price level or event that invalidates this thesis>"
}`;
}

const SYSTEM_PROMPT = 'You are an expert NSE equity technical analyst. You always respond with ONLY valid JSON — no markdown code fences, no preamble, no explanation outside the JSON object. Your signal must be one of: LONG, SHORT, or HOLD. All prices must be in INR (₹). LONG means buy/accumulate. SHORT means sell/exit longs (cash equity — not shorting). HOLD means no trade.';

// ── Abort in-flight request ───────────────────────────────────────────────────
export async function abortClaudeAnalysis() {
  try {
    await fetch(`${API_BASE}/api/claude/abort`, { method: 'POST' });
  } catch {}
}

// ── Main API call ─────────────────────────────────────────────────────────────
export async function getClaudeAnalysis(data, _unused, signal) {
  const prompt = buildPrompt(data);

  let response;
  try {
    response = await fetch(PROXY_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ prompt, systemPrompt: SYSTEM_PROMPT, model: MODEL }),
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('ABORTED');
    throw new Error('Cannot reach local server — is "node server.js" running on port 4001?');
  }

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const msg = body?.error || `Server error ${response.status}`;
    if (msg === 'ABORTED') throw new Error('ABORTED');
    throw new Error(msg);
  }

  const raw   = (body.content ?? '').trim();
  const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  try {
    return JSON.parse(clean);
  } catch {
    throw new Error('Claude returned malformed JSON — try again');
  }
}
