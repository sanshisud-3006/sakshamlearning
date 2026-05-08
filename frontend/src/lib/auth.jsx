import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api, { formatErr } from "./api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // skip auto check if returning from Google OAuth callback (handled by AuthCallback page)
    if (typeof window !== "undefined" && window.location.hash?.includes("session_id=")) {
      setLoading(false);
      return;
    }
    refresh();
  }, [refresh]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    if (data.access_token) localStorage.setItem("saksham_token", data.access_token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post("/auth/register", { name, email, password });
    if (data.access_token) localStorage.setItem("saksham_token", data.access_token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try { await api.post("/auth/logout"); } catch (e) { /* noop */ void formatErr(e); }
    localStorage.removeItem("saksham_token");
    setUser(null);
  };

  const exchangeGoogleSession = async (session_id) => {
    const { data } = await api.post("/auth/google-session", { session_id });
    if (data.access_token) localStorage.setItem("saksham_token", data.access_token);
    setUser(data.user);
    return data.user;
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout, refresh, exchangeGoogleSession }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
