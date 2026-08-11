import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, ShoppingBag, Heart, User, Utensils, X, Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useToast } from "../contexts/ToastContext";
import { LoginModal } from "./LoginModal";
import { CartItem } from "../types/cart";

const formatMoney = (val: number) =>
  `${new Intl.NumberFormat("vi-VN").format(val)}đ`;

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated } = useAuth();
  const { cart, updateItemQuantity, clearCart } = useCart();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loginModalTitle, setLoginModalTitle] = useState("");

  const totalQuantity =
    cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const subtotal = cart?.subtotal || 0;

  const handleNavClick = (
    path: string,
    requiresAuth: boolean,
    isCartTab?: boolean,
    title?: string
  ) => {
    if (isCartTab) {
      setIsCartOpen(true);
      return;
    }

    if (requiresAuth && !isAuthenticated) {
      if (location.pathname === "/login") {
        toast.info(title || "Vui lòng đăng nhập để tiếp tục");
      } else {
        setLoginModalTitle(title || "Bạn cần đăng nhập để tiếp tục");
        setIsLoginModalOpen(true);
      }
      return;
    }

    navigate(path);
  };

  const navItems = [
    {
      label: "Khám phá",
      icon: Home,
      path: "/home",
      requiresAuth: false,
    },
    {
      label: "Nhà hàng",
      icon: Utensils,
      path: "/restaurants",
      requiresAuth: false,
    },
    {
      label: "Giỏ hàng",
      icon: ShoppingBag,
      path: "/cart",
      requiresAuth: false,
      isCart: true,
      badge: totalQuantity > 0 ? totalQuantity : null,
    },
    {
      label: "Yêu thích",
      icon: Heart,
      path: "/profile?tab=favorites",
      requiresAuth: true,
      title: "Xem danh sách nhà hàng yêu thích",
    },
    {
      label: "Tài khoản",
      icon: User,
      path: "/profile",
      requiresAuth: true,
      title: "Quản lý thông tin tài khoản",
    },
  ];

  return (
    <>
      {/* Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-slate-200/80 bg-white/95 py-2 backdrop-blur-md md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            !item.isCart &&
            (location.pathname === item.path ||
              (item.path.includes("?") &&
                location.pathname + location.search === item.path));

          return (
            <button
              key={item.label}
              type="button"
              onClick={() =>
                handleNavClick(item.path, item.requiresAuth, item.isCart, item.title)
              }
              className={`relative flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition active:scale-95 ${isActive ? "text-[#ff5a1f]" : "text-slate-500 hover:text-slate-700"
                }`}
            >
              <div className="relative">
                <Icon
                  className={`h-5 w-5 ${isActive ? "stroke-[2.5] text-[#ff5a1f]" : "stroke-[1.75]"
                    }`}
                />
                {item.badge && (
                  <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#ff5a1f] px-1 text-[9px] font-black text-white shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Auth Modal Guard */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        itemName={loginModalTitle}
      />

      {/* Cart Bottom Sheet Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs md:hidden animate-fade-in">
          <div className="flex-1" onClick={() => setIsCartOpen(false)} />
          <div className="rounded-t-3xl bg-white p-5 shadow-2xl animate-slide-up max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-[#ff5a1f]" />
                <h3 className="font-extrabold text-slate-800 text-lg">
                  Giỏ hàng ({totalQuantity} món)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {totalQuantity === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                Giỏ hàng của bạn đang trống.
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto py-3 space-y-3 divide-y divide-slate-100">
                  {cart?.items.map((item: CartItem) => (
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
                            updateItemQuantity(
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
                            updateItemQuantity(
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
                        setIsCartOpen(false);
                      }}
                      className="p-3.5 rounded-2xl border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200"
                      title="Xóa tất cả"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>

                    <button
                      onClick={() => {
                        setIsCartOpen(false);
                        navigate("/cart");
                      }}
                      className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#ff5a1f] p-3.5 font-bold text-white shadow-lg shadow-orange-500/30 active:scale-98 transition"
                    >
                      <span>Tiến hành thanh toán</span>
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
