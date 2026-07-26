import React, { createContext, useState, useEffect, useContext } from 'react';
import type { User } from '../types';

export const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : window.location.hostname.includes('lhr.life')
    ? 'https://791903ac1d4bd2.lhr.life/api'
    : `${window.location.protocol}//${window.location.hostname}:5000/api`;

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
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

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
      const res = await fetch(`${API_BASE}/auth/register-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Registration request failed');
      }

      return data.code; // Simulated OTP code
    } finally {
      setLoading(false);
    }
  };

  const registerVerify = async (email: string, code: string): Promise<void> => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

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
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      return data.message || 'Password reset request complete.';
    } catch (err: any) {
      throw new Error(err.message);
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
