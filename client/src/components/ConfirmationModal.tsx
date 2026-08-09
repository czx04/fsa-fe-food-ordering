import { X } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isConfirming?: boolean;
}

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  isDestructive = false,
  isConfirming = false,
}: ConfirmationModalProps) => {
  if (!isOpen) return null;

  const confirmButtonClass = isDestructive
    ? "bg-red-600 hover:bg-red-700"
    : "bg-orange-500 hover:bg-orange-600";

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-bold text-gray-900" id="modal-title">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="text-sm text-gray-600">{message}</div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-semibold hover:bg-gray-100"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className={`px-4 py-2 text-white rounded-md font-semibold transition-colors disabled:bg-gray-400 ${confirmButtonClass}`}
          >
            {isConfirming ? "Đang xử lý..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
