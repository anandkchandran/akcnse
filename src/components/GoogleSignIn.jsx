/**
 * GoogleSignIn — renders either:
 *   • A "Sign in with Google" prompt card (when logged out)
 *   • A compact user chip + sign-out button (when logged in)
 *
 * Uses Google Identity Services (GIS) One Tap + button renderer.
 */
import React, { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '992886762624-rnboroufiq8ebg0t7subemaiu3lrv9gm.apps.googleusercontent.com';

// ── Logged-in user chip ───────────────────────────────────────────────────────
export function UserChip() {
  const { user, logout } = useAuth();
  const { colors: C } = useTheme();
  if (!user) return null;

  return (
    <div style={{
      display:    'flex',
      alignItems: 'center',
      gap:         6,
      padding:    '3px 8px 3px 4px',
      background:  C.bg,
      border:     `1px solid ${C.border}`,
      borderRadius: 20,
    }}>
      {user.picture
        ? <img src={user.picture} alt="" width={20} height={20} style={{ borderRadius: '50%' }} />
        : (
          <div style={{
            width: 20, height: 20, borderRadius: '50%',
            background: '#4285f4', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 700,
          }}>
            {(user.name || user.email || '?')[0].toUpperCase()}
          </div>
        )
      }
      <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 10, fontWeight: 600, color: C.text }}>
        {user.name?.split(' ')[0] || user.email}
      </span>
      <button
        onClick={logout}
        title="Sign out"
        style={{
          background: 'transparent', border: 'none',
          color: C.muted, fontSize: 11, padding: 0, lineHeight: 1,
          cursor: 'pointer',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#f85149'; }}
        onMouseLeave={e => { e.currentTarget.style.color = C.muted; }}
      >
        ✕
      </button>
    </div>
  );
}

// ── Sign-in prompt (shown inside Gemini panel when logged out) ────────────────
export function GoogleSignInPrompt({ onSuccess }) {
  const { colors: C } = useTheme();
  const { login } = useAuth();
  const btnRef = useRef(null);

  useEffect(() => {
    const init = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id:  CLIENT_ID,
        callback:   (resp) => {
          login(resp.credential);
          onSuccess?.();
        },
        auto_select: false,
        ux_mode:    'popup',
      });
      if (btnRef.current) {
        window.google.accounts.id.renderButton(btnRef.current, {
          theme: 'filled_black',
          size:  'large',
          shape: 'pill',
          text:  'signin_with',
          width: 220,
        });
      }
    };

    // GIS script may already be loaded or still loading
    if (window.google?.accounts?.id) {
      init();
    } else {
      // Wait for the script to load
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) { clearInterval(interval); init(); }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [login, onSuccess]);

  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '24px 16px',
      gap:             14,
      background:      C.card,
      border:         `1px solid ${C.border}`,
      borderRadius:    8,
      marginBottom:    10,
    }}>
      {/* Gemini dots */}
      <div style={{ display: 'flex', gap: 5 }}>
        {['#4285f4','#ea4335','#fbbc05','#34a853'].map((c, i) => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
        ))}
      </div>
      <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13, fontWeight: 700, color: C.bright }}>
        Gemini AI Analysis
      </div>
      <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 10, color: C.muted, textAlign: 'center', lineHeight: 1.5 }}>
        Sign in with Google to unlock AI-powered<br />NSE equity analysis
      </div>

      {/* Google renders its button here */}
      <div ref={btnRef} />

      <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 9, color: C.muted, textAlign: 'center' }}>
        Your account is only used for authentication.<br />NSE data remains public.
      </div>
    </div>
  );
}
