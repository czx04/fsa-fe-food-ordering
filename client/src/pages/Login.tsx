import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../utils/api";
import { DEFAULT_DISH_IMAGE_URL } from "../utils/constants";

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
    <div className="grid grid-cols-1 lg:grid-cols-2 bg-amber-50/40 text-slate-800">
      {/* Left Artwork Section */}
      <section className="hidden lg:flex flex-col justify-center p-12 bg-gradient-to-br from-orange-500 via-amber-500 to-rose-500 text-white relative overflow-hidden min-h-[80vh]">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"></div>

        {/* Center Content */}
        <div className="relative z-10 max-w-md mx-auto text-center py-8">
          <div className="relative inline-block mb-8 group">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-300 to-orange-300 rounded-3xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
            <img
              src={DEFAULT_DISH_IMAGE_URL}
              alt="Món ngon"
              className="relative w-72 h-72 object-cover rounded-3xl shadow-2xl mx-auto border-4 border-white/20 transform group-hover:scale-[1.02] transition duration-300"
            />
          </div>
          <h2 className="text-3xl font-bold mb-3 tracking-tight">
            Món ngon luôn chờ bạn
          </h2>
          <p className="text-amber-100 text-base leading-relaxed">
            Hơn 1.000+ nhà hàng đối tác, hàng ngàn món ăn giao tận tay bạn chỉ
            trong vài phút.
          </p>
        </div>
      </section>

      {/* Right Form Section */}
      <section className="flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-8 bg-white p-8 sm:p-10 rounded-3xl shadow-xl shadow-orange-950/5 border border-orange-100">
          {/* Header Mobile Brand */}
          <div>
            <Link
              to="/"
              className="lg:hidden text-2xl font-black text-orange-600 block mb-6"
            >
              MămMăm.
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Chào mừng trở lại! 👋
            </h1>
            <p className="text-slate-500 text-sm mt-2">
              Đăng nhập để tiếp tục khám phá thế giới ẩm thực.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium animate-shake">
              ⚠️ {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                Email hoặc số điện thoại
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nhapemail@example.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition text-slate-800 text-sm bg-slate-50/50 focus:bg-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Mật khẩu
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition"
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
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition text-slate-800 text-sm bg-slate-50/50 focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500 focus:ring-offset-0"
                />
                <span className="ml-2 text-xs font-medium">
                  Ghi nhớ đăng nhập
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 active:scale-[0.99] transition transform duration-150 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? "Đang xử lý..." : "Đăng nhập"}
            </button>

            <p className="text-center text-xs text-slate-500 mt-6 pt-4 border-t border-slate-100">
              Chưa có tài khoản?{" "}
              <Link
                to="/register"
                className="font-bold text-orange-600 hover:text-orange-700 transition"
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
