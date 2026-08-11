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
  role: string;
  status?: string;
  avatarUrl?: string;
  addresses?: UserAddress[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, refreshToken: string, userData: User) => void;
  logout: () => void;
  updateUser: (newUserData: User) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
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

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("accessToken");
      socketService.setAuthToken(token);
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
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = (token: string, refreshToken: string, userData: User) => {
    localStorage.setItem("accessToken", token);
    localStorage.setItem("refreshToken", refreshToken);
    socketService.setAuthToken(token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
    socketService.setAuthToken(null);
    // Optional: Call backend /auth/logout to invalidate refresh token
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
