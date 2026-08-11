import { Link } from "react-router-dom";
import { OrderSummary } from "../types/order";
import { RotateCw, Star, Loader2 } from "lucide-react";

interface OrderCardProps {
  order: OrderSummary;
  reorderingOrderId: string | null;
  onReorder: (order: OrderSummary) => void;
  onReview: (order: OrderSummary) => void;
}

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

export function OrderCard({ order, reorderingOrderId, onReorder, onReview }: OrderCardProps) {
  return (
    <div className="border border-slate-100 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/40 hover:bg-slate-50 transition">
      <div className="flex-grow w-full md:w-auto">
        <div className="flex flex-wrap items-center justify-between sm:justify-start sm:gap-3 mb-2">
          <h2 className="text-base font-bold text-slate-800">
            Đơn hàng{" "}
            <Link
              to={`/orders/${order._id}`}
              className="text-orange-600 hover:underline"
            >
              #{order.orderNumber}
            </Link>
          </h2>
          <span
            className={`px-2.5 py-0.5 text-[11px] font-extrabold rounded-full ${
              statusStyles[order.orderStatus] || statusStyles.all
            }`}
          >
            {statusTranslations[order.orderStatus] || order.orderStatus}
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Đặt ngày: {formatDate(order.placedAt)}
        </p>
        <p className="text-xs text-slate-600 font-medium mt-0.5">
          Từ nhà hàng:{" "}
          <span className="font-bold text-slate-800">
            {order.restaurantSnapshot.name}
          </span>
        </p>
        {order.items.length > 0 && (
          <p className="text-xs text-slate-600 mt-1 line-clamp-1">
            <span className="font-semibold text-slate-700">Món:</span>{" "}
            {order.items[0].name}
            {order.items.length > 1 && ` + ${order.items.length - 1} món khác`}
          </p>
        )}
      </div>
      <div className="text-left md:text-right w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-200/60 flex flex-row md:flex-col items-center md:items-end justify-between">
        <div>
          <p className="font-black text-base sm:text-lg text-slate-900">
            {formatCurrency(order.pricing.grandTotal)}
          </p>
          <Link
            to={`/orders/${order._id}`}
            className="text-orange-600 hover:underline text-xs font-bold mt-0.5 block"
          >
            Xem chi tiết →
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {(order.orderStatus === "delivered" ||
            order.orderStatus === "cancelled") && (
            <button
              type="button"
              onClick={() => onReorder(order)}
              disabled={reorderingOrderId === order._id}
              className="px-3 py-1.5 bg-orange-500 text-white rounded-xl text-xs font-bold hover:bg-orange-600 transition disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {reorderingOrderId === order._id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RotateCw className="w-3.5 h-3.5" />
              )}
              Đặt lại
            </button>
          )}
          {order.orderStatus === "delivered" && (
            <button
              type="button"
              onClick={() => onReview(order)}
              className={`px-3 py-1.5 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                order.review
                  ? "bg-amber-500 hover:bg-amber-600"
                  : "bg-orange-500 hover:bg-orange-600"
              }`}
            >
              <Star
                className={`w-3.5 h-3.5 ${
                  order.review ? "fill-white" : ""
                }`}
              />
              {order.review ? "Sửa đánh giá" : "Đánh giá"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
