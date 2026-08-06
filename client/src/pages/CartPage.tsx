import { Link } from "react-router-dom";
import db from "../../db.json";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

function CartPage() {
  // Using mock data from db.json
  const cart = db.carts[0];
  const restaurant = db.restaurants.find((r) => r._id === cart?.restaurantId);
  const coupon = db.coupons[0];
  if (!cart || !restaurant) {
    return (
      <main className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Giỏ hàng của bạn</h1>
        <p>Giỏ hàng trống hoặc không tìm thấy thông tin nhà hàng.</p>
        <Link to="/" className="text-orange-500 hover:underline mt-4 block">
          Quay về trang chủ
        </Link>
      </main>
    );
  }

  // Calculate subtotal
  const subtotal = cart.items.reduce((sum, item) => {
    const basePrice = item.displaySnapshot.unitPrice;
    const optionsPrice = item.selectedOptions.reduce(
      (optSum, opt) => optSum + opt.priceDelta,
      0,
    );
    return sum + (basePrice + optionsPrice) * item.quantity;
  }, 0);

  const deliveryFee = restaurant.delivery.fee;

  // Calculate discount (simplified for static prototype)
  let discountAmount = 0;
  if (coupon && subtotal >= coupon.minOrderAmount) {
    if (coupon.discountType === "fixed") {
      discountAmount = coupon.discountValue as number;
    } else if (coupon.discountType === "percentage") {
      discountAmount = subtotal * ((coupon.discountValue as number) / 100);
      if (
        coupon.maxDiscountAmount &&
        discountAmount > coupon.maxDiscountAmount
      ) {
        discountAmount = coupon.maxDiscountAmount;
      }
    }
  }

  const grandTotal = Math.max(0, subtotal + deliveryFee - discountAmount);

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <p className="text-sm text-green-600 font-semibold uppercase">
            Bếp nhà mơ
          </p>
          <h1 className="text-4xl font-bold text-gray-800 mt-1">
            Giỏ hàng của bạn
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Section: Cart Items */}
          <div className="lg:w-2/3 bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-700">
                  {cart.items.length} món từ {restaurant.name}
                </h2>
                <p className="text-gray-500 text-sm">
                  {restaurant.address.line1}, {restaurant.address.ward},{" "}
                  {restaurant.address.district}
                </p>
              </div>
              <button
                type="button"
                className="text-red-500 hover:text-red-700 text-sm font-medium"
              >
                Xóa tất cả
              </button>
            </div>

            {cart.items.map((item) => (
              <div
                key={item._id}
                className="flex items-center py-4 border-b last:border-b-0"
              >
                <img
                  src={
                    item.displaySnapshot.imageUrl ||
                    "https://via.placeholder.com/80"
                  }
                  alt={item.displaySnapshot.name}
                  className="w-20 h-20 object-cover rounded-md mr-4"
                />
                <div className="flex-grow">
                  <h3 className="font-semibold text-gray-800">
                    {item.displaySnapshot.name}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {item.selectedOptions
                      .map((opt) => opt.optionName)
                      .join(" - ")}
                    {item.note &&
                      (item.selectedOptions.length > 0 ? " - " : "") +
                        item.note}
                  </p>
                  <button
                    type="button"
                    className="text-red-500 hover:text-red-700 text-xs mt-1"
                  >
                    Xóa
                  </button>
                </div>
                <div className="flex items-center space-x-2 mr-4">
                  <button
                    type="button"
                    className="bg-gray-200 text-gray-700 px-2 py-1 rounded-md hover:bg-gray-300"
                  >
                    -
                  </button>
                  <span className="font-medium">{item.quantity}</span>
                  <button
                    type="button"
                    className="bg-gray-200 text-gray-700 px-2 py-1 rounded-md hover:bg-gray-300"
                  >
                    +
                  </button>
                </div>
                <span className="font-semibold text-gray-800">
                  {formatCurrency(
                    (item.displaySnapshot.unitPrice +
                      item.selectedOptions.reduce(
                        (optSum, opt) => optSum + opt.priceDelta,
                        0,
                      )) *
                      item.quantity,
                  )}
                </span>
              </div>
            ))}
          </div>

          {/* Right Section: Order Summary */}
          <div className="lg:w-1/3 bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-end mb-4">
              <Link
                to="/"
                className="text-orange-500 hover:underline text-sm font-medium"
              >
                ← Chọn thêm món
              </Link>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Tóm tắt đơn hàng
            </h2>

            <div className="mb-4">
              <div className="flex items-center border rounded-md overflow-hidden">
                <input
                  type="text"
                  placeholder="Mã giảm giá"
                  defaultValue={coupon?.code || ""}
                  className="flex-grow p-2 border-none focus:outline-none"
                />
                <button
                  type="button"
                  className="bg-orange-500 text-white px-4 py-2 hover:bg-orange-600 transition-colors duration-200"
                >
                  Áp dụng
                </button>
              </div>
            </div>

            <div className="space-y-2 text-gray-700 mb-6">
              <div className="flex justify-between">
                <span>Tạm tính</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Phí giao hàng</span>
                <span>{formatCurrency(deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-green-600 font-semibold">
                <span>Mã giảm giá</span>
                <span>- {formatCurrency(discountAmount)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-800 pt-2 border-t mt-2">
                <span>Tổng thanh toán</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            <p className="text-xs text-gray-500 mb-6">
              Giá và tình trạng món sẽ được xác nhận lại khi thanh toán.
            </p>

            <button
              type="button"
              className="w-full bg-orange-500 text-white py-3 rounded-md text-lg font-semibold hover:bg-orange-600 transition-colors duration-200"
            >
              Tiến hành thanh toán
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default CartPage;
