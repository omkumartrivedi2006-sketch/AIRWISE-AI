"use client";

/**
 * AIRWISE AI — Centralized Authentication Provider & Session State
 * Restores sessions via HttpOnly cookies and exposes reactive authentication state across the application.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, LoginPayload, RegisterPayload, ProfileUpdatePayload } from "@/types/auth";
import { ApiClient } from "@/services/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (payload: ProfileUpdatePayload) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore authenticated session on application mount
  const restoreSession = useCallback(async () => {
    try {
      const res = await ApiClient.getMe();
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        // If /me failed, try refreshing session from cookie
        const refreshRes = await ApiClient.refreshSession().catch(() => null);
        if (refreshRes?.success && refreshRes.data?.user) {
          setUser(refreshRes.data.user);
        } else {
          setUser(null);
        }
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const res = await ApiClient.login(payload);
      if (res.success && res.data?.user) {
        setUser(res.data.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload): Promise<User> => {
    const res = await ApiClient.register(payload);
    return res.data;
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await ApiClient.logout().catch(() => null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logoutAll = async () => {
    setIsLoading(true);
    try {
      await ApiClient.logoutAll().catch(() => null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await ApiClient.getMe();
      if (res.success && res.data) {
        setUser(res.data);
      }
    } catch {
      // Ignored
    }
  };

  const updateProfile = async (payload: ProfileUpdatePayload): Promise<User> => {
    const res = await ApiClient.updateMe(payload);
    if (res.success && res.data) {
      setUser(res.data);
      return res.data;
    }
    throw new Error(res.message || "Failed to update profile");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        logoutAll,
        refreshUser,
        updateProfile,
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
