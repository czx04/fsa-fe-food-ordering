import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { OrderDetail, CancelOrderPayload } from "../types/order";
import { orderService } from "../services/orderService";
import { Loader2, XCircle, CheckCircle2, Phone } from "lucide-react";

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
  delivered: "Đã giao",
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
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (id) {
          const orderData = await orderService.getOrderDetail(id);
          setOrder(orderData);
        } else {
          setError("Không tìm thấy ID đơn hàng.");
        }
      } catch (error) {
        console.error("Lỗi tải dữ liệu trang đơn hàng:", error);
        setError("Không thể tải chi tiết đơn hàng. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]); // Re-fetch when ID changes

  const handleCancelOrder = async () => {
    if (!id || !cancelReason) return;

    setIsCancelling(true);
    setCancelError("");
    try {
      const payload: CancelOrderPayload = { reason: cancelReason };
      const response = await orderService.cancelOrder(id, payload);
      setOrder(response.order); // Update order with cancelled status
      setShowCancelModal(false);
      alert("Đơn hàng đã được hủy thành công.");
    } catch (err: any) {
      console.error("Lỗi hủy đơn hàng:", err);
      setCancelError(
        err.response?.data?.message ||
          "Không thể hủy đơn hàng. Vui lòng thử lại.",
      );
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
  const isPreparingOrLater =
    orderStatusSteps.indexOf(order.orderStatus) >=
    orderStatusSteps.indexOf("preparing");
  const contactPhone = order.restaurantSnapshot.phone || "19008888"; // Fallback to general support

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Link
            to="/orders"
            className="text-orange-500 hover:underline text-sm font-medium mb-2 block"
          >
            ← Quay lại danh sách
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
              <ol className="flex items-center w-full text-center text-sm font-medium text-gray-500 sm:text-base">
                {orderStatusSteps.map((statusKey, index) => (
                  <li
                    key={statusKey}
                    className={`flex md:w-full items-center ${
                      index <= currentStepIndex
                        ? "text-orange-600 after:border-orange-200"
                        : "after:border-gray-200"
                    } ${
                      index < orderStatusSteps.length - 1
                        ? "after:content-[''] after:w-full after:h-1 after:border-b after:border-4 after:inline-block"
                        : ""
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full ring-0 shrink-0 ${
                        index <= currentStepIndex
                          ? "bg-orange-600 text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {index < currentStepIndex ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <h3 className="ml-3 font-semibold text-gray-900">
                      {statusTranslations[statusKey]}
                    </h3>
                  </li>
                ))}
              </ol>
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
              <div className="mt-6 flex flex-col sm:flex-row gap-4">
                {isCancellable && (
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    className="w-full sm:w-auto px-6 py-3 border border-red-500 text-red-500 rounded-md font-semibold hover:bg-red-50 transition-colors duration-200"
                  >
                    Hủy đơn hàng
                  </button>
                )}
                {isPreparingOrLater && !isCancellable && (
                  <p className="text-red-500 text-sm font-medium">
                    Đơn hàng đang được chuẩn bị, không thể hủy.
                  </p>
                )}
                <a
                  href={`tel:${contactPhone}`}
                  className="w-full sm:w-auto px-6 py-3 bg-blue-500 text-white rounded-md font-semibold hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Liên hệ hỗ trợ
                </a>
              </div>
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
            </div>
          </div>

          {/* Right Section: Items and Summary */}
          <div className="lg:w-1/3">
            <div className="bg-white p-6 rounded-lg shadow-md sticky top-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Các món đã đặt
              </h2>
              <div className="space-y-4 mb-6">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center">
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
            {cancelError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                <strong className="font-bold">Lỗi!</strong>
                <span className="block sm:inline"> {cancelError}</span>
              </div>
            )}
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
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 font-semibold hover:bg-gray-100 transition-colors duration-200"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={isCancelling || !cancelReason}
                className="px-6 py-2 bg-red-500 text-white rounded-md font-semibold hover:bg-red-600 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isCancelling ? "Đang hủy..." : "Xác nhận hủy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default OrderDetailPage;
