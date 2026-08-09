import { Outlet, Link, NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ShoppingBag, LogOut } from "lucide-react";
import { Button } from "../components/ui/Button";

export const MainLayout = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-[#f7faf7] text-[#17201a] font-sans">
      {/* Topbar Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#e7ece8] shadow-sm">
        <div className="mx-auto w-[calc(100%-2.5rem)] max-w-[1180px] h-16 flex items-center justify-between">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="text-2xl font-black tracking-tight text-[#ff5a1f] hover:opacity-90 transition"
            >
              MămMăm<span className="text-[#ff5a1f]">.</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-[#68736c]">
              <NavLink
                to="/home"
                className={({ isActive }) =>
                  isActive
                    ? "text-[#ff5a1f] font-bold"
                    : "hover:text-[#ff5a1f] transition"
                }
              >
                Trang chủ
              </NavLink>
              <NavLink
                to="/restaurants"
                className={({ isActive }) =>
                  isActive
                    ? "text-[#ff5a1f] font-bold"
                    : "hover:text-[#ff5a1f] transition"
                }
              >
                Nhà hàng
              </NavLink>
              {isAuthenticated && (
                <NavLink
                  to="/orders"
                  className={({ isActive }) =>
                    isActive
                      ? "text-[#ff5a1f] font-bold"
                      : "hover:text-[#ff5a1f] transition"
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
                <Link
                  to="/cart"
                  className="p-2 rounded-xl hover:bg-[#f7faf7] text-[#17201a] relative transition"
                  title="Giỏ hàng"
                >
                  <ShoppingBag className="w-5 h-5 text-[#17201a]" />
                </Link>
                <div className="flex items-center gap-2 pl-2 border-l border-[#e7ece8]">
                  <div className="w-8 h-8 rounded-full bg-[#ff5a1f] text-white font-bold text-xs flex items-center justify-center shadow-sm">
                    {user?.fullName?.charAt(0) || "U"}
                  </div>
                  <span className="hidden sm:inline text-xs font-semibold text-[#17201a] max-w-[120px] truncate">
                    {user?.fullName}
                  </span>
                  <button
                    onClick={logout}
                    className="ml-2 px-3 py-1.5 text-xs font-bold text-rose-600 border border-rose-200 hover:bg-rose-50 rounded-lg transition flex items-center gap-1 cursor-pointer"
                    title="Đăng xuất"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Đăng nhập
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Đăng ký
                  </Button>
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
      <footer className="bg-white border-t border-[#e7ece8] py-12 text-[#68736c] text-xs">
        <div className="mx-auto w-[calc(100%-2.5rem)] max-w-[1180px] grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link to="/" className="text-xl font-black text-[#ff5a1f]">
              MămMăm<span className="text-[#ff5a1f]">.</span>
            </Link>
            <p className="text-xs leading-relaxed max-w-xs text-[#68736c]">
              Món ngon quanh bạn, giao nhanh tận cửa. Trải nghiệm đặt món nhẹ nhàng và đầy cảm hứng.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#17201a] mb-3">
              Khám phá
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  to="/restaurants"
                  className="hover:text-[#ff5a1f] transition"
                >
                  Nhà hàng gần bạn
                </Link>
              </li>
              <li>
                <Link
                  to="/restaurants?sort=popular_desc"
                  className="hover:text-[#ff5a1f] transition"
                >
                  Món hot hôm nay
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#17201a] mb-3">
              Dịch vụ
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  to="/profile"
                  className="hover:text-[#ff5a1f] transition"
                >
                  Tài khoản cá nhân
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-[#ff5a1f] transition">
                  Lịch sử đơn hàng
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#17201a] mb-3">
              Hỗ trợ
            </h4>
            <p className="text-xs text-[#68736c]">Hotline: 1900 8888</p>
            <p className="text-xs text-[#68736c] mt-1">
              Email: hotro@mammam.vn
            </p>
          </div>
        </div>
        <div className="mx-auto w-[calc(100%-2.5rem)] max-w-[1180px] mt-8 pt-8 border-t border-[#e7ece8] flex flex-col sm:flex-row items-center justify-between text-xs text-[#68736c] gap-4">
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
