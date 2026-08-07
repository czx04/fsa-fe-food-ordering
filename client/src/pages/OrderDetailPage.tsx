import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { OrderDetail } from "../types/order";
import { mockApi } from "../utils/mock-api";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString("vi-VN");
};

const statusTranslations: { [key: string]: string } = {
  delivered: "Đã giao",
  pending: "Chờ xác nhận",
  cancelled: "Đã hủy",
  preparing: "Đang chuẩn bị",
  delivering: "Đang giao",
  confirmed: "Đã xác nhận",
};

function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (id) {
          const orderResponse = await mockApi.get(`/orders?_id=${id}`);
          // json-server query returns an array, we need the first element
          setOrder(orderResponse.data[0]);
          console.log(orderResponse.data);
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
  }, [id]);
  if (loading) {
    return (
      <main className="container mx-auto p-4">
        <p>Đang tải chi tiết đơn hàng...</p>
      </main>
    );
  }
  if (!order) {
    return (
      <main className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Không tìm thấy đơn hàng</h1>
        <Link
          to="/orders"
          className="text-orange-500 hover:underline mt-4 block"
        >
          Quay về lịch sử đơn hàng
        </Link>
      </main>
    );
  }

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
            Chi tiết đơn hàng #{order.orderNumber}
          </h1>
          <p className="text-gray-500 mt-1">
            Đặt lúc: {formatDate(order.placedAt)}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Section: Order Details */}
          <div className="lg:w-2/3 space-y-8">
            {/* Order Status */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Trạng thái đơn hàng
              </h2>
              <ol className="relative border-l border-gray-200">
                {order.statusHistory.map((status, index) => (
                  <li key={index} className="mb-6 ml-6">
                    <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-8 ring-white">
                      <svg
                        className="w-3 h-3 text-blue-800"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </span>
                    <h3 className="font-semibold text-gray-900">
                      {statusTranslations[status.to] || status.to}
                    </h3>
                    <time className="block text-sm font-normal leading-none text-gray-400">
                      {formatDate(status.changedAt)}
                    </time>
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
    </main>
  );
}

export default OrderDetailPage;
