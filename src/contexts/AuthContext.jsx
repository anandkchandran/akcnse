import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const AuthContext = createContext(null);
const STORAGE_KEY  = 'akcnse_auth';
const GOOGLE_CLIENT_ID = '992886762624-rnboroufiq8ebg0t7subemaiu3lrv9gm.apps.googleusercontent.com';

// Decode JWT payload without verifying (verification happens server-side)
function decodeJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch { return null; }
}

export function AuthProvider({ children }) {
  const [user,        setUser]        = useState(null);
  const [token,       setToken]       = useState(null);       // Google ID token (JWT) — for server auth
  const [accessToken, setAccessToken] = useState(null);       // OAuth2 access token — for Gemini API calls
  const tokenClientRef = useRef(null);

  // ── Initialise the OAuth2 token client once GIS loads ─────────────────────
  const initTokenClient = useCallback(() => {
    if (!window.google?.accounts?.oauth2 || tokenClientRef.current) return;
    tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope:     'https://www.googleapis.com/auth/generative-language',
      callback:  (resp) => {
        if (resp.access_token) setAccessToken(resp.access_token);
      },
      error_callback: (err) => {
        console.warn('[AuthContext] Gemini access token error:', err?.type || err);
      },
    });
  }, []);

  useEffect(() => {
    // GIS may already be loaded or load asynchronously via the <script async> tag
    initTokenClient();
    const script = document.querySelector('script[src*="accounts.google.com/gsi"]');
    script?.addEventListener('load', initTokenClient);
    return () => script?.removeEventListener('load', initTokenClient);
  }, [initTokenClient]);

  // ── Restore persisted session on mount — discard if ID token expired ──────
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!saved?.token || !saved?.user) return;
      const payload = decodeJwt(saved.token);
      if (payload && payload.exp * 1000 > Date.now()) {
        setUser(saved.user);
        setToken(saved.token);
        // Access token is short-lived (1 h) and not persisted — request a fresh one silently
        // Triggered by the effect below once tokenClientRef is ready
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {}
  }, []);

  // ── Once user is restored and token client is ready, fetch access token silently
  useEffect(() => {
    if (user && tokenClientRef.current && !accessToken) {
      // prompt:'' = no UI if the user has already granted consent
      tokenClientRef.current.requestAccessToken({ prompt: '' });
    }
  }, [user, accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Login — called by Google One-Tap / Sign-In button ─────────────────────
  const login = useCallback((credential) => {
    const payload = decodeJwt(credential);
    if (!payload) return;
    const userData = {
      name:    payload.name    || payload.email,
      email:   payload.email,
      picture: payload.picture || null,
      sub:     payload.sub,
    };
    setUser(userData);
    setToken(credential);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: userData, token: credential }));

    // Request Gemini access token right after sign-in.
    // Uses prompt:'' so there's no extra pop-up if already consented once;
    // first-time users will see Google's OAuth consent screen for "generative-language".
    setTimeout(() => {
      tokenClientRef.current?.requestAccessToken({ prompt: '' });
    }, 400);
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    if (accessToken) {
      try { window.google?.accounts?.oauth2?.revoke(accessToken); } catch {}
    }
    setUser(null);
    setToken(null);
    setAccessToken(null);
    localStorage.removeItem(STORAGE_KEY);
    try { window.google?.accounts?.id?.disableAutoSelect(); } catch {}
  }, [accessToken]);

  // ── Manually re-request access (e.g. after token expires or was revoked) ──
  const requestGeminiAccess = useCallback(() => {
    tokenClientRef.current?.requestAccessToken({ prompt: 'consent' });
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, accessToken, login, logout, requestGeminiAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
