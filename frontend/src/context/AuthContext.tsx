"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User, AuthResponse } from "../types";
import { fetcher, getStoredToken, setStoredAuth, clearStoredAuth, AUTH_USER_KEY } from "../lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getStoredToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      setToken(storedToken);

      // Try cached user first for instantaneous UI render
      if (typeof window !== "undefined") {
        const cachedUser = localStorage.getItem(AUTH_USER_KEY);
        if (cachedUser) {
          try {
            setUser(JSON.parse(cachedUser));
          } catch {}
        }
      }

      // Verify token with backend /api/auth/me
      try {
        const userData: User = await fetcher("/auth/me");
        setUser(userData);
        setStoredAuth(storedToken, userData);
      } catch (err) {
        console.warn("Session expired or invalid, clearing auth", err);
        clearStoredAuth();
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res: AuthResponse = await fetcher("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    setToken(res.access_token);
    setUser(res.user);
    setStoredAuth(res.access_token, res.user);
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const res: AuthResponse = await fetcher("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });

    setToken(res.access_token);
    setUser(res.user);
    setStoredAuth(res.access_token, res.user);
  }, []);

  const logout = useCallback(() => {
    clearStoredAuth();
    setUser(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
