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
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("airwise_user");
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        // If we already have a cached token/user, initial loading is fast
        return !localStorage.getItem("airwise_token");
      } catch {}
    }
    return true;
  });

  const persistUser = (u: User | null) => {
    setUser(u);
    if (typeof window !== "undefined") {
      try {
        if (u) {
          localStorage.setItem("airwise_user", JSON.stringify(u));
        } else {
          localStorage.removeItem("airwise_user");
        }
      } catch {}
    }
  };

  // Restore authenticated session on application mount
  const restoreSession = useCallback(async () => {
    try {
      const res = await ApiClient.getMe();
      if (res.success && res.data) {
        persistUser(res.data);
      } else {
        // If /me failed, try refreshing session from cookie
        const refreshRes = await ApiClient.refreshSession().catch(() => null);
        if (refreshRes?.success && refreshRes.data?.user) {
          persistUser(refreshRes.data.user);
        } else {
          // Only clear if refresh genuinely failed and no valid session exists
          if (!ApiClient.getAccessToken()) {
            persistUser(null);
          }
        }
      }
    } catch {
      // If network fails (e.g. offline), retain cached user rather than kicking out
      if (!ApiClient.getAccessToken()) {
        persistUser(null);
      }
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
        persistUser(res.data.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await ApiClient.register(payload);
      const userObj = res.data?.user;
      if (userObj) {
        persistUser(userObj);
        return userObj;
      }
      throw new Error(res.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await ApiClient.logout().catch(() => null);
      persistUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logoutAll = async () => {
    setIsLoading(true);
    try {
      await ApiClient.logoutAll().catch(() => null);
      persistUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await ApiClient.getMe();
      if (res.success && res.data) {
        persistUser(res.data);
      }
    } catch {
      // Ignored
    }
  };

  const updateProfile = async (payload: ProfileUpdatePayload): Promise<User> => {
    const res = await ApiClient.updateMe(payload);
    if (res.success && res.data) {
      persistUser(res.data);
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
