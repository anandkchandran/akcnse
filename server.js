/**
 * akcnse — NSE Equities Terminal — Backend Proxy Server
 *
 * Provides:
 *   POST /api/nse/chart   — Yahoo Finance OHLCV proxy (avoids browser CORS)
 *   POST /api/nse/quote   — Yahoo Finance current quote
 *   POST /api/nse/batch   — Batch quotes for watchlist
 *   POST /api/claude      — Local Claude CLI proxy (dev)
 *   POST /api/claude/abort
 *   POST /api/gemini      — Google Gemini API proxy
 *   POST /api/gemini/abort
 *   GET  /health
 *
 *   node server.js        ← terminal 1
 *   npm start             ← terminal 2
 */

import http   from 'http';
import https  from 'https';
import net    from 'net';
import tls    from 'tls';
import { spawn, execSync } from 'child_process';
import fs     from 'fs';
import os     from 'os';
import path   from 'path';
import crypto from 'crypto';

// ── Config ────────────────────────────────────────────────────────────────────
const PORT            = process.env.PORT || 4001;
const TIMEOUT_MS      = 120_000;
const COWORK_PROXY_PORT = 45949;

// Yahoo Finance base URL
const YF_BASE = 'https://query1.finance.yahoo.com';

// ── Logging ───────────────────────────────────────────────────────────────────
function log(tag, ...args) {
  const ts = new Date().toISOString().slice(11, 23);
  console.log(`[${ts}] [${tag}]`, ...args);
}

// ── State ─────────────────────────────────────────────────────────────────────
let activeProcess = null;
let geminiAbort   = false;

// ── Find claude binary ────────────────────────────────────────────────────────
function findClaude() {
  if (process.env.CLAUDE_BIN) return process.env.CLAUDE_BIN;
  const candidates = [
    '/usr/local/bin/claude',
    '/opt/homebrew/bin/claude',
    `${os.homedir()}/.local/bin/claude`,
    `${os.homedir()}/.npm/bin/claude`,
    `${os.homedir()}/.yarn/bin/claude`,
    `${os.homedir()}/Library/pnpm/claude`,
  ];
  try {
    const nvmDir = `${os.homedir()}/.nvm/versions/node`;
    if (fs.existsSync(nvmDir)) {
      fs.readdirSync(nvmDir).forEach(v => candidates.push(`${nvmDir}/${v}/bin/claude`));
    }
  } catch {}
  for (const c of candidates) {
    try { fs.accessSync(c, fs.constants.X_OK); return c; } catch {}
  }
  try {
    const found = execSync('which claude 2>/dev/null || command -v claude 2>/dev/null', { encoding: 'utf8', timeout: 3000 }).trim();
    if (found) return found;
  } catch {}
  return 'claude';
}

function proxyAvailable(port) {
  return new Promise(resolve => {
    const s = net.createConnection(port, '127.0.0.1');
    s.setTimeout(1500);
    s.on('connect',  () => { s.destroy(); resolve(true);  });
    s.on('error',    () => resolve(false));
    s.on('timeout',  () => { s.destroy(); resolve(false); });
  });
}

// ── Yahoo Finance HTTPS fetch ─────────────────────────────────────────────────
function yfFetch(urlPath) {
  return new Promise((resolve, reject) => {
    const fullUrl = `${YF_BASE}${urlPath}`;
    log('YF', `GET ${urlPath.slice(0, 80)}`);

    const options = {
      hostname: 'query1.finance.yahoo.com',
      port:     443,
      path:     urlPath,
      method:   'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'identity',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    };

    const req = https.request(options, res => {
      let raw = '';
      res.on('data', chunk => { raw += chunk.toString(); });
      res.on('end', () => {
        log('YF', `HTTP ${res.statusCode}  bytes=${raw.length}`);
        if (res.statusCode !== 200) {
          return reject(new Error(`Yahoo Finance returned ${res.statusCode}: ${raw.slice(0, 200)}`));
        }
        try {
          resolve(JSON.parse(raw));
        } catch {
          reject(new Error(`Yahoo Finance non-JSON response: ${raw.slice(0, 200)}`));
        }
      });
    });

    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Yahoo Finance request timed out'));
    });

    req.on('error', err => reject(new Error(`Yahoo Finance network error: ${err.message}`)));
    req.end();
  });
}

// ── NSE Market status (IST) ───────────────────────────────────────────────────
function isNseOpen() {
  const ist  = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const day  = ist.getDay(); // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false;
  const mins = ist.getHours() * 60 + ist.getMinutes();
  return mins >= 9 * 60 + 15 && mins < 15 * 60 + 30;
}

// ── NSE Chart endpoint ────────────────────────────────────────────────────────
// Maps our timeframe IDs to Yahoo Finance parameters
const TF_MAP = {
  '5m':  { interval: '5m',  range: '60d'  },
  '15m': { interval: '15m', range: '60d'  },
  '30m': { interval: '30m', range: '60d'  },
  '45m': { interval: '60m', range: '6mo'  }, // YF has no 45m; use 60m
  '1h':  { interval: '60m', range: '6mo'  },
  '4h':  { interval: '1d',  range: '2y'   }, // 4h not available in YF, use 1d
  '1d':  { interval: '1d',  range: '2y'   },
  '1w':  { interval: '1wk', range: '5y'   },
  '1mo': { interval: '1mo', range: '10y'  },
};

async function handleNseChart(body) {
  const { symbol, timeframe } = body;
  if (!symbol || !timeframe) throw new Error('symbol and timeframe are required');

  const tf = TF_MAP[timeframe] || TF_MAP['1d'];
  const ticker = symbol.endsWith('.NS') ? symbol : `${symbol}.NS`;

  const urlPath = `/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${tf.interval}&range=${tf.range}&includePrePost=false`;

  const data = await yfFetch(urlPath);
  const result = data?.chart?.result?.[0];
  if (!result) throw new Error(`No data returned for ${symbol}`);

  const meta   = result.meta || {};
  const quotes = result.indicators?.quote?.[0] || {};
  const timestamps = result.timestamp || [];

  const candles = timestamps.map((ts, i) => {
    const d = new Date(ts * 1000);
    return {
      time:     d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }),
      datetime: d.toLocaleString('en-IN', {
        month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
        hour12: false, timeZone: 'Asia/Kolkata',
      }),
      timestamp: ts,
      open:   quotes.open?.[i]   ?? null,
      high:   quotes.high?.[i]   ?? null,
      low:    quotes.low?.[i]    ?? null,
      close:  quotes.close?.[i]  ?? null,
      volume: quotes.volume?.[i] ?? 0,
    };
  }).filter(c => c.close !== null && c.close > 0);

  const ticker_info = {
    price:     meta.regularMarketPrice        || meta.previousClose || 0,
    prevClose: meta.previousClose             || 0,
    change:    meta.regularMarketChangePercent|| 0,
    high24:    meta.regularMarketDayHigh      || 0,
    low24:     meta.regularMarketDayLow       || 0,
    volume:    meta.regularMarketVolume       || 0,
    currency:  meta.currency                  || 'INR',
    name:      meta.longName || meta.shortName || symbol,
    exchange:  meta.exchangeName              || 'NSE',
  };

  return { candles, ticker: ticker_info };
}

// ── NSE Batch quotes ──────────────────────────────────────────────────────────
//
// Single 60-minute candle fetch (interval=60m, range=5d) gives us everything:
//   • Hourly candles  → hourly change during live session
//   • Daily grouping  → last complete session change when market is closed
//
async function handleNseBatch(body) {
  const { symbols } = body;
  if (!symbols?.length) throw new Error('symbols array required');

  const marketOpen = isNseOpen();

  const results = await Promise.allSettled(
    symbols.map(async sym => {
      const ticker  = sym.endsWith('.NS') ? sym : `${sym}.NS`;
      // 60m candles for 5 trading days — one request covers both hourly + daily needs
      const urlPath = `/v8/finance/chart/${encodeURIComponent(ticker)}?interval=60m&range=5d&includePrePost=false`;
      const data    = await yfFetch(urlPath);
      const result  = data?.chart?.result?.[0];
      const meta    = result?.meta  || {};
      const qdata   = result?.indicators?.quote?.[0] || {};
      const tss     = result?.timestamp || [];

      // Build candle list, tagging each with its IST date string for day-grouping
      const candles = tss
        .map((ts, i) => ({
          ts,
          close: qdata.close?.[i],
          date:  new Date(ts * 1000).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }),
        }))
        .filter(c => c.close != null && c.close > 0);

      // ── Hourly change (active session)
      // Last hourly candle vs the one before it.
      // During market hours the last candle is the current partial hour (close ≈ live price).
      let hourlyChange = meta.regularMarketChangePercent ?? 0;
      if (candles.length >= 2) {
        const last = candles[candles.length - 1];
        const prev = candles[candles.length - 2];
        hourlyChange = ((last.close - prev.close) / prev.close) * 100;
      }

      // ── Last-session change (market closed)
      // Compare the last close of the most-recent trading day to the last close
      // of the day before it — works on weekends, pre-market, and post-market.
      let prevSessionChange = meta.regularMarketChangePercent ?? 0;
      let prevSessionDate   = null;
      const tradingDates = [...new Set(candles.map(c => c.date))];
      if (tradingDates.length >= 2) {
        const lastDate = tradingDates[tradingDates.length - 1];
        const prevDate = tradingDates[tradingDates.length - 2];
        const lastDayCandles = candles.filter(c => c.date === lastDate);
        const prevDayCandles = candles.filter(c => c.date === prevDate);
        const lastClose = lastDayCandles[lastDayCandles.length - 1].close;
        const prevClose = prevDayCandles[prevDayCandles.length - 1].close;
        prevSessionChange = ((lastClose - prevClose) / prevClose) * 100;
        const lastTs = lastDayCandles[lastDayCandles.length - 1].ts;
        prevSessionDate = new Date(lastTs * 1000)
          .toLocaleDateString('en-IN', { month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' });
      }

      // ── Pick the right change value for the client
      const change = marketOpen ? hourlyChange : prevSessionChange;

      return {
        symbol:           sym,
        price:            meta.regularMarketPrice || 0,
        change,           // what StockRow displays
        hourlyChange,     // always available for UI labels
        prevSessionChange,
        prevSessionDate,
        marketOpen,
        volume:           meta.regularMarketVolume || 0,
        name:             meta.longName || meta.shortName || sym,
      };
    })
  );

  return results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);
}

// ── Spawn claude CLI ──────────────────────────────────────────────────────────
function callClaude({ prompt, systemPrompt, model = 'sonnet' }, useProxy) {
  return new Promise((resolve, reject) => {
    if (activeProcess) {
      log('WARN', 'Killing leftover process');
      try { activeProcess.proc.kill('SIGTERM'); } catch {}
      activeProcess = null;
    }

    const claudeBin = findClaude();
    const id        = crypto.randomUUID().slice(0, 8);

    const proxyEnv = useProxy ? {
      HTTP_PROXY:  `http://127.0.0.1:${COWORK_PROXY_PORT}`,
      HTTPS_PROXY: `http://127.0.0.1:${COWORK_PROXY_PORT}`,
      http_proxy:  `http://127.0.0.1:${COWORK_PROXY_PORT}`,
      https_proxy: `http://127.0.0.1:${COWORK_PROXY_PORT}`,
    } : {};

    const fullPrompt = systemPrompt
      ? `<system>\n${systemPrompt}\n</system>\n\n${prompt}`
      : prompt;

    const claudeDir     = path.dirname(fs.realpathSync(claudeBin).replace(/\s.*/, ''));
    const augmentedPath = `${claudeDir}:${process.env.PATH || '/usr/local/bin:/usr/bin:/bin'}`;

    const env = {
      ...process.env,
      PATH:            augmentedPath,
      ANTHROPIC_MODEL: model,
      ...proxyEnv,
    };

    log('START', `id=${id}  proxy=${useProxy ? `localhost:${COWORK_PROXY_PORT}` : 'none'}`);

    const proc = spawn(claudeBin, ['-p', '--output-format', 'json', '--model', model], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env,
    });

    activeProcess = { proc, id, startedAt: Date.now() };
    proc.stdin.write(fullPrompt, 'utf8');
    proc.stdin.end();

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', chunk => { stdout += chunk.toString(); });
    proc.stderr.on('data', chunk => { stderr += chunk.toString(); });

    proc.on('error', err => {
      cleanup();
      reject(new Error(`Cannot start claude: ${err.message}`));
    });

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out after ${TIMEOUT_MS / 1000}s`));
    }, TIMEOUT_MS);

    proc.on('close', (code, signal) => {
      clearTimeout(timer);
      cleanup();

      if (signal === 'SIGTERM' || signal === 'SIGKILL') {
        return reject(new Error('ABORTED'));
      }

      if (!stdout.trim()) {
        const rawErr = stderr.trim() || `No output (exit ${code})`;
        return reject(new Error(rawErr));
      }

      try {
        const parsed = JSON.parse(stdout.trim());
        if (parsed.is_error) {
          return reject(new Error(parsed.result || `claude error (exit ${code})`));
        }
        resolve(parsed.result ?? '');
      } catch (e) {
        reject(new Error(`Failed to parse claude output: ${e.message}`));
      }
    });

    function cleanup() { activeProcess = null; }
  });
}

// ── Gemini API ────────────────────────────────────────────────────────────────
function callGemini({ prompt, systemPrompt, model = 'gemini-2.5-flash' }) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return reject(new Error('GEMINI_API_KEY is not set'));

    geminiAbort = false;

    const bodyStr = JSON.stringify({
      contents:          [{ parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: systemPrompt || '' }] },
      generationConfig:  {
        temperature:      0.3,
        maxOutputTokens:  1500,
        responseMimeType: 'application/json',
        thinkingConfig:   { thinkingBudget: 0 },
      },
    });

    const reqPath = `/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port:     443,
      path:     reqPath,
      method:   'POST',
      headers: {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
      },
    };

    let settled = false;
    const done = (err, val) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (err) reject(err); else resolve(val);
    };

    const timer = setTimeout(() => done(new Error(`Gemini timed out after ${TIMEOUT_MS / 1000}s`)), TIMEOUT_MS);

    const req = https.request(options, res => {
      let raw = '';
      res.on('data', chunk => { raw += chunk.toString(); });
      res.on('end', () => {
        if (geminiAbort) return done(new Error('ABORTED'));
        let parsed;
        try { parsed = JSON.parse(raw); } catch {
          return done(new Error(`Gemini non-JSON (HTTP ${res.statusCode}): ${raw.slice(0, 200)}`));
        }
        if (res.statusCode !== 200) {
          const msg = parsed?.error?.message || `Gemini error ${res.statusCode}`;
          return done(new Error(`Gemini ${res.statusCode}: ${msg}`));
        }
        const parts = parsed?.candidates?.[0]?.content?.parts ?? [];
        const text  = parts.find(p => p.text && !p.thought)?.text ?? parts.find(p => p.text)?.text ?? '';
        if (!text) return done(new Error('Gemini returned empty content'));
        done(null, text);
      });
    });

    req.on('error', err => {
      if (geminiAbort) return done(new Error('ABORTED'));
      done(new Error(`Gemini network error: ${err.message}`));
    });

    req.write(bodyStr);
    req.end();
  });
}

// ── Client info helpers (for request logging) ─────────────────────────────────
function getClientIp(req) {
  // x-forwarded-for is set by Render / proxies; fall back to socket address
  const fwd = req.headers['x-forwarded-for'];
  return (fwd ? fwd.split(',')[0].trim() : req.socket?.remoteAddress) || 'unknown';
}

function getDeviceType(ua = '') {
  if (/mobile/i.test(ua))  return 'mobile';
  if (/tablet/i.test(ua))  return 'tablet';
  return 'desktop';
}

// ── HTTP server ───────────────────────────────────────────────────────────────
const IS_PROD = process.env.NODE_ENV === 'production';

const ALLOWED_ORIGINS = new Set(
  (process.env.ALLOWED_ORIGINS || 'http://localhost:4000,http://localhost:4001')
    .split(',').map(s => s.trim()).filter(Boolean)
);

function setCors(res, reqOrigin) {
  // If origin is explicitly whitelisted, echo it back (allows credentials if ever needed).
  // Otherwise fall through to '*' — safe for this public read-only API.
  if (reqOrigin && ALLOWED_ORIGINS.has(reqOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', reqOrigin);
    res.setHeader('Vary', 'Origin');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', c => { raw += c; });
    req.on('end',  () => { try { resolve(JSON.parse(raw)); } catch(e) { reject(e); } });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  setCors(res, req.headers['origin'] || '');

  // ── Request logging — IP, device type, user-agent ──
  if (req.method !== 'OPTIONS') {
    const ip     = getClientIp(req);
    const ua     = req.headers['user-agent'] || 'unknown';
    const device = getDeviceType(ua);
    log('REQ', `${req.method} ${req.url}  ip=${ip}  device=${device}  ua=${ua.slice(0, 80)}`);
  }

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // POST /api/nse/chart
  if (req.method === 'POST' && req.url === '/api/nse/chart') {
    log('HTTP', 'POST /api/nse/chart');
    try {
      const body = await readBody(req);
      const result = await handleNseChart(body);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err) {
      log('HTTP', `→ 500  ${err.message.slice(0, 100)}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // POST /api/nse/batch
  if (req.method === 'POST' && req.url === '/api/nse/batch') {
    log('HTTP', 'POST /api/nse/batch');
    try {
      const body = await readBody(req);
      const result = await handleNseBatch(body);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err) {
      log('HTTP', `→ 500  ${err.message.slice(0, 100)}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // POST /api/claude
  if (req.method === 'POST' && req.url === '/api/claude') {
    log('HTTP', 'POST /api/claude');
    const claudeBinCheck = findClaude();
    try { fs.accessSync(claudeBinCheck, fs.constants.X_OK); } catch {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Claude AI requires the claude CLI — run "node server.js" locally.' }));
      return;
    }
    try {
      const body     = await readBody(req);
      const useProxy = await proxyAvailable(COWORK_PROXY_PORT);
      log('HTTP', `Cowork proxy → ${useProxy ? 'DETECTED ✓' : 'not found'}`);

      let content;
      try {
        content = await callClaude(body, useProxy);
      } catch (err) {
        if (!useProxy && (err.message.includes('ENOTFOUND') || err.message.includes('Unable to connect'))) {
          content = await callClaude(body, true);
        } else {
          throw err;
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ content }));
    } catch (err) {
      const isAbort = err.message === 'ABORTED';
      res.writeHead(isAbort ? 499 : 500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // POST /api/claude/abort
  if (req.method === 'POST' && req.url === '/api/claude/abort') {
    if (activeProcess) {
      try { activeProcess.proc.kill('SIGTERM'); } catch {}
      activeProcess = null;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ aborted: true }));
    return;
  }

  // POST /api/gemini
  if (req.method === 'POST' && req.url === '/api/gemini') {
    log('HTTP', 'POST /api/gemini');
    try {
      const body    = await readBody(req);
      const content = await callGemini(body);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ content }));
    } catch (err) {
      const isAbort = err.message === 'ABORTED';
      res.writeHead(isAbort ? 499 : 500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // POST /api/gemini/abort
  if (req.method === 'POST' && req.url === '/api/gemini/abort') {
    geminiAbort = true;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ aborted: true }));
    return;
  }

  // GET /api/nse/search?q=query — Yahoo Finance symbol autocomplete for NSE stocks
  if (req.method === 'GET' && req.url.startsWith('/api/nse/search')) {
    const q = new URL(req.url, 'http://localhost').searchParams.get('q') || '';
    if (!q.trim()) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('[]');
      return;
    }
    log('HTTP', `GET /api/nse/search?q=${q}`);
    try {
      const data = await yfFetch(
        `/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=15&newsCount=0&listsCount=0&region=IN&lang=en-IN`
      );
      const quotes = (data?.quotes || [])
        .filter(item => item.symbol?.endsWith('.NS') && item.quoteType === 'EQUITY')
        .map(item => ({
          id:       item.symbol.replace('.NS', ''),
          label:    item.symbol.replace('.NS', ''),
          name:     item.longname || item.shortname || item.symbol.replace('.NS', ''),
          sector:   item.sector || 'NSE Equity',
          exchange: item.exchDisp || 'NSE',
        }));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(quotes));
    } catch (err) {
      log('HTTP', `→ search error: ${err.message}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('[]');
    }
    return;
  }

  // GET /health
  if (req.method === 'GET' && req.url === '/health') {
    const claudeBin = findClaude();
    const useProxy  = await proxyAvailable(COWORK_PROXY_PORT);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', claude: claudeBin, proxy: useProxy ? `localhost:${COWORK_PROXY_PORT}` : null }));
    return;
  }

  res.writeHead(404); res.end();
});

const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';
server.listen(PORT, HOST, async () => {
  const claudeBin = findClaude();
  const useProxy  = await proxyAvailable(COWORK_PROXY_PORT);
  console.log('\n══════════════════════════════════════════════════');
  console.log('  ₹  akcnse — NSE Equities Terminal Server');
  console.log('══════════════════════════════════════════════════');
  console.log(`  Port     : http://localhost:${PORT}`);
  console.log(`  Claude   : ${claudeBin}`);
  console.log(`  Proxy    : ${useProxy ? `✓ Cowork proxy (localhost:${COWORK_PROXY_PORT})` : '✗ not found'}`);
  console.log(`  Gemini   : ${process.env.GEMINI_API_KEY ? '✓ API key set' : '✗ GEMINI_API_KEY not set'}`);
  console.log('══════════════════════════════════════════════════');
  console.log('\n  Keep this running alongside: npm start\n');
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') console.error(`\n⚠ Port ${PORT} in use — try PORT=3002 node server.js\n`);
  else console.error(err);
  process.exit(1);
});

process.on('SIGINT',  () => { if (activeProcess) try { activeProcess.proc.kill(); } catch {} process.exit(0); });
process.on('SIGTERM', () => { if (activeProcess) try { activeProcess.proc.kill(); } catch {} process.exit(0); });
