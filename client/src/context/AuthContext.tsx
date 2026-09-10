import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import type { User } from '../types';

export const API_BASE = (import.meta as any).env?.VITE_API_URL || '/api';

const IDLE_LIMIT_MS = 10 * 60 * 1000;
const LAST_ACTIVITY_KEY = 'primeflow_last_activity';
const IDLE_LOGOUT_FLAG = 'primeflow_idle_logout';

/** Resolve avatar / upload paths whether API_BASE is relative or absolute. */
export function mediaUrl(path: string) {
  if (!path) return '';
  if (/^(https?:|blob:|data:)/i.test(path)) return path;
  if (API_BASE.startsWith('http')) {
    try {
      const origin = new URL(API_BASE).origin;
      return path.startsWith('/') ? `${origin}${path}` : `${API_BASE.replace(/\/$/, '')}/${path}`;
    } catch {
      return path;
    }
  }
  return path.startsWith('/') ? path : `${API_BASE.replace(/\/$/, '')}/${path}`;
}

async function parseResponse(res: Response) {
  const text = await res.text();
  let data: any = {};
  try {
    data = JSON.parse(text);
  } catch (e) {
    if (res.status === 503 || res.status === 502 || res.status === 504) {
      throw new Error('Server is currently spinning up or temporarily unavailable. Please retry in a few seconds.');
    }
    if (!res.ok) {
      throw new Error(`Server returned HTTP status ${res.status}.`);
    }
  }
  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
  }
  return data;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone: string) => Promise<string>;
  registerVerify: (email: string, code: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string, newPassword: string) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load persisted token and user on app mount
    const savedToken = localStorage.getItem('primeflow_token');
    const savedUser = localStorage.getItem('primeflow_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      let res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'bypass-tunnel-reminder': 'true'
        },
        body: JSON.stringify({ email, password })
      });

      // Auto-retry once if server was spinning up (502/503/504)
      if (res.status === 503 || res.status === 502 || res.status === 504) {
        await new Promise(r => setTimeout(r, 1500));
        res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'bypass-tunnel-reminder': 'true'
          },
          body: JSON.stringify({ email, password })
        });
      }

      const data = await parseResponse(res);

      localStorage.setItem('primeflow_token', data.token);
      localStorage.setItem('primeflow_user', JSON.stringify(data.user));
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
      setToken(data.token);
      setUser(data.user);
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message?.toLowerCase().includes('fetch')) {
        throw new Error('Connection failed. Please check network connectivity or API status.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, phone: string): Promise<string> => {
    setLoading(true);
    try {
      let res = await fetch(`${API_BASE}/auth/register-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone })
      });

      if (res.status === 503 || res.status === 502 || res.status === 504) {
        await new Promise(r => setTimeout(r, 1500));
        res = await fetch(`${API_BASE}/auth/register-request`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, phone })
        });
      }

      const data = await parseResponse(res);
      return data.code; // Simulated OTP code
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message?.toLowerCase().includes('fetch')) {
        throw new Error('Connection failed. Please check network connectivity or API status.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const registerVerify = async (email: string, code: string): Promise<void> => {
    setLoading(true);
    try {
      let res = await fetch(`${API_BASE}/auth/register-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });

      if (res.status === 503 || res.status === 502 || res.status === 504) {
        await new Promise(r => setTimeout(r, 1500));
        res = await fetch(`${API_BASE}/auth/register-verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code })
        });
      }

      const data = await parseResponse(res);

      localStorage.setItem('primeflow_token', data.token);
      localStorage.setItem('primeflow_user', JSON.stringify(data.user));
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
      setToken(data.token);
      setUser(data.user);
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message?.toLowerCase().includes('fetch')) {
        throw new Error('Connection failed. Please check network connectivity or API status.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback((reason?: 'idle') => {
    if (reason === 'idle') {
      sessionStorage.setItem(IDLE_LOGOUT_FLAG, '1');
    }
    localStorage.removeItem('primeflow_token');
    localStorage.removeItem('primeflow_user');
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!user) return;

    const markActivity = () => {
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    };

    const checkIdle = () => {
      const last = Number(localStorage.getItem(LAST_ACTIVITY_KEY) || '0');
      if (!last) {
        markActivity();
        return;
      }
      if (Date.now() - last >= IDLE_LIMIT_MS) {
        logout('idle');
      }
    };

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'pointerdown', 'click', 'wheel'];
    let moveThrottle: ReturnType<typeof setTimeout> | null = null;
    const onActivity = () => markActivity();
    const onMouseMove = () => {
      if (moveThrottle) return;
      moveThrottle = setTimeout(() => {
        moveThrottle = null;
        markActivity();
      }, 1000);
    };

    activityEvents.forEach((event) => window.addEventListener(event, onActivity, { passive: true }));
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    const onVisible = () => {
      if (document.visibilityState === 'visible') checkIdle();
    };
    document.addEventListener('visibilitychange', onVisible);

    const interval = window.setInterval(checkIdle, 15000);
    checkIdle();

    return () => {
      if (moveThrottle) clearTimeout(moveThrottle);
      activityEvents.forEach((event) => window.removeEventListener(event, onActivity));
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(interval);
    };
  }, [user, logout]);

  const resetPassword = async (email: string, newPassword: string): Promise<string> => {
    try {
      let res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword })
      });

      if (res.status === 503 || res.status === 502 || res.status === 504) {
        await new Promise(r => setTimeout(r, 1500));
        res = await fetch(`${API_BASE}/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, newPassword })
        });
      }

      const data = await parseResponse(res);
      return data.message || 'Password reset request complete.';
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message?.toLowerCase().includes('fetch')) {
        throw new Error('Connection failed. Please check network connectivity or API status.');
      }
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, registerVerify, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
