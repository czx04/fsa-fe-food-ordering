import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../utils/api";
import { Button } from "../components/ui/Button";
import { AlertCircle } from "lucide-react";

export const Login = () => {
  const [email, setEmail] = useState("customer@foodordering.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await api.post("/auth/login", { email, password });
      login(res.data.accessToken, res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || "Đăng nhập thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 bg-[#f7faf7] text-[#17201a] min-h-[calc(100vh-64px)]">
      {/* Left Artwork Section */}
      <section className="hidden lg:flex flex-col justify-center p-12 bg-[#fff0e9] text-[#17201a] relative overflow-hidden">
        {/* Center Content */}
        <div className="relative z-10 max-w-md mx-auto text-center py-8">
          <div className="relative inline-block mb-8">
            <img
              src="/assets/noodles.jpg"
              alt="Món ngon"
              className="relative w-72 h-72 object-cover rounded-3xl shadow-md mx-auto border-4 border-white"
            />
          </div>
          <span className="mb-2 text-[11px] font-extrabold uppercase tracking-[.12em] text-[#ff5a1f] block">
            Khám phá vị ngon
          </span>
          <h2 className="text-3xl font-bold mb-3 tracking-tight text-[#17201a]">
            Món ngon luôn chờ bạn
          </h2>
          <p className="text-[#68736c] text-sm leading-relaxed">
            Hơn 1.000+ nhà hàng đối tác, hàng ngàn món ăn giao tận tay bạn chỉ trong vài phút.
          </p>
        </div>
      </section>

      {/* Right Form Section */}
      <section className="flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-8 bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-[#e7ece8]">
          {/* Header Mobile Brand */}
          <div>
            <Link
              to="/"
              className="lg:hidden text-2xl font-black text-[#ff5a1f] block mb-6"
            >
              MămMăm<span className="text-[#ff5a1f]">.</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#17201a] tracking-tight">
              Chào mừng trở lại!
            </h1>
            <p className="text-[#68736c] text-xs mt-2">
              Đăng nhập để tiếp tục khám phá thế giới ẩm thực.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#68736c] mb-2">
                Email hoặc số điện thoại
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nhapemail@example.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#e7ece8] focus:border-[#ff5a1f] focus:ring-4 focus:ring-[#ff5a1f]/10 outline-none transition text-[#17201a] text-xs bg-[#f7faf7] focus:bg-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#68736c]">
                  Mật khẩu
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-[#ff5a1f] hover:text-[#e94e16] transition"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#e7ece8] focus:border-[#ff5a1f] focus:ring-4 focus:ring-[#ff5a1f]/10 outline-none transition text-[#17201a] text-xs bg-[#f7faf7] focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center text-[#68736c] cursor-pointer select-none">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 accent-[#ff5a1f]"
                />
                <span className="ml-2 font-medium">
                  Ghi nhớ đăng nhập
                </span>
              </label>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              variant="primary"
              size="lg"
              fullWidth
            >
              {isLoading ? "Đang xử lý..." : "Đăng nhập"}
            </Button>

            <p className="text-center text-xs text-[#68736c] mt-6 pt-4 border-t border-[#e7ece8]">
              Chưa có tài khoản?{" "}
              <Link
                to="/register"
                className="font-bold text-[#ff5a1f] hover:text-[#e94e16] transition"
              >
                Đăng ký ngay
              </Link>
            </p>
          </form>
        </div>
      </section>
    </div>
  );
};
