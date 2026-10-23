"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { getMe, login, register, logout, User } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hydrate auth on mount
  useEffect(() => {
    const hydrate = async () => {
      try {
        const token = localStorage.getItem("amana_token");
        if (token) {
          const userData = await getMe();
          setUser(userData);
        }
      } catch (err) {
        localStorage.removeItem("amana_token");
      } finally {
        setIsLoading(false);
      }
    };
    hydrate();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const { access_token } = await login(email, password);
      localStorage.setItem("amana_token", access_token);
      const userData = await getMe();
      setUser(userData);
    } catch (err: any) {
      const message = err.data?.detail || err.message || "Login failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const { access_token } = await register(email, password);
      localStorage.setItem("amana_token", access_token);
      const userData = await getMe();
      setUser(userData);
    } catch (err: any) {
      const message = err.data?.detail || err.message || "Registration failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
