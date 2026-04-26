/**
 * Google Gemini integration for akcnse — NSE Equities Terminal
 * Routes through local proxy server (server.js on :4001)
 *
 * Auth flow:
 *   idToken     — Google ID token (JWT), sent as Authorization: Bearer <token>
 *                 Used by the server to verify the caller's identity.
 *   accessToken — OAuth2 access token with generative-language scope, sent as X-Gemini-Token.
 *                 Used by the server to call the Gemini API on behalf of the user,
 *                 consuming the user's own quota instead of the server API key.
 */

import { buildPrompt } from './claude';
import { API_BASE } from './api.js';

const PROXY_URL  = `${API_BASE}/api/gemini`;
const MODELS_URL = `${API_BASE}/api/gemini/models`;

// ── Fallback static model list (shown before dynamic models load) ─────────────
export const GEMINI_MODELS = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  { id: 'gemini-1.5-pro',   label: 'Gemini 1.5 Pro'   },
];

const SYSTEM_PROMPT = 'You are an expert NSE equity technical analyst. Respond with ONLY valid JSON — no markdown code fences, no preamble, no explanation outside the JSON object. Your signal must be one of: LONG, SHORT, or HOLD. All prices must be in INR (₹).';

// ── Abort ─────────────────────────────────────────────────────────────────────
let _abortController = null;

export async function abortGeminiAnalysis() {
  if (_abortController) { _abortController.abort(); _abortController = null; }
  try { await fetch(`${API_BASE}/api/gemini/abort`, { method: 'POST' }); } catch {}
}

// ── Fetch models available to the signed-in user ──────────────────────────────
// Returns an array of { id, label } objects, or null on failure (caller uses fallback).
export async function getGeminiModels(idToken, accessToken) {
  if (!idToken || !accessToken) return null;
  try {
    const resp = await fetch(MODELS_URL, {
      headers: {
        'Authorization':  `Bearer ${idToken}`,
        'X-Gemini-Token': accessToken,
      },
    });
    if (!resp.ok) return null;
    const { models } = await resp.json();
    return Array.isArray(models) && models.length ? models : null;
  } catch {
    return null;
  }
}

// ── Main analysis call ────────────────────────────────────────────────────────
// idToken     — identifies the user (required, verified server-side)
// accessToken — user's Gemini OAuth token (optional; if absent, server falls back to API key)
export async function getGeminiAnalysis(
  data,
  model       = 'gemini-2.5-flash',
  idToken     = null,
  accessToken = null,
) {
  const prompt = buildPrompt(data);
  _abortController = new AbortController();
  const { signal } = _abortController;

  const headers = { 'Content-Type': 'application/json' };
  if (idToken)     headers['Authorization']  = `Bearer ${idToken}`;
  if (accessToken) headers['X-Gemini-Token'] = accessToken;

  let response;
  try {
    response = await fetch(PROXY_URL, {
      method:  'POST',
      headers,
      body:    JSON.stringify({ prompt, systemPrompt: SYSTEM_PROMPT, model }),
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('ABORTED');
    throw new Error('Cannot reach server — is node server.js running?');
  } finally {
    _abortController = null;
  }

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const msg = body?.error || `Server error ${response.status}`;
    if (msg === 'ABORTED') throw new Error('ABORTED');
    throw new Error(msg);
  }

  const raw = (body.content ?? '').trim();

  // 3-pass JSON extraction
  try { return JSON.parse(raw); } catch {}
  const stripped = raw.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/im, '').trim();
  try { return JSON.parse(stripped); } catch {}
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) { try { return JSON.parse(match[0]); } catch {} }

  throw new Error('Gemini returned malformed JSON — try again');
}
