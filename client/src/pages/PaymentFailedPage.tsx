import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { XCircle, Loader2 } from "lucide-react";
import { useState, useCallback } from "react";
import { orderService } from "../services/orderService";
import { useToast } from "../contexts/ToastContext";
import { useCart } from "../contexts/CartContext";

function PaymentFailedPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { fetchCart } = useCart();
  const [isRetrying, setIsRetrying] = useState(false);

  const reason =
    searchParams.get("reason") ||
    "Đã có lỗi xảy ra trong quá trình thanh toán.";
  const orderId = searchParams.get("orderId");

  const handleRetry = useCallback(async () => {
    if (!orderId) {
      // Fallback cho các link cũ hoặc lỗi thiếu orderId
      navigate("/checkout");
      return;
    }

    setIsRetrying(true);
    try {
      // Sử dụng dịch vụ reorder để khôi phục giỏ hàng từ đơn hàng thất bại
      await orderService.reorder(orderId);
      await fetchCart(); // Đảm bảo context của giỏ hàng được cập nhật
      toast.info("Giỏ hàng đã được khôi phục. Vui lòng thử lại thanh toán.");
      navigate("/checkout");
    } catch (error: any) {
      console.error("Lỗi khôi phục giỏ hàng:", error);
      const message =
        error.response?.data?.message ||
        "Không thể khôi phục giỏ hàng. Vui lòng thử lại từ đầu.";
      toast.error(message);
      // Nếu reorder thất bại (ví dụ: quán đóng cửa), đưa người dùng về giỏ hàng để xem trạng thái
      navigate("/cart");
    } finally {
      setIsRetrying(false);
    }
  }, [orderId, navigate, fetchCart, toast]);

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 md:p-12 rounded-lg shadow-xl text-center max-w-md w-full">
        <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-100 mb-6">
          <XCircle className="h-16 w-16 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Thanh toán thất bại
        </h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-6">
          <p>
            <b>Lý do:</b> {reason}
          </p>
        </div>
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleRetry}
            disabled={isRetrying || !orderId}
            className="w-full bg-orange-500 text-white py-3 rounded-md font-semibold hover:bg-orange-600 transition-colors duration-200 block disabled:bg-gray-400 disabled:cursor-not-allowed flex justify-center items-center"
          >
            {isRetrying ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Đang khôi phục...
              </>
            ) : (
              "Thử lại thanh toán"
            )}
          </button>
          <Link
            to="/cart"
            className="w-full bg-gray-200 text-gray-800 py-3 rounded-md font-semibold hover:bg-gray-300 transition-colors duration-200 block"
          >
            Quay lại giỏ hàng
          </Link>
        </div>
      </div>
    </main>
  );
}

export default PaymentFailedPage;
