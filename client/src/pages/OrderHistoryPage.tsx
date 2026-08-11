import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { orderService } from "../services/orderService";
import { OrderSummary, OrderHistoryPagination } from "../types/order";
import { useToast } from "../contexts/ToastContext";
import { useCart } from "../contexts/CartContext";
import { ReviewModal } from "../components/ReviewModal";
import { OrderCard } from "../components/OrderCard";
import {
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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
  const [orderToReorder, setOrderToReorder] = useState<OrderSummary | null>(
    null,
  );
  const [orderToReview, setOrderToReview] = useState<OrderSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { fetchCart } = useCart();
  const toast = useToast();

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

  const handleConfirmReorder = async () => {
    if (!orderToReorder) return;

    setReorderingOrderId(orderToReorder._id);
    setError(null);
    try {
      const response = await orderService.reorder(orderToReorder._id);
      await fetchCart(); // Wait for the cart to be updated before navigating

      // Close modal before showing toast and navigating
      setOrderToReorder(null);
      toast.success("Đã thêm vào giỏ hàng thành công.");

      if (response.unavailableItems && response.unavailableItems.length > 0) {
        const unavailableNames = response.unavailableItems
          .map((item) => `'${item.name}'`)
          .join(", ");
        // Use a timeout to make the second toast more noticeable
        setTimeout(() => {
          toast.warning(
            `Lưu ý: Các món ${unavailableNames} hiện không có sẵn.`,
          );
        }, 500);
      }
      navigate("/cart"); // Navigate to cart page
    } catch (error: any) {
      console.error("Lỗi đặt lại đơn hàng:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Không thể đặt lại đơn hàng. Vui lòng thử lại.";
      toast.error(errorMessage);
      setOrderToReorder(null);
    } finally {
      setReorderingOrderId(null);
    }
  };

  const handleReviewChanged = (review: OrderSummary["review"]) => {
    if (!orderToReview) return;
    const orderId = orderToReview._id;
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order._id === orderId ? { ...order, review } : order,
      ),
    );
    setOrderToReview((currentOrder) =>
      currentOrder ? { ...currentOrder, review } : null,
    );
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

        <div className="flex space-x-2 sm:space-x-4 mb-6 overflow-x-auto pb-2 no-scrollbar">
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
              className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors duration-200 whitespace-nowrap ${activeTab === statusKey ? "bg-orange-500 text-white shadow-sm" : "bg-slate-200/70 text-slate-700 hover:bg-slate-300"}`}
            >
              {statusTranslations[statusKey] || "Tất cả"}
            </button>
          ))}
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                reorderingOrderId={reorderingOrderId}
                onReorder={(o) => setOrderToReorder(o)}
                onReview={(o) => setOrderToReview(o)}
              />
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
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded-md disabled:opacity-50 flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Trước
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
                className="px-4 py-2 border rounded-md disabled:opacity-50 flex items-center gap-2"
              >
                Sau <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reorder Confirmation Modal */}
      {orderToReorder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Xác nhận đặt lại
              </h2>
              <p className="text-gray-600 mb-6">
                Hành động này sẽ{" "}
                <span className="font-bold">xóa giỏ hàng hiện tại</span> và thay
                thế bằng các món từ đơn hàng{" "}
                <span className="font-semibold">
                  #{orderToReorder.orderNumber}
                </span>
                . Bạn có muốn tiếp tục?
              </p>
            </div>
            <div className="flex justify-center gap-4">
              <button
                type="button"
                onClick={() => setOrderToReorder(null)}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 font-semibold hover:bg-gray-100"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmReorder}
                className="px-6 py-2 bg-orange-500 text-white rounded-md font-semibold hover:bg-orange-600"
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}

      {orderToReview && (
        <ReviewModal
          order={orderToReview}
          onClose={() => setOrderToReview(null)}
          onChanged={handleReviewChanged}
        />
      )}
    </main>
  );
}

export default OrderHistoryPage;
