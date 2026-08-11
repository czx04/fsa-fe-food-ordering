import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { ToastMessage } from "../contexts/ToastContext";

const icons: Record<ToastMessage["type"], React.ReactNode> = {
  success: <CheckCircle2 className="w-5 h-5 text-green-500" />,
  error: <XCircle className="w-5 h-5 text-red-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
};

const Toast = ({
  toast,
  onRemove,
}: {
  toast: ToastMessage;
  onRemove: (id: string) => void;
}) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 flex items-start gap-3 w-80 animate-fade-in-right">
      <div className="shrink-0 pt-0.5">{icons[toast.type]}</div>
      <p className="text-sm text-gray-700 font-medium flex-grow">
        {toast.message}
      </p>
      <button
        type="button"
        onClick={() => onRemove(toast.id)}
        className="text-gray-400 hover:text-gray-600 shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastContainer = ({
  toasts,
  removeToast,
}: {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}) => {
  return (
    <div className="fixed top-4 right-4 sm:top-8 sm:right-8 z-[100] space-y-3 pointer-events-none max-w-[calc(100vw-2rem)]">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onRemove={removeToast} />
        </div>
      ))}
    </div>
  );
};
