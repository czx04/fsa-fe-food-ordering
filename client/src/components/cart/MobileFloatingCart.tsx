import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, ArrowRight, X, Trash2, Plus, Minus, ChevronUp } from "lucide-react";
import { useCart } from "../../contexts/CartContext";
import { CartItem } from "../../types/cart";

const formatMoney = (val: number) =>
  `${new Intl.NumberFormat("vi-VN").format(val)}đ`;

interface MobileFloatingCartProps {
  restaurantId?: string;
  onUpdateQuantity?: (menuItemId: string, newQuantity: number) => void;
}

export const MobileFloatingCart: React.FC<MobileFloatingCartProps> = ({
  restaurantId,
  onUpdateQuantity,
}) => {
  const { cart, clearCart, updateItemQuantity } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);

  const handleQuantityUpdate = onUpdateQuantity || updateItemQuantity;

  const isCurrentRestaurantCart =
    !restaurantId || cart?.restaurantId?._id === restaurantId;
  const cartItems =
    (isCurrentRestaurantCart ? cart?.items : cart?.items) || [];
  const totalQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cart?.subtotal || 0;

  // Trigger bounce animation when totalQuantity increases
  useEffect(() => {
    if (totalQuantity > 0) {
      setIsBouncing(true);
      const timer = setTimeout(() => setIsBouncing(false), 500);
      return () => clearTimeout(timer);
    }
  }, [totalQuantity]);

  if (totalQuantity === 0) return null;

  return (
    <>
      {/* Mobile Floating Pill Bar */}
      <div
        className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md md:hidden transition-all duration-300 ${
          isBouncing ? "scale-105" : "scale-100"
        }`}
      >
        <div
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-between rounded-2xl bg-[#ff5a1f] px-5 py-3.5 text-white shadow-2xl shadow-orange-500/40 cursor-pointer active:scale-95 transition"
        >
          <div className="flex items-center gap-3">
            <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-white/20">
              <ShoppingBag className="h-5 w-5 text-white" />
              <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-[11px] font-black text-[#ff5a1f]">
                {totalQuantity}
              </span>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-white/80">
                {cart?.restaurantId?.name || "Giỏ hàng"}
              </div>
              <div className="text-base font-extrabold">
                {formatMoney(subtotal)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 font-bold text-xs bg-white/20 px-3 py-2 rounded-xl">
            <span>Xem giỏ hàng</span>
            <ChevronUp className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Bottom Sheet Drawer Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs md:hidden animate-fade-in">
          {/* Backdrop Click */}
          <div className="flex-1" onClick={() => setIsOpen(false)} />

          {/* Drawer Content */}
          <div className="rounded-t-3xl bg-white p-5 shadow-2xl animate-slide-up max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-[#ff5a1f]" />
                <h3 className="font-extrabold text-slate-800 text-lg">
                  Giỏ hàng ({totalQuantity} món)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Item List */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3 divide-y divide-slate-100">
              {cartItems.map((item: CartItem) => (
                <div
                  key={item.menuItemId._id}
                  className="flex items-center justify-between pt-3 first:pt-0"
                >
                  <div className="flex-1 pr-3">
                    <p className="font-bold text-slate-800 text-sm">
                      {item.menuItemId.name}
                    </p>
                    <p className="text-xs text-[#ff5a1f] font-semibold">
                      {formatMoney(item.price)}
                    </p>
                  </div>

                  <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50">
                    <button
                      type="button"
                      onClick={() =>
                        handleQuantityUpdate(
                          item.menuItemId._id,
                          item.quantity - 1
                        )
                      }
                      className="grid h-8 w-8 place-items-center text-slate-600 active:bg-slate-200 rounded-l-xl"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="grid h-8 min-w-8 place-items-center text-xs font-bold text-slate-800">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleQuantityUpdate(
                          item.menuItemId._id,
                          item.quantity + 1
                        )
                      }
                      className="grid h-8 w-8 place-items-center text-slate-600 active:bg-slate-200 rounded-r-xl"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Summary & Checkout */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 font-medium">Tạm tính:</span>
                <span className="font-extrabold text-slate-900 text-lg">
                  {formatMoney(subtotal)}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    clearCart();
                    setIsOpen(false);
                  }}
                  className="p-3.5 rounded-2xl border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200"
                  title="Xóa tất cả"
                >
                  <Trash2 className="h-5 w-5" />
                </button>

                <Link
                  to="/cart"
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                >
                  <button className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#ff5a1f] p-3.5 font-bold text-white shadow-lg shadow-orange-500/30 active:scale-98 transition">
                    <span>Tiến hành thanh toán</span>
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
