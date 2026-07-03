"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  clearSession,
  guestLogin,
  loadSession,
  login as apiLogin,
  register as apiRegister,
  type TokenPayload,
} from "./api";

interface AuthState {
  session: TokenPayload | null;
  loading: boolean;
  loginAsGuest: () => Promise<void>;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  registerAccount: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<TokenPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSession(loadSession());
    setLoading(false);
  }, []);

  const loginAsGuest = useCallback(async () => {
    const s = await guestLogin();
    setSession(s);
  }, []);

  const loginWithPassword = useCallback(async (email: string, password: string) => {
    const s = await apiLogin(email, password);
    setSession(s);
  }, []);

  const registerAccount = useCallback(
    async (email: string, password: string, name: string) => {
      const s = await apiRegister(email, password, name);
      if (s) {
        setSession(s);
        return true;
      }
      return false;
    },
    [],
  );

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ session, loading, loginAsGuest, loginWithPassword, registerAccount, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  return ctx;
}
