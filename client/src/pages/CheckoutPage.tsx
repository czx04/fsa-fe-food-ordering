import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Cart, Restaurant, Address } from "../types/cart";
import { CreateOrderPayload } from "../types/order";
import { mockApi } from "../utils/mock-api";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

function CheckoutPage() {
  const [cart, setCart] = useState<Cart>();
  const [restaurant, setRestaurant] = useState<Restaurant>();
  const [defaultAddress, setDefaultAddress] = useState<Address>();
  const [loading, setLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Mock: Lấy giỏ hàng đầu tiên. Trong ứng dụng thật, bạn sẽ lấy giỏ hàng của user đang đăng nhập.
        const cartResponse = await mockApi.get("/carts");
        const currentCart = cartResponse.data[0];
        setCart(currentCart);

        // The cart contains the restaurant ID. We need to fetch the cart first.
        if (currentCart?.restaurantId && currentCart?.customerId) {
          const [restaurantQueryResponse, userQueryResponse] =
            await Promise.all([
              // json-server không tìm thấy /resource/:id với _id, ta cần query bằng ?_id=...
              mockApi.get(`/restaurants?_id=${currentCart.restaurantId}`),
              // Lấy thông tin user từ customerId trong giỏ hàng
              mockApi.get(`/users?_id=${currentCart.customerId}`),
            ]);

          const restaurantData = restaurantQueryResponse.data[0];
          const userData = userQueryResponse.data[0];

          setRestaurant(restaurantData);

          if (userData?.addresses?.length > 0) {
            const defaultAddr =
              userData.addresses.find((addr: any) => addr.isDefault) ||
              userData.addresses[0];
            setDefaultAddress(defaultAddr);
          }
        }
      } catch (error) {
        console.error("Lỗi tải dữ liệu trang thanh toán:", error);
        setError("Không thể tải thông tin thanh toán. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    setError("");
    try {
      const payload: CreateOrderPayload = { paymentMethod: "COD" };
      const response = await mockApi.post("/orders", payload);
      const newOrder = response.data;
      // Chuyển hướng đến trang thành công với ID và mã đơn hàng
      navigate(
        `/payment/success?orderId=${newOrder._id}&orderNumber=${newOrder.orderNumber}`,
      );
    } catch (err) {
      console.error("Lỗi đặt hàng:", err);
      setError("Đặt hàng thất bại. Vui lòng thử lại.");
      navigate("/payment/failed");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <main className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Thanh toán</h1>
        <p>Đang tải thông tin thanh toán...</p>
      </main>
    );
  }

  if (!cart || !restaurant || !defaultAddress) {
    return (
      <main className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Thanh toán</h1>
        <p>
          {error || "Không thể tải thông tin thanh toán. Vui lòng thử lại."}
        </p>
        <Link to="/cart" className="text-orange-500 hover:underline mt-4 block">
          Quay về giỏ hàng
        </Link>
      </main>
    );
  }

  const subtotal = cart.items.reduce((sum, item) => {
    const basePrice = item.displaySnapshot.unitPrice;
    const optionsPrice = item.selectedOptions.reduce(
      (optSum, opt) => optSum + opt.priceDelta,
      0,
    );
    return sum + (basePrice + optionsPrice) * item.quantity;
  }, 0);

  const deliveryFee = restaurant.delivery.fee;
  const discountAmount = 10000; // Mock discount
  const grandTotal = Math.max(0, subtotal + deliveryFee - discountAmount);

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mt-1">Thanh toán</h1>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Section: Delivery and Payment */}
          <div className="lg:w-2/3 space-y-8">
            {/* Delivery Address */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  1. Địa chỉ giao hàng
                </h2>
                <button
                  type="button"
                  className="text-orange-500 hover:underline text-sm font-medium"
                >
                  Thay đổi
                </button>
              </div>
              <div className="border rounded-lg p-4">
                <p className="font-semibold text-gray-800">
                  {defaultAddress.recipientName}
                </p>
                <p className="text-gray-600">{defaultAddress.phone}</p>
                <p className="text-gray-600">
                  {`${defaultAddress.line1}, ${defaultAddress.ward}, ${defaultAddress.district}, ${defaultAddress.city}`}
                </p>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                2. Phương thức thanh toán
              </h2>
              <div className="space-y-4">
                <label className="flex items-center p-4 border rounded-lg cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    className="h-5 w-5 text-orange-600"
                    defaultChecked
                  />
                  <span className="ml-4">
                    <span className="font-semibold block">
                      Thanh toán khi nhận hàng (COD)
                    </span>
                    <span className="text-sm text-gray-500">
                      Thanh toán bằng tiền mặt cho tài xế
                    </span>
                  </span>
                </label>
                <label className="flex items-center p-4 border rounded-lg cursor-pointer bg-gray-100 text-gray-400">
                  <input
                    type="radio"
                    name="payment"
                    className="h-5 w-5"
                    disabled
                  />
                  <span className="ml-4">
                    <span className="font-semibold block">
                      Ví điện tử (Sắp có)
                    </span>
                    <span className="text-sm">
                      Thanh toán qua MoMo, ZaloPay...
                    </span>
                  </span>
                </label>
                <label className="flex items-center p-4 border rounded-lg cursor-pointer bg-gray-100 text-gray-400">
                  <input
                    type="radio"
                    name="payment"
                    className="h-5 w-5"
                    disabled
                  />
                  <span className="ml-4">
                    <span className="font-semibold block">
                      Thẻ ngân hàng (Sắp có)
                    </span>
                    <span className="text-sm">
                      Hỗ trợ thẻ ATM, Visa, Mastercard
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Section: Order Summary */}
          <div className="lg:w-1/3">
            <div className="bg-white p-6 rounded-lg shadow-md sticky top-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Tóm tắt đơn hàng
              </h2>
              <div className="space-y-4 mb-6">
                {cart.items.map((item) => (
                  <div key={item._id} className="flex items-center">
                    <img
                      src={
                        item.displaySnapshot.imageUrl ||
                        "https://via.placeholder.com/64"
                      }
                      alt={item.displaySnapshot.name}
                      className="w-16 h-16 object-cover rounded-md mr-4"
                    />
                    <div className="flex-grow">
                      <p className="font-semibold">
                        {item.displaySnapshot.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        SL: {item.quantity}
                      </p>
                    </div>
                    <span className="font-semibold">
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

              <div className="space-y-2 text-gray-700 mb-6 border-t pt-4">
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
                Bằng việc nhấn "Đặt hàng", bạn đồng ý với các{" "}
                <a href="#" className="text-orange-500">
                  Điều khoản dịch vụ
                </a>{" "}
                của chúng tôi.
              </p>

              <button
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder || !cart?.items.length}
                className="w-full bg-orange-500 text-white text-center py-3 rounded-md text-lg font-semibold hover:bg-orange-600 transition-colors duration-200 block disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isPlacingOrder ? "Đang xử lý..." : "Đặt hàng"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default CheckoutPage;
