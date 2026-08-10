import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { ToastContainer } from "../components/Toast";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prevToasts) => [...prevToasts, { id, message, type }]);
      setTimeout(() => {
        removeToast(id);
      }, 5000); // Tự động ẩn sau 5 giây
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ addToast }}>
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
  return {
    success: (message: string) => context.addToast(message, "success"),
    error: (message: string) => context.addToast(message, "error"),
    info: (message: string) => context.addToast(message, "info"),
    warning: (message: string) => context.addToast(message, "warning"),
  };
};
