import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api';

type AuthContextType = {
  token: string | null;
  user: { id: string; email: string } | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<AuthContextType['user']>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const me = await fetch(`${import.meta.env.VITE_API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (me.ok) setUser(await me.json());
      else logout();
    })();
  }, [token]);

  async function login(email: string, password: string) {
    const data = await api<{ access_token: string }>(`/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('token', data.access_token);
    setToken(data.access_token);
  }
  
  type Me = {
    id: string;
    email: string;
    createdAt: string;
    role: 'product manager' | 'business analyst' | 'machine learning engineer' | null;
    interviewType: 'technical' | 'phone screen' | null;
    yearsOfExperience: number | null;
  };

  type AuthContextType = {
    token: string | null;
    user: Me | null;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    logout: () => void;
  };


  async function register(email: string, password: string) {
    const data = await api<{ access_token: string }>(`/auth/register`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('token', data.access_token);
    setToken(data.access_token);
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
