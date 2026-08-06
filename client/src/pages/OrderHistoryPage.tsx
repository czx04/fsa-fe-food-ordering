import { Link } from "react-router-dom";
import db from "../../db.json";

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

const statusStyles: { [key: string]: string } = {
  delivered: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-red-100 text-red-800",
  preparing: "bg-blue-100 text-blue-800",
  delivering: "bg-indigo-100 text-indigo-800",
};

const statusTranslations: { [key: string]: string } = {
  delivered: "Đã giao",
  pending: "Chờ xác nhận",
  cancelled: "Đã hủy",
  preparing: "Đang chuẩn bị",
  delivering: "Đang giao",
  confirmed: "Đã xác nhận",
};

function OrderHistoryPage() {
  const orders = db.orders;

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">
          Lịch sử đơn hàng
        </h1>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order._id}
                className="border rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="flex-grow">
                  <div className="flex items-center gap-4 mb-2">
                    <h2 className="text-lg font-semibold text-gray-800">
                      Đơn hàng #{order.orderNumber}
                    </h2>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        statusStyles[order.orderStatus] ||
                        "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {statusTranslations[order.orderStatus] ||
                        order.orderStatus}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Đặt ngày: {formatDate(order.placedAt)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Từ nhà hàng: {order.restaurantSnapshot.name}
                  </p>
                </div>
                <div className="text-left md:text-right w-full md:w-auto">
                  <p className="font-bold text-lg text-gray-800">
                    {formatCurrency(order.pricing.grandTotal)}
                  </p>
                  <Link
                    to={`/order/${order._id}`}
                    className="text-orange-500 hover:underline text-sm font-medium mt-1 block"
                  >
                    Xem chi tiết
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

export default OrderHistoryPage;
