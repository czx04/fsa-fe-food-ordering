import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const ACCESS_KEY = "dashboardAccessToken";
const REFRESH_KEY = "dashboardRefreshToken";

export const tokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS_KEY) ?? sessionStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY) ?? sessionStorage.getItem(REFRESH_KEY),
  isPersistent: () => Boolean(localStorage.getItem(ACCESS_KEY) || localStorage.getItem(REFRESH_KEY)),
  set: (accessToken: string, refreshToken?: string, persistent = true) => {
    const storage = persistent ? localStorage : sessionStorage;
    const staleStorage = persistent ? sessionStorage : localStorage;
    staleStorage.removeItem(ACCESS_KEY);
    staleStorage.removeItem(REFRESH_KEY);
    storage.setItem(ACCESS_KEY, accessToken);
    if (refreshToken) storage.setItem(REFRESH_KEY, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
  },
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };
let refreshPromise: Promise<string> | null = null;

const refreshAccessToken = async () => {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) throw new Error("Không có phiên làm mới.");
  const response = await axios.post<{ accessToken: string; refreshToken?: string }>(
    `${import.meta.env.VITE_API_BASE_URL || "/api"}/auth/refresh`,
    { refreshToken },
  );
  tokenStorage.set(response.data.accessToken, response.data.refreshToken, tokenStorage.isPersistent());
  return response.data.accessToken;
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    if (error.response?.status !== 401 || !original || original._retry || original.url?.includes("/auth/")) {
      return Promise.reject(error);
    }
    original._retry = true;
    try {
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const token = await refreshPromise;
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    } catch {
      tokenStorage.clear();
      window.dispatchEvent(new Event("dashboard:session-expired"));
      return Promise.reject(error);
    }
  },
);
