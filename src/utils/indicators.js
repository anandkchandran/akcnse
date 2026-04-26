/**
 * Technical indicator calculations
 * All functions return arrays aligned to the input price array.
 * Insufficient-data positions are filled with null.
 */

export function calcEMA(prices, period) {
  const k = 2 / (period + 1);
  const result = [];
  let avg = 0;
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) { result.push(null); continue; }
    if (i === period - 1) {
      avg = prices.slice(0, period).reduce((s, v) => s + v, 0) / period;
      result.push(avg);
      continue;
    }
    avg = prices[i] * k + avg * (1 - k);
    result.push(avg);
  }
  return result;
}

export function calcRSI(prices, period = 14) {
  if (prices.length < period + 1) return prices.map(() => null);
  const result = new Array(period).fill(null);
  let ag = 0, al = 0;
  for (let i = 1; i <= period; i++) {
    const d = prices[i] - prices[i - 1];
    if (d > 0) ag += d; else al += -d;
  }
  ag /= period; al /= period;
  result.push(al === 0 ? 100 : 100 - 100 / (1 + ag / al));
  for (let i = period + 1; i < prices.length; i++) {
    const d = prices[i] - prices[i - 1];
    ag = (ag * (period - 1) + (d > 0 ? d : 0)) / period;
    al = (al * (period - 1) + (d < 0 ? -d : 0)) / period;
    result.push(al === 0 ? 100 : 100 - 100 / (1 + ag / al));
  }
  return result;
}

export function calcMACD(prices, fast = 12, slow = 26, sig = 9) {
  const ef = calcEMA(prices, fast);
  const es = calcEMA(prices, slow);
  const macdLine = ef.map((v, i) =>
    v !== null && es[i] !== null ? v - es[i] : null
  );
  const validMacd = macdLine.filter(v => v !== null);
  const sigEma = calcEMA(validMacd, sig);
  let vi = 0;
  const signalLine = macdLine.map(v => {
    if (v === null) return null;
    return sigEma[vi++] ?? null;
  });
  const histogram = macdLine.map((v, i) =>
    v !== null && signalLine[i] !== null ? v - signalLine[i] : null
  );
  return { macdLine, signalLine, histogram };
}

export function calcBollingerBands(prices, period = 20, mult = 2) {
  return prices.map((_, i) => {
    if (i < period - 1) return { upper: null, middle: null, lower: null };
    const slice = prices.slice(i - period + 1, i + 1);
    const mean = slice.reduce((s, v) => s + v, 0) / period;
    const sd = Math.sqrt(slice.reduce((s, v) => s + (v - mean) ** 2, 0) / period);
    return { upper: mean + mult * sd, middle: mean, lower: mean - mult * sd };
  });
}

export function calcATR(candles, period = 14) {
  if (candles.length < 2) return 0;
  const trs = candles.slice(1).map((c, i) =>
    Math.max(
      c.high - c.low,
      Math.abs(c.high - candles[i].close),
      Math.abs(c.low  - candles[i].close)
    )
  );
  const n = Math.min(period, trs.length);
  return trs.slice(-n).reduce((s, v) => s + v, 0) / n;
}

/**
 * Central Pivot Range (CPR)
 * Reference period is always the **previous trading day's** H/L/C.
 *
 * For intraday timeframes (candle spacing < 1 day) we group candles by IST
 * calendar date using their Unix timestamp, find the most recent completed
 * day, and aggregate its H/L/C.  For daily/weekly candles we simply use the
 * second-to-last candle (last completed session).
 *
 *  Pivot (P)       = (H + L + C) / 3
 *  Bottom CPR (BC) = (H + L) / 2
 *  Top CPR (TC)    = (2 × P) − BC
 *  R1 = 2P − L  |  R2 = P + (H − L)
 *  S1 = 2P − H  |  S2 = P − (H − L)
 *  widthPct = |TC − BC| / P × 100
 *    < 0.25% → tight (expect strong trend)
 *    > 1.00% → wide  (expect range / volatility)
 */
export function calcCPR(candles) {
  if (!candles || candles.length < 2) return null;

  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];

  // Detect intraday: consecutive candle spacing < 1 calendar day (86 400 s)
  const isIntraday =
    last.timestamp && prev.timestamp &&
    (last.timestamp - prev.timestamp) < 86_400;

  let H, L, C;

  if (isIntraday) {
    // Group all candles by IST calendar date
    const istDate = (ts) =>
      new Date(ts * 1000).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });

    const todayDate = istDate(last.timestamp);

    // All candles that belong to a prior day
    const priorCandles = candles.filter(
      c => c.timestamp && istDate(c.timestamp) !== todayDate
    );

    if (priorCandles.length === 0) {
      // Not enough history yet — fall back to previous candle
      H = prev.high; L = prev.low; C = prev.close;
    } else {
      // Find the most recent prior trading day
      const prevDate = istDate(priorCandles[priorCandles.length - 1].timestamp);
      const dayCandles = priorCandles.filter(
        c => istDate(c.timestamp) === prevDate
      );

      const highs  = dayCandles.map(c => c.high).filter(v => v != null && v > 0);
      const lows   = dayCandles.map(c => c.low ).filter(v => v != null && v > 0);
      const closes = dayCandles.map(c => c.close).filter(v => v != null && v > 0);

      if (!highs.length || !lows.length || !closes.length) return null;

      H = Math.max(...highs);
      L = Math.min(...lows);
      C = closes[closes.length - 1];
    }
  } else {
    // Daily / weekly: previous completed candle
    H = prev.high; L = prev.low; C = prev.close;
  }

  if (!H || !L || !C || H <= 0 || L <= 0 || C <= 0) return null;

  const P   = (H + L + C) / 3;
  const BC  = (H + L)     / 2;
  const TC  = 2 * P - BC;
  const R1  = 2 * P - L;
  const R2  = P + (H - L);
  const S1  = 2 * P - H;
  const S2  = P - (H - L);
  const widthPct = Math.abs(TC - BC) / P * 100;

  return {
    P, BC, TC, R1, R2, S1, S2,
    widthPct,
    tight: widthPct < 0.25,   // trending day expected
    wide:  widthPct > 1.00,   // ranging / volatile day expected
  };
}

/**
 * Build chart-ready data array from candles + computed indicators
 * Returns last `limit` items for rendering performance
 */
export function buildChartData(candles, inds, limit = 120) {
  const offset = Math.max(0, candles.length - limit);
  return candles.slice(offset).map((c, i) => {
    const ai = offset + i;
    const bb = inds.bb[ai] || {};
    return {
      time:    c.datetime || c.time,   // datetime has date+time; better for 1D x-axis
      price:   c.close,
      high:    c.high,
      low:     c.low,
      volume:  c.volume,
      e9:      inds.e9[ai],
      e21:     inds.e21[ai],
      e50:     inds.e50[ai],
      bbUpper: bb.upper,
      bbMiddle:bb.middle,
      bbLower: bb.lower,
      rsi:     inds.rsi[ai],
      macd:    inds.macd.macdLine[ai],
      signal:  inds.macd.signalLine[ai],
      hist:    inds.macd.histogram[ai],
    };
  });
}
