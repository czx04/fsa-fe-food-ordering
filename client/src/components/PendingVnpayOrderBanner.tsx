import { useEffect, useState } from "react";
import { AlertTriangle, CreditCard, Loader2, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { orderService } from "../services/orderService";

interface PendingVnpayOrder {
  orderId: string;
  orderNumber: string;
  paymentUrl: string;
  placedAt: number;
}

const STORAGE_KEY = "pendingVnpayOrder";

export const clearPendingVnpayOrder = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
};

/**
 * Banner toàn cục nhắc đơn hàng VNPAY chưa hoàn tất thanh toán.
 * Khi khách rời khỏi cổng VNPAY mà chưa thanh toán (VNPAY không gửi callback),
 * đơn sẽ kẹt ở trạng thái "Chờ xác nhận". Banner này cho phép khách "Thanh toán
 * lại" hoặc "Hủy đơn ngay" — đơn chuyển sang "Đã hủy".
 */
function PendingVnpayOrderBanner() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const toast = useToast();
  const [pending, setPending] = useState<PendingVnpayOrder | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    // Không hiển thị banner trên trang thành công, vì trang đó sẽ tự dọn dẹp.
    if (location.pathname.startsWith("/payment/success")) {
      return;
    }

    if (!isAuthenticated) return;

    let raw: string | null = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    if (!raw) return;

    let parsed: PendingVnpayOrder;
    try {
      parsed = JSON.parse(raw) as PendingVnpayOrder;
    } catch {
      clearPendingVnpayOrder();
      return;
    }
    if (!parsed?.orderId) {
      clearPendingVnpayOrder();
      return;
    }

    let cancelled = false;
    orderService
      .getOrderDetail(parsed.orderId)
      .then((order) => {
        if (cancelled) return;
        // Đơn đã thanh toán hoặc đã hủy → không cần banner nữa, dọn storage.
        if (
          order.orderStatus === "cancelled" ||
          order.paymentStatus === "paid"
        ) {
          clearPendingVnpayOrder();
          return;
        }
        setPending(parsed);
      })
      .catch(() => {
        // Lỗi mạng / trạng thái không xác định: giữ nguyên storage, không hiện
        // banner gây phiền để user tự quyết định ở trang chi tiết đơn.
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, location.pathname]);

  if (!isAuthenticated || !pending || dismissed) return null;

  const handlePayAgain = () => {
    if (pending.paymentUrl) {
      window.location.href = pending.paymentUrl;
    }
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await orderService.cancelOrder(pending.orderId, {
        reason: "Khách hàng hủy thanh toán VNPAY.",
      });
      clearPendingVnpayOrder();
      setPending(null);
      toast.success(`Đơn hàng #${pending.orderNumber} đã được hủy.`);
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          "Không thể hủy đơn hàng. Vui lòng thử lại.",
      );
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="fixed inset-x-0 top-16 z-50 px-4">
      <div className="max-w-3xl mx-auto bg-amber-50 border border-amber-200 rounded-lg shadow-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-start gap-3 flex-1">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-900">
            <p className="font-semibold">
              Bạn có đơn hàng #{pending.orderNumber} chưa hoàn tất thanh toán
              VNPAY.
            </p>
            <p className="text-amber-800 mt-0.5">
              Đơn đang ở trạng thái <b>Chờ xác nhận</b>. Bạn có thể tiếp tục
              thanh toán hoặc hủy đơn để chuyển sang trạng thái <b>Đã hủy</b>.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handlePayAgain}
            className="inline-flex items-center gap-1 px-3 py-2 bg-orange-500 text-white text-sm font-semibold rounded-md hover:bg-orange-600 transition-colors"
          >
            <CreditCard className="w-4 h-4" /> Thanh toán lại
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isCancelling}
            className="inline-flex items-center gap-1 px-3 py-2 border border-red-400 text-red-600 text-sm font-semibold rounded-md hover:bg-red-50 transition-colors disabled:opacity-60"
          >
            {isCancelling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Hủy đơn hàng"
            )}
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Đóng thông báo"
            className="p-1 text-amber-700 hover:text-amber-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default PendingVnpayOrderBanner;
