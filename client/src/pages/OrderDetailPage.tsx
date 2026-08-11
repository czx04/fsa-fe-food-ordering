import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { OrderDetail, CancelOrderPayload } from "../types/order";
import { orderService } from "../services/orderService";
import { socketService } from "../services/socketService";
import {
  Loader2,
  XCircle,
  CheckCircle2,
  Trash2,
  X,
  Star,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "../contexts/ToastContext";
import { ReviewModal } from "../components/ReviewModal";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

const formatDateTime = (dateString: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "N/A";
  return new Date(dateString).toLocaleString("vi-VN");
};

const statusTranslations: { [key: string]: string } = {
  delivered: "Đã giao xong",
  pending: "Chờ xác nhận",
  cancelled: "Đã hủy",
  preparing: "Đang chuẩn bị",
  delivering: "Đang giao",
  confirmed: "Đã xác nhận",
  all: "Tất cả",
};

const orderStatusSteps = [
  "pending",
  "confirmed",
  "preparing",
  "delivering",
  "delivered",
];

function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!id) {
      setError("Không tìm thấy ID đơn hàng.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchOrder = async () => {
      try {
        const orderData = await orderService.getOrderDetail(id);
        if (cancelled) return;
        setOrder(orderData);
      } catch (err) {
        if (cancelled) return;
        console.error("Lỗi tải dữ liệu trang đơn hàng:", err);
        setError("Không thể tải chi tiết đơn hàng. Vui lòng thử lại.");
      }
    };

    let socket: ReturnType<typeof socketService.connect> | null = null;

    const handleConnect = () => {
      console.log("Socket connected, joining order room...");
      socket?.emit("join:order", id);
      fetchOrder(); // Fetch lại dữ liệu mới nhất khi kết nối lại
    };

    const handleOrderUpdate = (updatedOrder: OrderDetail) => {
      if (updatedOrder._id === id) {
        toast.info(
          `Đơn hàng #${updatedOrder.orderNumber} đã được cập nhật trạng thái.`,
        );
        setOrder(updatedOrder);
      }
    };

    const handleConnectError = (err: unknown) => {
      console.error("Socket connection error:", err);
      toast.error("Lỗi kết nối real-time. Vui lòng kiểm tra lại mạng.");
    };

    try {
      socket = socketService.connect();
      socket.on("connect", handleConnect);
      socket.on("order:updated", handleOrderUpdate);
      socket.on("connect_error", handleConnectError);
    } catch (error) {
      console.error("Socket connection failed:", error);
      toast.error("Không thể kết nối real-time. Vui lòng tải lại trang.");
    }

    setLoading(true);
    fetchOrder().finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
      // Chỉ gỡ listeners, KHÔNG disconnect socket — giúp tránh memory leak
      // khi navigate qua lại giữa các trang (socket được dùng lại bởi socketService).
      if (socket) {
        socket.off("connect", handleConnect);
        socket.off("order:updated", handleOrderUpdate);
        socket.off("connect_error", handleConnectError);
      }
    };
  }, [id, toast]);

  const handleCancelOrder = async () => {
    if (!id || !cancelReason) return;

    setIsCancelling(true);
    try {
      const payload: CancelOrderPayload = { reason: cancelReason };
      await orderService.cancelOrder(id, payload);
      setShowCancelModal(false);
      toast.success("Đơn hàng đã được hủy thành công.");
    } catch (err: any) {
      console.error("Lỗi hủy đơn hàng:", err);
      toast.error(
        err.response?.data?.message ||
          "Không thể hủy đơn hàng. Vui lòng thử lại.",
      );
      setShowCancelModal(false);
    } finally {
      setIsCancelling(false);
    }
  };

  const currentStepIndex = orderStatusSteps.indexOf(order?.orderStatus || "");

  if (loading) {
    return (
      <main className="container mx-auto p-4">
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <p className="ml-2 text-gray-600">Đang tải chi tiết đơn hàng...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto p-4">
        <p className="text-red-600">{error}</p>
        <Link
          to="/orders"
          className="text-orange-500 hover:underline mt-4 block"
        >
          Quay về lịch sử đơn hàng
        </Link>
      </main>
    );
  }
  if (!order) {
    return (
      <main className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">
          Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập.
        </h1>
        <Link
          to="/orders"
          className="text-orange-500 hover:underline mt-4 block"
        >
          Quay về lịch sử đơn hàng
        </Link>
      </main>
    );
  }

  const isCancellable = order.orderStatus === "pending";

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Link
            to="/orders"
            className="text-orange-500 hover:underline text-sm font-medium mb-2 inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại trang lịch sử đơn hàng
          </Link>
          <h1 className="text-4xl font-bold text-gray-800">
            Đơn hàng #{order.orderNumber}
          </h1>
          <p className="text-gray-500 mt-1">
            Đặt lúc: {formatDateTime(order.placedAt)}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Section: Order Details */}
          <div className="lg:w-2/3 space-y-8">
            {/* Order Status */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                Trạng thái đơn hàng
              </h2>
              {order.orderStatus === "cancelled" ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-red-700">
                      Đơn hàng đã bị hủy
                    </h3>
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  {order.cancellation?.reason && (
                    <p className="text-sm text-red-700">
                      <span className="font-semibold">Lý do:</span>{" "}
                      {order.cancellation.reason}
                    </p>
                  )}
                  {order.cancelledAt && (
                    <p className="text-sm text-red-600 mt-1">
                      Hủy lúc: {formatDateTime(order.cancelledAt)}
                    </p>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto pb-4 no-scrollbar">
                  <ol className="flex items-center w-full min-w-[600px] text-center text-sm font-medium text-gray-500 sm:text-base">
                    {orderStatusSteps.map((statusKey, index) => {
                      const isCompleted = index <= currentStepIndex;
                      const isCurrent = index === currentStepIndex;
                      return (
                        <li
                          key={statusKey}
                          className={`relative flex flex-col items-center flex-1 ${
                            index < orderStatusSteps.length - 1
                              ? "after:content-[''] after:absolute after:top-5 after:left-[50%] after:w-full after:h-1 after:-z-10 " +
                                (isCompleted && !isCurrent ? "after:bg-orange-500" : "after:bg-gray-200")
                              : ""
                          }`}
                        >
                          <div
                            className={`flex items-center justify-center w-10 h-10 rounded-full ring-4 ring-white mb-2 z-10 shadow-sm transition-colors ${
                              isCompleted
                                ? "bg-orange-500 text-white"
                                : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            {index < currentStepIndex ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : isCurrent ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <span className="font-bold text-sm">{index + 1}</span>
                            )}
                          </div>
                          <h3 className={`font-semibold text-xs sm:text-sm px-2 text-center whitespace-normal min-h-[40px] flex items-center ${isCompleted ? "text-orange-600" : "text-gray-500"}`}>
                            {statusTranslations[statusKey]}
                          </h3>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}
            </div>

            {/* Delivery Info */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Thông tin giao hàng
              </h2>
              <div className="space-y-1">
                <p>
                  <span className="font-semibold">Người nhận:</span>{" "}
                  {order.recipient.fullName}
                </p>
                <p>
                  <span className="font-semibold">Số điện thoại:</span>{" "}
                  {order.recipient.phone}
                </p>
                <p>
                  <span className="font-semibold">Địa chỉ:</span>{" "}
                  {order.recipient.addressText}
                </p>
                {order.recipient.note && (
                  <p>
                    <span className="font-semibold">Ghi chú:</span>{" "}
                    {order.recipient.note}
                  </p>
                )}
              </div>
              {isCancellable && (
                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    className="w-full sm:w-auto px-6 py-3 border border-red-500 text-red-500 rounded-md font-semibold hover:bg-red-50 transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" /> Hủy đơn hàng
                  </button>
                </div>
              )}
            </div>

            {/* Restaurant Info */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Thông tin nhà hàng
              </h2>
              <p>
                <span className="font-semibold">Tên nhà hàng:</span>{" "}
                {order.restaurantSnapshot.name}
              </p>
              <p>
                <span className="font-semibold">Địa chỉ:</span>{" "}
                {order.restaurantSnapshot.addressText}
              </p>
              <p>
                <span className="font-semibold">Số điện thoại:</span>{" "}
                {order.restaurantSnapshot.phone}
              </p>
              {order.orderStatus === "delivered" && (
                <button
                  type="button"
                  onClick={() => setShowReviewModal(true)}
                  className={`mt-5 inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 font-semibold text-white transition-colors ${
                    order.review
                      ? "bg-amber-500 hover:bg-amber-600"
                      : "bg-orange-500 hover:bg-orange-600"
                  }`}
                >
                  <Star
                    className={`h-4 w-4 ${order.review ? "fill-white" : ""}`}
                  />
                  {order.review ? "Sửa đánh giá" : "Đánh giá nhà hàng"}
                </button>
              )}
            </div>
          </div>

          {/* Right Section: Items and Summary */}
          <div className="lg:w-1/3">
            <div className="bg-white p-6 rounded-lg shadow-md sticky top-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Các món đã đặt
              </h2>
              <div className="space-y-4 mb-6">
                {order.items.map((item) => (
                  <div key={item.menuItemId} className="flex items-center">
                    <div className="bg-gray-100 rounded-md px-2 py-1 font-bold mr-4">
                      {item.quantity}x
                    </div>
                    <div className="flex-grow">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        {item.selectedOptions
                          .map((opt) => opt.optionName)
                          .join(", ")}
                      </p>
                    </div>
                    <span className="font-semibold">
                      {formatCurrency(item.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-gray-700 mb-6 border-t pt-4">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span>{formatCurrency(order.pricing.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí giao hàng</span>
                  <span>{formatCurrency(order.pricing.deliveryFee)}</span>
                </div>
                {order.pricing.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>Mã giảm giá ({order.couponSnapshot?.code})</span>
                    <span>
                      - {formatCurrency(order.pricing.discountAmount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold text-gray-800 pt-2 border-t mt-2">
                  <span>Tổng cộng</span>
                  <span>{formatCurrency(order.pricing.grandTotal)}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="font-semibold">Phương thức thanh toán</p>
                <p className="text-gray-600">
                  {order.paymentMethod === "cod"
                    ? "Thanh toán khi nhận hàng"
                    : order.paymentMethod}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Hủy đơn hàng #{order.orderNumber}
            </h2>
            <p className="text-gray-600 mb-6">
              Vui lòng chọn lý do hủy đơn hàng của bạn:
            </p>
            <div className="space-y-3 mb-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="cancelReason"
                  value="Muốn đổi món"
                  checked={cancelReason === "Muốn đổi món"}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="h-4 w-4 text-red-600 focus:ring-red-500"
                />
                <span className="ml-3 text-gray-700">Muốn đổi món</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="cancelReason"
                  value="Đặt nhầm địa chỉ"
                  checked={cancelReason === "Đặt nhầm địa chỉ"}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="h-4 w-4 text-red-600 focus:ring-red-500"
                />
                <span className="ml-3 text-gray-700">Đặt nhầm địa chỉ</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="cancelReason"
                  value="Khác"
                  checked={cancelReason === "Khác"}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="h-4 w-4 text-red-600 focus:ring-red-500"
                />
                <span className="ml-3 text-gray-700">Lý do khác</span>
              </label>
            </div>
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 font-semibold hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" /> Đóng
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={isCancelling || !cancelReason}
                className="px-6 py-2 bg-red-500 text-white rounded-md font-semibold hover:bg-red-600 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCancelling ? (
                  "Đang hủy..."
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" /> Xác nhận hủy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && (
        <ReviewModal
          order={order}
          onClose={() => setShowReviewModal(false)}
          onChanged={(review) =>
            setOrder((currentOrder) =>
              currentOrder ? { ...currentOrder, review } : currentOrder,
            )
          }
        />
      )}
    </main>
  );
}

export default OrderDetailPage;
