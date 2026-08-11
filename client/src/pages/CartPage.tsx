import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useCart } from "../contexts/CartContext";
import {
  ArrowLeft,
  Loader2,
  Minus,
  Plus,
  Trash2,
  Utensils,
} from "lucide-react";
import { api } from "../utils/api";

import { ConfirmationModal } from "../components/ConfirmationModal";
import { CartItem as CartItemType } from "../types/cart";
import { useToast } from "../contexts/ToastContext";
import { SERVER_STATIC_ASSET_BASE_URL } from "../utils/constants";
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

function CartPage() {
  const {
    cart: contextCart,
    isLoading: isCartLoading,
    fetchCart,
    updateItemQuantity,
    removeItemFromCart,
    clearCart,
  } = useCart();
  const [displayCart, setDisplayCart] = useState(contextCart);
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [itemToDelete, setItemToDelete] = useState<CartItemType | null>(null);
  const [isClearingCart, setIsClearingCart] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    setDisplayCart(contextCart);
    if (contextCart?.couponId?.code) {
      setCouponCodeInput(contextCart.couponId.code);
    } else {
      setCouponCodeInput("");
    }
  }, [contextCart]);

  const restaurant = useMemo(() => displayCart?.restaurantId, [displayCart]);

  const handleUpdateQuantity = useCallback(
    async (menuItemId: string, newQuantity: number) => {
      if (newQuantity <= 0) {
        const item = displayCart?.items.find(
          (i) => i.menuItemId._id === menuItemId,
        );
        if (item) setItemToDelete(item);
        return;
      }

      try {
        await updateItemQuantity(menuItemId, newQuantity);
      } catch (error) {
        console.error("Failed to update quantity:", error);
        toast.error("Lỗi cập nhật số lượng. Vui lòng thử lại.");
      }
    },
    [displayCart, updateItemQuantity, toast],
  );

  const handleConfirmRemoveItem = useCallback(async () => {
    if (!itemToDelete) return;
    setIsProcessing(true);
    try {
      await removeItemFromCart(itemToDelete.menuItemId._id);
      toast.success(`Đã xóa "${itemToDelete.menuItemId.name}" khỏi giỏ hàng.`);
    } catch (error) {
      console.error("Failed to remove item:", error);
      toast.error("Lỗi xóa sản phẩm. Vui lòng thử lại.");
    } finally {
      setIsProcessing(false);
      setItemToDelete(null);
    }
  }, [itemToDelete, removeItemFromCart, toast]);

  const handleConfirmClearCart = useCallback(async () => {
    setIsProcessing(true);
    try {
      await clearCart();
      toast.success("Đã xóa tất cả sản phẩm khỏi giỏ hàng.");
    } catch (error) {
      console.error("Failed to clear cart:", error);
      toast.error("Lỗi xóa giỏ hàng. Vui lòng thử lại.");
    } finally {
      setIsProcessing(false);
      setIsClearingCart(false);
    }
  }, [clearCart, toast]);

  const handleApplyCoupon = useCallback(async () => {
    if (!couponCodeInput.trim()) {
      setCouponError("Vui lòng nhập mã giảm giá.");
      return;
    }
    setIsApplyingCoupon(true);
    setCouponError("");
    try {
      await api.post("/cart/apply-coupon", { couponCode: couponCodeInput });
      fetchCart(); // Re-fetch cart to get discount info
    } catch (error: any) {
      const message = error.response?.data?.message || "Áp dụng mã thất bại.";
      setCouponError(message);
    } finally {
      setIsApplyingCoupon(false);
    }
  }, [couponCodeInput, fetchCart]);

  const renderCouponButtonContent = () =>
    isApplyingCoupon ? (
      <Loader2 className="w-4 h-4 animate-spin" />
    ) : displayCart?.couponId ? (
      "Đã áp dụng"
    ) : (
      "Áp dụng"
    );

  if (isCartLoading) {
    return (
      <main className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Giỏ hàng của bạn</h1>
        <p>Đang tải thông tin giỏ hàng...</p>
      </main>
    );
  }

  if (!displayCart || !restaurant || displayCart.items.length === 0) {
    return (
      <main className="container mx-auto p-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Giỏ hàng của bạn</h1>
        <p className="bg-white p-8 rounded-lg shadow-md text-gray-700 text-lg font-medium">
          Giỏ hàng trống.
        </p>
        <Link
          to="/restaurants"
          className="mt-6 inline-block text-orange-500 hover:underline"
        >
          <ArrowLeft className="inline w-4 h-4" /> Thêm sản phẩm vào giỏ hàng
          trước
        </Link>
      </main>
    );
  }

  const { subtotal, discountAmount, grandTotal } = displayCart;
  const deliveryFee = restaurant.delivery?.fee ?? 0;
  const finalTotal = grandTotal + deliveryFee;

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Link
            to={
              restaurant.slug
                ? `/restaurants/${restaurant.slug}`
                : "/restaurants"
            }
            className="text-orange-500 hover:underline text-sm font-medium flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Chọn thêm món
          </Link>
          <h1 className="text-4xl font-bold text-gray-800 mt-1">
            Giỏ hàng của bạn
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-start gap-8">
          {/* Left Section: Cart Items */}
          <div className="lg:w-2/3 bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-700">
                  {displayCart.items.length} món từ {restaurant.name}
                </h2>
                <p className="text-gray-500 text-sm">
                  {restaurant.address.line1}, {restaurant.address.ward},{" "}
                  {restaurant.address.district}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsClearingCart(true)}
                className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" /> Xóa tất cả
              </button>
            </div>

            {displayCart.items.map((item) => (
              <div
                key={item.menuItemId._id}
                className="flex items-center py-4 border-b last:border-b-0"
              >
                <div className="w-20 h-20 flex-shrink-0 mr-4">
                  <ImageWithFallback item={item} />
                </div>
                <div className="flex-grow">
                  <h3 className="font-semibold text-gray-800">
                    {item.menuItemId.name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setItemToDelete(item)}
                    className="text-red-500 hover:text-red-700 text-xs mt-1 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Xóa
                  </button>
                </div>
                <div className="inline-flex items-center overflow-hidden rounded-lg border border-gray-200 mr-4">
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateQuantity(
                        item.menuItemId._id,
                        item.quantity - 1,
                      )
                    }
                    className="grid h-9 w-9 place-items-center bg-white text-gray-700 hover:bg-gray-100 transition hover:text-red-500"
                    title={
                      item.quantity === 1 ? "Xóa sản phẩm" : "Giảm số lượng"
                    }
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="grid h-9 min-w-9 place-items-center text-sm font-bold">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateQuantity(
                        item.menuItemId._id,
                        item.quantity + 1,
                      )
                    }
                    className="grid h-9 w-9 place-items-center bg-white text-gray-700 hover:bg-gray-100"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <span className="font-semibold text-gray-800 w-28 text-right">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Right Section: Order Summary */}
          <div className="lg:w-1/3">
            <div className="bg-white p-6 rounded-lg shadow-md sticky top-24">
              <h2 className="text-xl font-bold text-gray-800 my-4">
                Tóm tắt đơn hàng
              </h2>

              <div className="mb-4">
                <div className="flex items-center border rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-orange-300 focus-within:border-orange-500 transition">
                  <input
                    type="text"
                    placeholder="Mã giảm giá"
                    value={couponCodeInput}
                    onChange={(e) => {
                      setCouponCodeInput(e.target.value.toUpperCase());
                      setCouponError("");
                    }}
                    disabled={isApplyingCoupon || !!displayCart.couponId}
                    className="flex-grow p-2 border-none focus:outline-none disabled:bg-gray-100 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={isApplyingCoupon || !!displayCart.couponId}
                    className="bg-orange-500 text-white px-4 py-2 hover:bg-orange-600 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center w-28"
                  >
                    {renderCouponButtonContent()}
                  </button>
                </div>
                {couponError && (
                  <p className="text-red-500 text-xs mt-1">{couponError}</p>
                )}
              </div>

              <div className="space-y-2 text-gray-700 mb-6 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span>Tạm tính</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Phí giao hàng</span>
                  <span>{formatCurrency(deliveryFee)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-orange-600 font-semibold">
                    <span>
                      Mã giảm giá
                      {displayCart.couponId &&
                        ` (${displayCart.couponId.code})`}
                    </span>
                    <span>- {formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold text-gray-800 pt-2 border-t mt-2">
                  <span>Tổng thanh toán</span>
                  <span>{formatCurrency(finalTotal)}</span>
                </div>
              </div>

              <p className="text-xs text-gray-500 mb-6">
                Bằng việc nhấn "Tiến hành thanh toán", bạn đồng ý với các{" "}
                <Link to="/terms" className="text-orange-500 hover:underline">
                  Điều khoản dịch vụ
                </Link>{" "}
                của chúng tôi.
              </p>

              <button
                type="button"
                onClick={() => navigate("/checkout")}
                className="w-full bg-orange-500 text-white py-3 rounded-md text-lg font-semibold hover:bg-orange-600 transition-colors duration-200"
              >
                Tiến hành thanh toán
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmRemoveItem}
        title="Xác nhận xóa món"
        message={`Bạn có chắc muốn xóa món "${itemToDelete?.menuItemId.name}" khỏi giỏ hàng?`}
        confirmText="Xóa"
        isDestructive
        isConfirming={isProcessing}
      />

      <ConfirmationModal
        isOpen={isClearingCart}
        onClose={() => setIsClearingCart(false)}
        onConfirm={handleConfirmClearCart}
        title="Xác nhận xóa giỏ hàng"
        message="Bạn có chắc muốn xóa tất cả các món trong giỏ hàng không? Hành động này không thể hoàn tác."
        confirmText="Xóa tất cả"
        isDestructive
        isConfirming={isProcessing}
      />
    </main>
  );
}

export default CartPage;
