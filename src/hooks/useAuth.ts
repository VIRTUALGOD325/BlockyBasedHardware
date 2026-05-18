import { useState, useCallback, useEffect } from "react";

export interface User {
  id: number;
  name: string;
  email: string;
  provider: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:5050/api"
    : "/api/scratch/api";

const TOKEN_KEY = "hardwareAuthToken";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem(TOKEN_KEY)
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = user !== null;

  const storeToken = (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    setAccessToken(token);
  };

  const clearToken = () => {
    localStorage.removeItem(TOKEN_KEY);
    setAccessToken(null);
  };

  useEffect(() => {
    refreshToken().finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null);
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        if (data.accessToken) storeToken(data.accessToken);
        return true;
      }
      setError(data.error || "Login failed");
      return false;
    } catch {
      setError("Network error. Please try again.");
      return false;
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setError(null);
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        if (data.accessToken) storeToken(data.accessToken);
        return true;
      }
      setError(data.error || "Registration failed");
      return false;
    } catch {
      setError("Network error. Please try again.");
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    clearToken();
    setUser(null);
  }, []);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      if (data.accessToken) storeToken(data.accessToken);
      return true;
    }
    clearToken();
    return false;
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshToken,
    clearError,
  };
};
