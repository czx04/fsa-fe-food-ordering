import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { orderService } from "../services/orderService";
import { OrderSummary, OrderHistoryPagination } from "../types/order";
import { Loader2 } from "lucide-react";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const statusStyles: { [key: string]: string | undefined } = {
  delivered: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-red-100 text-red-800",
  preparing: "bg-blue-100 text-blue-800",
  delivering: "bg-indigo-100 text-indigo-800",
  confirmed: "bg-purple-100 text-purple-800",
  // Default for 'all' or unknown statuses
  all: "bg-gray-100 text-gray-800",
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

function OrderHistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("status") || "all"; // Default to 'all'
  const currentPage = Number.parseInt(searchParams.get("page") || "1");

  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<OrderHistoryPagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });
  const [reorderingOrderId, setReorderingOrderId] = useState<string | null>(
    null,
  );
  const [reorderMessage, setReorderMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const statusParam = activeTab === "all" ? undefined : activeTab;
        const response = await orderService.getOrderHistory(
          statusParam,
          currentPage,
          pagination.limit,
        );
        setOrders(response.data);
        setPagination(response.pagination);
      } catch (error) {
        console.error("Lỗi tải dữ liệu lịch sử đơn hàng:", error);
        setError("Không thể tải lịch sử đơn hàng. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [activeTab, currentPage, pagination.limit]);

  const handleTabChange = (status: string) => {
    setSearchParams({ status, page: "1" }); // Reset page to 1 when changing tab
  };

  const handlePageChange = (page: number) => {
    setSearchParams({ status: activeTab, page: String(page) });
  };

  const handleReorder = async (orderId: string) => {
    setReorderingOrderId(orderId);
    setReorderMessage(null);
    setError(null);
    try {
      const response = await orderService.reorder(orderId);
      if (response.unavailableItems && response.unavailableItems.length > 0) {
        const unavailableNames = response.unavailableItems
          .map((item) => `'${item.name}'`)
          .join(", ");
        setReorderMessage(
          `Đã thêm các món từ đơn cũ vào giỏ. Tuy nhiên, các món ${unavailableNames} hiện không có sẵn.`,
        );
        alert(
          `Đã thêm các món từ đơn cũ vào giỏ. Tuy nhiên, các món ${unavailableNames} hiện không có sẵn.`,
        );
      } else {
        setReorderMessage("Đã thêm các món từ đơn cũ vào giỏ hàng của bạn.");
        alert("Đã thêm các món từ đơn cũ vào giỏ hàng của bạn.");
      }
      navigate("/cart"); // Navigate to cart page
    } catch (error: any) {
      console.error("Lỗi đặt lại đơn hàng:", error);
      setError(
        error.response?.data?.message ||
          "Không thể đặt lại đơn hàng. Vui lòng thử lại.",
      );
      alert(
        error.response?.data?.message ||
          "Không thể đặt lại đơn hàng. Vui lòng thử lại.",
      );
    } finally {
      setReorderingOrderId(null);
    }
  };

  if (loading) {
    return (
      <main className="container mx-auto p-4">
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <p className="ml-2 text-gray-600">Đang tải lịch sử đơn hàng...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">
          Lịch sử đơn hàng
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            <strong className="font-bold">Lỗi!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {reorderMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
            <strong className="font-bold">Thông báo!</strong>
            <span className="block sm:inline"> {reorderMessage}</span>
          </div>
        )}

        <div className="flex space-x-4 mb-6 overflow-x-auto pb-2">
          {[
            "all",
            "pending",
            "confirmed",
            "preparing",
            "delivering",
            "delivered",
            "cancelled",
          ].map((statusKey) => (
            <button
              type="button"
              key={statusKey}
              onClick={() => handleTabChange(statusKey)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 whitespace-nowrap ${activeTab === statusKey ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
            >
              {statusTranslations[statusKey] || "Tất cả"}
            </button>
          ))}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order._id}
                className="border rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="flex-grow">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 mb-2">
                    <h2 className="text-lg font-semibold text-gray-800 mb-1 sm:mb-0">
                      Đơn hàng{" "}
                      <Link
                        to={`/orders/${order._id}`}
                        className="text-orange-500 hover:underline"
                      >
                        #{order.orderNumber}
                      </Link>
                    </h2>
                    <div
                      className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[order.orderStatus] || statusStyles.all}`}
                    >
                      {statusTranslations[order.orderStatus] ||
                        order.orderStatus}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    Đặt ngày: {formatDate(order.placedAt)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Từ nhà hàng: {order.restaurantSnapshot.name}
                  </p>
                  {order.items.length > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Món:</span>{" "}
                      {order.items[0].name}
                      {order.items.length > 1 &&
                        ` + ${order.items.length - 1} món khác`}
                    </p>
                  )}
                </div>
                <div className="text-left md:text-right w-full md:w-auto">
                  <p className="font-bold text-lg text-gray-800">
                    {formatCurrency(order.pricing.grandTotal)}
                  </p>
                  <Link
                    to={`/orders/${order._id}`}
                    className="text-orange-500 hover:underline text-sm font-medium mt-2 block"
                  >
                    Xem chi tiết
                  </Link>
                  {order.orderStatus === "delivered" ||
                  order.orderStatus === "cancelled" ? (
                    <button
                      type="button"
                      onClick={() => handleReorder(order._id)}
                      disabled={reorderingOrderId === order._id}
                      className="mt-2 px-4 py-2 bg-orange-500 text-white rounded-md text-sm font-medium hover:bg-orange-600 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {reorderingOrderId === order._id ? (
                        <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" />
                      ) : (
                        "Đặt lại"
                      )}
                    </button>
                  ) : null}
                  {order.orderStatus === "delivered" && (
                    <button
                      type="button"
                      className="ml-2 mt-2 px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 transition-colors duration-200"
                    >
                      Đánh giá
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {orders.length === 0 && (
            <div className="text-center py-10">
              <p className="text-gray-500 text-lg">
                Không có đơn hàng nào trong mục này.
              </p>
              <Link
                to="/restaurants"
                className="mt-4 inline-block text-orange-500 hover:underline"
              >
                Bắt đầu đặt món ngay!
              </Link>
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-8 space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded-md disabled:opacity-50"
              >
                Trước
              </button>
              {Array.from(
                { length: pagination.totalPages },
                (_, i) => i + 1,
              ).map((page) => (
                <button
                  type="button"
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-4 py-2 border rounded-md ${currentPage === page ? "bg-orange-500 text-white" : "bg-white"}`}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
                className="px-4 py-2 border rounded-md disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default OrderHistoryPage;
