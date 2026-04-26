/**
 * Google Analytics 4 — akcnse analytics
 *
 * Setup:
 *   1. analytics.google.com → Admin → Create Property → Web stream
 *   2. Copy the Measurement ID  (format: G-XXXXXXXXXX)
 *   3. Add VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX to .env (dev)
 *      or set it in the Render dashboard environment variables (prod)
 *
 * All exported functions are safe no-ops when the env var is not set.
 *
 * GA4 automatically collects:
 *   • Device type, OS, browser, screen size, viewport
 *   • Country / city (derived from anonymised IP)
 *   • Session duration, bounce rate
 *   • First-visit, session_start, page_view events
 *
 * Custom events tracked here:
 *   symbol_change          — user switches equity symbol
 *   timeframe_change       — user switches chart timeframe
 *   gemini_analysis_start  — AI analysis triggered
 *   gemini_analysis_done   — AI analysis returned a signal
 *   gemini_analysis_error  — AI analysis failed / rate-limited
 *   data_load_time         — market data fetch duration (ms)
 *   api_error              — server-side API error surfaced to UI
 */

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
let _ready = false;

// ── Init ──────────────────────────────────────────────────────────────────────
export function initAnalytics() {
  if (!GA_ID || _ready || typeof window === 'undefined') return;
  _ready = true;

  // Inject the gtag.js script dynamically — no hard-coded ID in HTML
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  /* eslint-disable prefer-rest-params */
  window.gtag = function () { window.dataLayer.push(arguments); };
  /* eslint-enable */
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, {
    send_page_view: true,   // fires page_view automatically on init
    anonymize_ip:   true,   // GDPR-friendly IP anonymisation
  });
}

// ── Internal helper ───────────────────────────────────────────────────────────
function track(event, params = {}) {
  if (typeof window?.gtag === 'function') {
    window.gtag('event', event, params);
  }
}

// ── Symbol & timeframe ────────────────────────────────────────────────────────
export function trackSymbolChange(symbol, timeframe) {
  track('symbol_change', {
    symbol_id:     symbol.id,
    symbol_name:   symbol.name   || symbol.label,
    symbol_sector: symbol.sector || 'Unknown',
    timeframe:     timeframe.label,
  });
}

export function trackTimeframeChange(symbol, timeframe) {
  track('timeframe_change', {
    symbol_id: symbol.id,
    timeframe: timeframe.label,
  });
}

// ── Gemini analysis ───────────────────────────────────────────────────────────
export function trackGeminiStart(symbol, timeframe, model, quotaType) {
  track('gemini_analysis_start', {
    symbol_id:  symbol.id,
    timeframe:  timeframe.label,
    model,
    quota_type: quotaType, // 'user' | 'server'
  });
}

export function trackGeminiDone(symbol, model, signal, confidence) {
  track('gemini_analysis_done', {
    symbol_id:  symbol.id,
    model,
    signal,                    // 'LONG' | 'SHORT' | 'HOLD'
    confidence: confidence ?? 0,
    value:      confidence ?? 0, // GA4 uses 'value' for numeric aggregation
  });
}

export function trackGeminiError(model, errorType) {
  // errorType: 'rate_limit' | 'auth' | 'aborted' | 'network' | 'other'
  track('gemini_analysis_error', {
    model,
    error_type: errorType,
  });
}

// ── Performance ───────────────────────────────────────────────────────────────
export function trackDataLoadTime(symbol, timeframe, durationMs) {
  track('data_load_time', {
    symbol_id:   symbol.id,
    timeframe:   timeframe.label,
    duration_ms: Math.round(durationMs),
    value:       Math.round(durationMs),
  });
}

// ── API errors ────────────────────────────────────────────────────────────────
export function trackApiError(endpoint, errorMessage, extra = {}) {
  track('api_error', {
    endpoint,
    error_message: String(errorMessage).slice(0, 150),
    ...extra,
  });
}
