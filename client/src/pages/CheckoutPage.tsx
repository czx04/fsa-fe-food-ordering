import { Link, useNavigate } from "react-router-dom";
import React, { useState, useEffect, useMemo } from "react";
import { Edit, PlusCircle, Save, ShoppingBag, Utensils, X } from "lucide-react";
import { UserAddress, AddAddressPayload } from "../types/user";
import {
  CreateOrderPayload,
  CreateOrderResponse,
  CheckoutPricing,
} from "../types/order";
import { CartItem as CartItemType } from "../types/cart";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../utils/api";
import { SERVER_STATIC_ASSET_BASE_URL } from "../utils/constants";
import { useToast } from "../contexts/ToastContext";
import { userService } from "../services/userService";

const AddressModal = ({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: AddAddressPayload) => Promise<void>;
}) => {
  const [formData, setFormData] = useState<AddAddressPayload>({
    label: "Nhà riêng",
    recipientName: "",
    phone: "",
    line1: "",
    ward: "",
    district: "",
    city: "TP. Hồ Chí Minh",
    isDefault: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lưu địa chỉ thất bại.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-lg w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Thêm địa chỉ mới</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="recipientName"
            value={formData.recipientName}
            onChange={handleChange}
            placeholder="Họ và tên người nhận"
            required
            className="w-full p-2 border rounded"
          />
          <input
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Số điện thoại"
            required
            className="w-full p-2 border rounded"
          />
          <input
            name="line1"
            value={formData.line1}
            onChange={handleChange}
            placeholder="Số nhà, tên đường (vd: 123 Nguyễn Huệ)"
            required
            className="w-full p-2 border rounded"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              name="ward"
              value={formData.ward}
              onChange={handleChange}
              placeholder="Phường / Xã (vd: Phường Bến Nghé)"
              required
              className="w-full p-2 border rounded"
            />
            <input
              name="district"
              value={formData.district}
              onChange={handleChange}
              placeholder="Quận / Huyện (vd: Quận 1)"
              required
              className="w-full p-2 border rounded"
            />
          </div>
          <input
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="Tỉnh / Thành phố (vd: TP. Hồ Chí Minh)"
            required
            className="w-full p-2 border rounded"
          />
          <label className="flex items-center">
            <input
              type="checkbox"
              name="isDefault"
              checked={formData.isDefault}
              onChange={handleChange}
            />
            <span className="ml-2">Đặt làm địa chỉ mặc định</span>
          </label>
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border flex items-center"
            >
              <X className="w-4 h-4 mr-2" /> Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded bg-orange-500 text-white disabled:bg-gray-400 flex items-center"
            >
              {isSaving ? (
                "Đang lưu..."
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Lưu địa chỉ
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

const getImageUrl = (
  imageUrl: string | string[] | undefined,
): string | null => {
  if (!imageUrl) return null;
  const url = Array.isArray(imageUrl) ? imageUrl[0] : imageUrl;
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${SERVER_STATIC_ASSET_BASE_URL}${url}`;
};

const ImageWithFallback = ({ item }: { item: CartItemType }) => {
  const [hasError, setHasError] = useState(false);
  const imageUrl = getImageUrl(item.menuItemId.imageUrl);

  useEffect(() => {
    setHasError(false);
  }, [imageUrl]);

  if (hasError || !imageUrl) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 rounded-md">
        <Utensils className="w-8 h-8" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={item.menuItemId.name}
      className="w-full h-full object-cover rounded-md"
      onError={() => setHasError(true)}
    />
  );
};

function CheckoutPage() {
  const { cart, isLoading: isCartLoading, fetchCart } = useCart();
  const { user, isLoading: isAuthLoading, updateUser } = useAuth();
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(
    null,
  );
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "VNPAY">("COD");
  const [pricing, setPricing] = useState<CheckoutPricing | null>(null);
  const [isCalculating, setIsCalculating] = useState(true);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (user?.addresses && user.addresses.length > 0) {
      const defaultAddr =
        user.addresses.find((addr) => addr.isDefault) || user.addresses[0];
      setSelectedAddress(defaultAddr);
    }
  }, [user]);

  useEffect(() => {
    const calculateTotals = async () => {
      if (!cart || !selectedAddress) {
        setIsCalculating(false);
        return;
      }
      setIsCalculating(true);
      try {
        const response = await api.post<CheckoutPricing>(
          "/cart/calculate-checkout",
          { addressId: selectedAddress._id }, // Send address for future-proofing
        );
        setPricing(response.data);
      } catch (e) {
        console.error("Lỗi tính toán phí vận chuyển:", e);
        toast.error("Không thể tính phí vận chuyển, vui lòng thử lại.");
      } finally {
        setIsCalculating(false);
      }
    };
    calculateTotals();
  }, [cart, selectedAddress]);

  const restaurant = useMemo(() => cart?.restaurantId, [cart]);

  const handleSaveNewAddress = async (addressData: AddAddressPayload) => {
    const response = await userService.addAddress(addressData);
    updateUser(response.user); // Update user in AuthContext
    // Find the newly added address to select it.
    const newAddress = response.user.addresses?.find(
      (addr) =>
        addr.line1 === addressData.line1 &&
        addr.recipientName === addressData.recipientName,
    );
    if (newAddress) setSelectedAddress(newAddress);
    setIsAddressModalOpen(false);
  };

  const handlePlaceOrder = async () => {
    if (!cart || !selectedAddress) {
      toast.error("Vui lòng chọn địa chỉ giao hàng.");
      return;
    }

    setIsPlacingOrder(true);
    try {
      const payload: CreateOrderPayload = {
        paymentMethod: paymentMethod,
        deliveryAddress: {
          recipientName: selectedAddress.recipientName,
          phone: selectedAddress.phone,
          line1: selectedAddress.line1,
          ward: selectedAddress.ward,
          district: selectedAddress.district,
          city: selectedAddress.city,
        },
      };
      const response = await api.post<CreateOrderResponse>(
        "/orders/checkout",
        payload,
      );
      const { order, paymentUrl } = response.data;

      // Thanh toán VNPAY: lưu đơn đang chờ thanh toán rồi chuyển NGAY sang cổng
      // thanh toán. KHÔNG gọi fetchCart() trước redirect vì sẽ khiến trang rơi
      // vào empty state trước khi đi VNPAY (cart đã được clear phía server).
      if (paymentUrl) {
        localStorage.setItem(
          "pendingVnpayOrder",
          JSON.stringify({
            orderId: order._id,
            orderNumber: order.orderNumber,
            paymentUrl,
            placedAt: Date.now(),
          }),
        );
        window.location.href = paymentUrl;
        return;
      }

      // Thanh toán COD: clear cart trước khi sang trang thành công (SPA)
      await fetchCart();
      navigate(
        `/payment/success?orderId=${order._id}&orderNumber=${order.orderNumber}`,
      );
    } catch (err: any) {
      console.error("Lỗi đặt hàng:", err);
      toast.error(
        err.response?.data?.message || "Đặt hàng thất bại. Vui lòng thử lại.",
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (isCartLoading || isAuthLoading) {
    return (
      <main className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Thanh toán</h1>
        <p>Đang tải thông tin thanh toán...</p>
      </main>
    );
  }

  if (!cart || cart.items.length === 0 || !restaurant) {
    return (
      <main className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Thanh toán</h1>
        <p>Giỏ hàng của bạn đang trống. Không thể tiến hành thanh toán.</p>
        <Link to="/cart" className="text-orange-500 hover:underline mt-4 block">
          Quay về giỏ hàng
        </Link>
      </main>
    );
  }

  const { subtotal, discountAmount } = cart;

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mt-1">Thanh toán</h1>
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
                  onClick={() => setIsAddressModalOpen(true)}
                  className="text-orange-500 hover:underline text-sm font-medium flex items-center"
                >
                  Thay đổi <Edit className="w-3 h-3 ml-1" />
                </button>
              </div>
              {selectedAddress ? (
                <div className="border rounded-lg p-4">
                  <p className="font-semibold text-gray-800">
                    {selectedAddress.recipientName}
                  </p>
                  <p className="text-gray-600">{selectedAddress.phone}</p>
                  <p className="text-gray-600">
                    {`${selectedAddress.line1}, ${selectedAddress.ward}, ${selectedAddress.district}, ${selectedAddress.city}`}
                  </p>
                </div>
              ) : (
                <div className="border border-dashed rounded-lg p-4 text-center text-gray-500">
                  <p>Bạn chưa có địa chỉ nào.</p>
                  <button
                    type="button"
                    onClick={() => setIsAddressModalOpen(true)}
                    className="text-orange-500 font-semibold mt-2 flex items-center mx-auto"
                  >
                    <PlusCircle className="w-4 h-4 mr-2" /> Thêm địa chỉ mới
                  </button>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                2. Phương thức thanh toán
              </h2>
              <div className="space-y-4">
                <label
                  htmlFor="payment-cod"
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === "COD" ? "border-orange-500 bg-orange-50/30" : "border-gray-200"
                  }`}
                  onClick={() => setPaymentMethod("COD")}
                >
                  <input
                    type="radio"
                    name="payment"
                    id="payment-cod"
                    className="h-5 w-5 text-orange-600 focus:ring-orange-500"
                    checked={paymentMethod === "COD"}
                    onChange={() => setPaymentMethod("COD")}
                  />
                  <span className="ml-4">
                    <span className="font-semibold block text-gray-800">
                      Thanh toán khi nhận hàng (COD)
                    </span>
                    <span className="text-sm text-gray-500">
                      Thanh toán bằng tiền mặt khi nhận đồ ăn
                    </span>
                  </span>
                </label>
                <label
                  htmlFor="payment-vnpay"
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === "VNPAY" ? "border-blue-500 bg-blue-50/30" : "border-gray-200"
                  }`}
                  onClick={() => setPaymentMethod("VNPAY")}
                >
                  <input
                    type="radio"
                    name="payment"
                    id="payment-vnpay"
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500"
                    checked={paymentMethod === "VNPAY"}
                    onChange={() => setPaymentMethod("VNPAY")}
                  />
                  <span className="ml-4 flex-grow">
                    <span className="font-semibold block text-gray-800 flex items-center justify-between">
                      <span>Cổng thanh toán VNPAY</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">
                        Sandbox Test
                      </span>
                    </span>
                    <span className="text-sm text-gray-500">
                      Thanh toán an toàn qua Ví VNPAY, Thẻ ATM Nội địa & QR Code
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Section: Order Summary */}
          <div className="lg:w-1/3">
            <div className="bg-white p-6 rounded-lg shadow-md sticky top-24">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Tóm tắt đơn hàng
              </h2>
              <div className="space-y-4 mb-6">
                {cart.items.map((item) => (
                  <div
                    key={item.menuItemId._id}
                    className="flex items-center gap-4"
                  >
                    <div className="w-16 h-16 flex-shrink-0">
                      <ImageWithFallback item={item} />
                    </div>
                    <div className="flex-grow">
                      <p className="font-semibold">{item.menuItemId.name}</p>
                      <p className="text-sm text-gray-500">
                        SL: {item.quantity}
                      </p>
                    </div>
                    <span className="font-semibold w-28 text-right">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-gray-700 mb-6 border-t pt-4">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {isCalculating ? (
                  <div className="flex justify-between">
                    <span>Phí giao hàng</span>
                    <span className="h-5 w-24 bg-gray-200 rounded animate-pulse"></span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span>Phí giao hàng</span>
                    <span className={!selectedAddress ? "text-gray-500" : ""}>
                      {selectedAddress
                        ? formatCurrency(pricing?.deliveryFee ?? 0)
                        : "Chọn địa chỉ"}
                    </span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>Mã giảm giá ({cart.couponId?.code})</span>
                    <span>- {formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold text-gray-800 pt-2 border-t mt-2">
                  <span>Tổng cộng</span>
                  {isCalculating ? (
                    <span className="h-7 w-32 bg-gray-200 rounded animate-pulse"></span>
                  ) : (
                    <span>
                      {formatCurrency(pricing?.finalTotal ?? cart.grandTotal)}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-gray-500 mb-6">
                Bằng việc nhấn "Đặt hàng", bạn đồng ý với các{" "}
                <Link to="/terms" className="text-orange-500 hover:underline">
                  Điều khoản dịch vụ
                </Link>{" "}
                của chúng tôi.
              </p>

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={
                  isPlacingOrder ||
                  isCalculating ||
                  !cart?.items.length ||
                  !selectedAddress
                }
                className="w-full bg-orange-500 text-white text-center py-3 rounded-md text-lg font-semibold hover:bg-orange-600 transition-colors duration-200 flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isPlacingOrder ? (
                  "Đang xử lý..."
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5 mr-2" /> Đặt hàng
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSave={handleSaveNewAddress}
      />
    </main>
  );
}

export default CheckoutPage;
