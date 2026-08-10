import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, tokenStorage } from "../lib/api";
import type { User } from "../types";

interface LoginPayload {
  email: string;
  password: string;
  remember: boolean;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!tokenStorage.getAccess()) {
      setUser(null);
      return;
    }
    const response = await api.get<{ user: User }>("/auth/me");
    const nextUser = response.data.user;
    if (nextUser.role === "customer") {
      tokenStorage.clear();
      throw new Error("Tài khoản khách hàng không có quyền truy cập dashboard.");
    }
    setUser(nextUser);
  }, []);

  useEffect(() => {
    refreshUser()
      .catch(() => {
        tokenStorage.clear();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, [refreshUser]);

  useEffect(() => {
    const expire = () => setUser(null);
    window.addEventListener("dashboard:session-expired", expire);
    return () => window.removeEventListener("dashboard:session-expired", expire);
  }, []);

  const login = useCallback(async ({ email, password, remember }: LoginPayload) => {
    const response = await api.post<{ user: User; accessToken: string; refreshToken?: string }>("/auth/login", {
      email,
      password,
    });
    if (response.data.user.role === "customer") {
      throw new Error("Dashboard chỉ dành cho chủ nhà hàng và quản trị viên.");
    }
    tokenStorage.set(response.data.accessToken, response.data.refreshToken, remember);
    setUser(response.data.user);
    return response.data.user;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = tokenStorage.getRefresh();
    try {
      if (refreshToken) await api.post("/auth/logout", { refreshToken });
    } finally {
      tokenStorage.clear();
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({ user, isLoading, login, logout, refreshUser }), [user, isLoading, login, logout, refreshUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook và provider cùng file để context không bị export công khai; Fast Refresh vẫn giữ state provider.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth phải được dùng trong AuthProvider.");
  return value;
};
