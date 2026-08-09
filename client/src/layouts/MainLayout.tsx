import { Outlet, Link, NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { ShoppingBag, LogOut } from "lucide-react";

export const MainLayout = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { cart } = useCart();

  const totalQuantity =
    cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/40 text-slate-800 font-sans">
      {/* Topbar Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="text-2xl font-black tracking-tight text-orange-600 hover:opacity-90 transition"
            >
              MămMăm<span className="text-amber-500">.</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
              <NavLink
                to="/home"
                className={({ isActive }) =>
                  isActive
                    ? "text-orange-600 font-bold"
                    : "hover:text-orange-600 transition"
                }
              >
                Trang chủ
              </NavLink>
              <NavLink
                to="/restaurants"
                className={({ isActive }) =>
                  isActive
                    ? "text-orange-600 font-bold"
                    : "hover:text-orange-600 transition"
                }
              >
                Nhà hàng
              </NavLink>
              {isAuthenticated && (
                <NavLink
                  to="/orders"
                  className={({ isActive }) =>
                    isActive
                      ? "text-orange-600 font-bold"
                      : "hover:text-orange-600 transition"
                  }
                >
                  Đơn hàng của tôi
                </NavLink>
              )}
            </nav>
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {/* Cart Icon */}
                <Link
                  to="/cart"
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-700 relative transition"
                  title="Giỏ hàng"
                >
                  <ShoppingBag className="w-5 h-5 text-slate-700" />
                  {totalQuantity > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-600 text-xs font-bold text-white">
                      {totalQuantity}
                    </span>
                  )}
                </Link>
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs flex items-center justify-center shadow">
                    {user?.fullName?.charAt(0) || "U"}
                  </div>
                  <span className="hidden sm:inline text-xs font-semibold text-slate-700 max-w-[120px] truncate">
                    {user?.fullName}
                  </span>
                  <button
                    type="button"
                    onClick={logout}
                    className="ml-2 px-3 py-1.5 text-xs font-semibold text-rose-600 border border-rose-200 hover:bg-rose-50 rounded-lg transition flex items-center gap-1"
                    title="Đăng xuất"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-orange-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl shadow-md shadow-orange-500/20 transition"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-12 text-slate-500 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link to="/" className="text-xl font-black text-orange-600">
              MămMăm<span className="text-amber-500">.</span>
            </Link>
            <p className="text-xs leading-relaxed max-w-xs text-slate-400">
              Món ngon quanh bạn, giao nhanh tận cửa. Trải nghiệm đặt món nhẹ
              nhàng và đầy cảm hứng.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
              Khám phá
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  to="/restaurants"
                  className="hover:text-orange-600 transition"
                >
                  Nhà hàng gần bạn
                </Link>
              </li>
              <li>
                <Link
                  to="/restaurants?category=mon-hot"
                  className="hover:text-orange-600 transition"
                >
                  Món hot hôm nay
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
              Dịch vụ
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  to="/profile"
                  className="hover:text-orange-600 transition"
                >
                  Tài khoản cá nhân
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-orange-600 transition">
                  Lịch sử đơn hàng
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
              Hỗ trợ
            </h4>
            <p className="text-xs text-slate-400">Hotline: 1900 8888</p>
            <p className="text-xs text-slate-400 mt-1">
              Email: hotro@mammam.vn
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <span>© 2026 MămMăm. All rights reserved.</span>
          <div className="flex gap-4">
            <span className="hover:underline cursor-pointer">
              Quyền riêng tư
            </span>
            <span className="hover:underline cursor-pointer">
              Điều khoản sử dụng
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
