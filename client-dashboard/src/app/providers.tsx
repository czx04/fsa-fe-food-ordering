import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { BrowserRouter } from "react-router";
import { AuthProvider } from "./AuthContext";
import { ToastProvider } from "./ToastContext";

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 20_000, retry: 1, refetchOnWindowFocus: false },
      mutations: { retry: 0 },
    },
  }));
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider><AuthProvider>{children}</AuthProvider></ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
