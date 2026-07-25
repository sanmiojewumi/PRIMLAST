import React, { createContext, useState, useEffect, useContext } from 'react';
import type { User } from '../types';

let rawApiBase = (import.meta as any).env?.VITE_API_BASE_URL || '';
if (rawApiBase.includes('<your-render-url>') || rawApiBase.includes('<') || rawApiBase.includes('>')) {
  rawApiBase = '';
}

export const API_BASE = rawApiBase 
  ? rawApiBase 
  : (
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1' || 
      window.location.hostname.startsWith('192.168.') || 
      window.location.hostname.startsWith('10.') || 
      window.location.hostname.startsWith('172.') || 
      window.location.hostname.endsWith('.local')
    )
    ? `http://${window.location.hostname}:5000/api`
    : (window.location.hostname.includes('localtunnel.me') || window.location.hostname.includes('loca.lt'))
      ? 'https://tiny-facts-rhyme.loca.lt/api'
      : window.location.hostname.includes('lhr.life')
        ? 'https://88e810fa5c0eaf.lhr.life/api'
        : `${window.location.origin}/api`;

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

async function fetchJson(url: string, options?: RequestInit): Promise<any> {
  const res = await fetch(url, options).catch(() => {
    throw new Error('Network error: Unable to connect to backend API. Please verify that your backend server is online.');
  });
  
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    throw new Error('API Configuration Error: The server returned HTML instead of JSON. This usually means the API URL (VITE_API_BASE_URL) is pointing to your frontend URL instead of the backend server. Please verify your environment variables and trigger a new deploy.');
  }
  
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
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
      const data = await fetchJson(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() })
      });

      localStorage.setItem('primeflow_token', data.token);
      localStorage.setItem('primeflow_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, phone: string): Promise<string> => {
    setLoading(true);
    try {
      const data = await fetchJson(`${API_BASE}/auth/register-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone })
      });

      return data.code; // Simulated OTP code
    } finally {
      setLoading(false);
    }
  };

  const registerVerify = async (email: string, code: string): Promise<void> => {
    setLoading(true);
    try {
      const data = await fetchJson(`${API_BASE}/auth/register-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });

      localStorage.setItem('primeflow_token', data.token);
      localStorage.setItem('primeflow_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('primeflow_token');
    localStorage.removeItem('primeflow_user');
    setToken(null);
    setUser(null);
  };

  const resetPassword = async (email: string, newPassword: string): Promise<string> => {
    const data = await fetchJson(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, newPassword })
    });
    return data.message || 'Password reset request complete.';
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
