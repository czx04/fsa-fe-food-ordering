import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useMemo,
} from "react";
import { ToastContainer } from "../components/Toast";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const MAX_TOASTS = 5;

  const addToast = useCallback(
    (message: string, type: ToastType) => {
      setToasts((prevToasts) => {
        // Prevent duplicate toasts with the exact same message and type
        if (prevToasts.some((t) => t.message === message && t.type === type)) {
          return prevToasts;
        }

        const id = `${Date.now()}-${Math.random()}`;

        // Auto-remove toast after 4 seconds
        setTimeout(() => {
          removeToast(id);
        }, 4000);

        // Keep at most MAX_TOASTS
        const updated = [...prevToasts, { id, message, type }];
        return updated.slice(-MAX_TOASTS);
      });
    },
    [removeToast],
  );

  const success = useCallback(
    (message: string) => addToast(message, "success"),
    [addToast],
  );
  const error = useCallback(
    (message: string) => addToast(message, "error"),
    [addToast],
  );
  const info = useCallback(
    (message: string) => addToast(message, "info"),
    [addToast],
  );
  const warning = useCallback(
    (message: string) => addToast(message, "warning"),
    [addToast],
  );

  const value = useMemo(
    () => ({ success, error, info, warning }),
    [success, error, info, warning],
  );
  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
