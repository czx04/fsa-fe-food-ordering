import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../utils/api";
import { socketService } from "../services/socketService";

interface UserAddress {
  _id?: string;
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  ward: string;
  district: string;
  city: string;
  isDefault: boolean;
}

interface User {
  _id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
  status?: string;
  avatarUrl?: string;
  addresses?: UserAddress[];
  favoriteRestaurantIds?: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, userData: User) => void;
  logout: () => void;
  updateUser: (newUserData: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => { },
  logout: () => { },
  updateUser: () => { },
  refreshUser: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Xử lý khi refresh token thất bại (interceptor bắn event customer:session-expired)
  // → đăng xuất ngay để tránh UI bị "kẹt" ở trạng thái tưởng chừng đã đăng nhập.
  useEffect(() => {
    const handleSessionExpired = () => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      socketService.setAuthToken(null);
      setUser(null);
    };
    window.addEventListener("customer:session-expired", handleSessionExpired);
    return () =>
      window.removeEventListener(
        "customer:session-expired",
        handleSessionExpired,
      );
  }, []);

  const refreshUser = async () => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const res = await api.get("/auth/me");
        setUser(res.data.user);
      } catch (error) {
        console.error("Failed to restore session", error);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      }
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("accessToken");
      socketService.setAuthToken(token);
      await refreshUser();
      setIsLoading(false);
    };

    initAuth();

    // Auto refresh user data when tab becomes active again (e.g. after verifying email in another tab)
    const handleFocus = () => {
      if (localStorage.getItem("accessToken")) {
        refreshUser();
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const login = (accessToken: string, refreshToken: string, userData: User) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    socketService.setAuthToken(accessToken);
    setUser(userData);
  };

  const logout = () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      // Background call to invalidate the refresh token on the server
      api.post("/auth/logout", { refreshToken }).catch(console.error);
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    socketService.setAuthToken(null);
    setUser(null);
  };

  const updateUser = (newUserData: User) => {
    setUser(newUserData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
