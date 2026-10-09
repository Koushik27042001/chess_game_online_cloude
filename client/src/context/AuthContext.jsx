import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { disconnectSocket, getSocket } from "../socket/socket";

const AuthContext = createContext(null);
const TOKEN_KEY = "chess_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    disconnectSocket();
  }, []);

  const applyAuth = useCallback((nextToken, nextUser) => {
    localStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
    setUser(nextUser);
    getSocket(nextToken).connect();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await api("/api/auth/me", { token });
        if (!cancelled) {
          setUser(data.user);
          getSocket(token).connect();
        }
      } catch {
        if (!cancelled) logout();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [token, logout]);

  const login = async (email, password) => {
    const data = await api("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });
    applyAuth(data.token, data.user);
    return data.user;
  };

  const register = async (username, email, password) => {
    const data = await api("/api/auth/register", {
      method: "POST",
      body: { username, email, password },
    });
    applyAuth(data.token, data.user);
    return data.user;
  };

  const refreshUser = async () => {
    if (!token) return;
    const data = await api("/api/auth/me", { token });
    setUser(data.user);
    return data.user;
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
      refreshUser,
      isAuthenticated: Boolean(user && token),
    }),
    [user, token, loading, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
