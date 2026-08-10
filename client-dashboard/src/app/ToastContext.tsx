import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, CircleAlert, X } from "lucide-react";

interface ToastItem {
  id: number;
  tone: "success" | "error";
  message: string;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const add = useCallback((tone: ToastItem["tone"], message: string) => {
    const id = Date.now() + Math.random();
    setItems((current) => [...current, { id, tone, message }]);
    window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 4500);
  }, []);

  const value = useMemo(
    () => ({ success: (message: string) => add("success", message), error: (message: string) => add("error", message) }),
    [add],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {items.map((item) => (
          <div key={item.id} className={`toast toast-${item.tone}`}>
            {item.tone === "success" ? <CheckCircle2 size={18} /> : <CircleAlert size={18} />}
            <span>{item.message}</span>
            <button aria-label="Đóng thông báo" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}>
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
  const value = useContext(ToastContext);
  if (!value) throw new Error("useToast phải được dùng trong ToastProvider.");
  return value;
};
