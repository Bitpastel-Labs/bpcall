"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { api, setAccessToken } from "@/lib/api";
import { User } from "@/types";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  signup: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        setLoading(false);
        return;
      }
      const res = await fetch(
        `${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "")}/api/auth/refresh`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        }
      );
      if (!res.ok) {
        localStorage.removeItem("refresh_token");
        setLoading(false);
        return;
      }
      const tokens = await res.json();
      setAccessToken(tokens.access_token);
      localStorage.setItem("refresh_token", tokens.refresh_token);
      const me = await api.getMe();
      setUser(me);
    } catch {
      localStorage.removeItem("refresh_token");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (identifier: string, password: string) => {
    const tokens = await api.login(identifier, password);
    setAccessToken(tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
    const me = await api.getMe();
    setUser(me);
  };

  const signup = async (email: string, username: string, password: string) => {
    const tokens = await api.signup(email, username, password);
    setAccessToken(tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
    const me = await api.getMe();
    setUser(me);
  };

  const logout = () => {
    setAccessToken(null);
    localStorage.removeItem("refresh_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
