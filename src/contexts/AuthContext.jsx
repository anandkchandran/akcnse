import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const STORAGE_KEY = 'akcnse_auth';

// Decode JWT payload without verifying (verification happens server-side)
function decodeJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch { return null; }
}

export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(null);
  const [token, setToken] = useState(null);

  // Restore persisted session on mount — discard if token is expired
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!saved?.token || !saved?.user) return;
      const payload = decodeJwt(saved.token);
      if (payload && payload.exp * 1000 > Date.now()) {
        setUser(saved.user);
        setToken(saved.token);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {}
  }, []);

  const login = (credential) => {
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
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
    // Tell Google to forget the auto-select preference
    try { window.google?.accounts?.id?.disableAutoSelect(); } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
