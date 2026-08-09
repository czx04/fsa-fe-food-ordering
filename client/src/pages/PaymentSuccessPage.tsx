import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { OrderDetail } from "../types/order";
import { api } from "../utils/api";
import {
  Loader2,
  CheckCircle2,
  Clock,
  CreditCard,
  ShoppingBag,
} from "lucide-react";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Ngăn người dùng quay lại trang checkout hoặc cổng thanh toán
    navigate(window.location.pathname + window.location.search, {
      replace: true,
    });

    const verifyAndFetchOrder = async () => {
      setLoading(true);
      setError("");
      try {
        let orderData: OrderDetail;
        const vnp_TxnRef = searchParams.get("vnp_TxnRef");

        if (vnp_TxnRef) {
          // Luồng thanh toán online: chờ một chút để webhook xử lý
          await new Promise((resolve) => setTimeout(resolve, 1500));
          const verifyResponse = await api.get(
            `/payments/vnpay/verify-return?${searchParams.toString()}`,
          );
          orderData = verifyResponse.data;
        } else {
          // Luồng COD
          const orderId = searchParams.get("orderId");
          if (!orderId) {
            throw new Error("Không tìm thấy thông tin đơn hàng.");
          }
          const orderResponse = await api.get(`/orders/${orderId}`);
          orderData = orderResponse.data;
        }
        setOrder(orderData);
      } catch (err: any) {
        console.error("Lỗi xác thực hoặc tải đơn hàng:", err);
        const message =
          err.response?.data?.message ||
          "Không thể xác thực đơn hàng thành công. Vui lòng liên hệ hỗ trợ.";
        setError(message);
        // Chuyển hướng đến trang thất bại nếu xác thực thanh toán online không thành công
        if (searchParams.get("vnp_TxnRef")) {
          navigate("/payment/failed");
        }
      } finally {
        setLoading(false);
      }
    };

    verifyAndFetchOrder();
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">
            Đang xác nhận đơn hàng...
          </h2>
          <p className="text-gray-500 mt-2">
            Vui lòng chờ trong giây lát. Giao dịch của bạn đang được xử lý.
          </p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 md:p-12 rounded-lg shadow-xl text-center max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-2">
            Xác nhận thất bại
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/orders"
            className="w-full bg-gray-200 text-gray-800 py-3 rounded-md font-semibold hover:bg-gray-300 transition-colors duration-200 block"
          >
            Kiểm tra lịch sử đơn hàng
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center mb-8">
          <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Đặt hàng thành công!
          </h1>
          <p className="text-gray-600">
            Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đang được xử lý.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg space-y-6">
          {/* Tổng quan đơn hàng */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center border-b pb-6">
            <div>
              <p className="text-sm text-gray-500">Mã đơn hàng</p>
              <p className="font-bold text-gray-800">#{order.orderNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Giao hàng dự kiến</p>
              <p className="font-bold text-gray-800 flex items-center justify-center gap-1">
                <Clock className="w-4 h-4" />{" "}
                {(order.restaurantSnapshot as any).delivery?.minMinutes}-
                {(order.restaurantSnapshot as any).delivery?.maxMinutes} phút
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Thanh toán</p>
              <p className="font-bold text-gray-800 flex items-center justify-center gap-1">
                <CreditCard className="w-4 h-4" />{" "}
                {order.paymentMethod.toUpperCase()}
              </p>
            </div>
          </div>

          {/* Tóm tắt cửa hàng & món ăn */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <ShoppingBag className="w-5 h-5 text-gray-500" />
              <h3 className="font-bold text-lg">
                {order.restaurantSnapshot.name}
              </h3>
            </div>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.menuItemId}
                  className="flex items-center text-sm"
                >
                  <div className="bg-gray-100 rounded-md px-2 py-1 font-bold text-xs mr-3">
                    {item.quantity}x
                  </div>
                  <p className="flex-grow font-medium">{item.name}</p>
                  <p className="font-semibold">
                    {formatCurrency(item.lineTotal)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Chi tiết hóa đơn */}
          <div className="space-y-2 text-sm border-t pt-6">
            <div className="flex justify-between">
              <span className="text-gray-600">Tạm tính</span>
              <span className="font-medium">
                {formatCurrency(order.pricing.subtotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Phí giao hàng</span>
              <span className="font-medium">
                {formatCurrency(order.pricing.deliveryFee)}
              </span>
            </div>
            {order.pricing.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span className="font-semibold">
                  Mã giảm giá ({order.couponSnapshot?.code})
                </span>
                <span className="font-semibold">
                  - {formatCurrency(order.pricing.discountAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-3 mt-3">
              <span>Tổng cộng</span>
              <span>{formatCurrency(order.pricing.grandTotal)}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Link
            to={`/orders/${order._id}`}
            className="w-full bg-orange-500 text-white py-3 rounded-md text-center font-semibold hover:bg-orange-600 transition-colors duration-200"
          >
            Theo dõi đơn hàng
          </Link>
          <Link
            to="/restaurants"
            className="w-full bg-gray-200 text-gray-800 py-3 rounded-md text-center font-semibold hover:bg-gray-300 transition-colors duration-200"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    </main>
  );
}

export default PaymentSuccessPage;
