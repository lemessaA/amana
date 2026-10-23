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
  hasRole: (role: string | string[]) => boolean;
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
          try {
            const userData = await getMe();
            setUser(userData);
          } catch (err) {
            // Token invalid or expired
            localStorage.removeItem("amana_token");
            setError("Session expired. Please login again.");
            setUser(null);
          }
        }
      } catch (err) {
        localStorage.removeItem("amana_token");
        setError("Failed to load user data");
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
      const message = err?.message || "Login failed";
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
      const message = err?.message || "Registration failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err: any) {
      console.error("Logout error:", err);
      // Clear local state even if logout API call fails
    } finally {
      setUser(null);
      setError(null);
      localStorage.removeItem("amana_token");
    }
  };

  const hasRole = (role: string | string[]) => {
    if (!user) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
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
        hasRole,
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
