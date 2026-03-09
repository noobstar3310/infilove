"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const SessionContext = createContext(null);

export function SessionProvider({ children, initialUser }) {
  const [user, setUser] = useState(initialUser || null);
  const [loading, setLoading] = useState(!initialUser);
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/wallet/balance");
      if (res.status === 401) {
        setUser(null);
        router.push("/login");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setUser((prev) => (prev ? { ...prev, wallet: data } : prev));
      }
    } catch {
      // Network error — silent
    } finally {
      setLoading(false);
    }
  }, [router]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
  }, [router]);

  const refreshBalance = useCallback(async () => {
    try {
      const res = await fetch("/api/wallet/balance");
      if (res.ok) {
        const data = await res.json();
        setUser((prev) => (prev ? { ...prev, wallet: data } : prev));
      }
    } catch {
      // silent
    }
  }, []);

  return (
    <SessionContext.Provider value={{ user, setUser, loading, logout, refreshBalance }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
