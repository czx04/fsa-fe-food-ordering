import { Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../utils/api";
import { DEFAULT_DISH_IMAGE_URL } from "../utils/constants";
import { AlertCircle } from "lucide-react";

const loginSchema = z.object({
  email: z.email("Email không hợp lệ."),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự."),
});

type LoginValues = z.infer<typeof loginSchema>;

export const Login = () => {
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "customer@foodordering.com",
      password: "password123",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const res = await api.post("/auth/login", values);
      login(res.data.accessToken, res.data.refreshToken, res.data.user);
    } catch (err: any) {
      setError("root", {
        message: err.response?.data?.message || "Đăng nhập thất bại",
      });
    }
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 bg-slate-50/50 text-slate-800">
      {/* Left Artwork Section */}
      <section className="hidden lg:flex flex-col justify-center p-12 bg-orange-500 text-white relative overflow-hidden min-h-[80vh]">
        {/* Center Content */}
        <div className="relative z-10 max-w-md mx-auto text-center py-8">
          <div className="relative inline-block mb-8 group">
            <img
              src={DEFAULT_DISH_IMAGE_URL}
              alt="Món ngon"
              className="relative w-72 h-72 object-cover rounded-3xl shadow-xl mx-auto border-4 border-white/20 transform group-hover:scale-[1.02] transition duration-300"
            />
          </div>
          <h2 className="text-3xl font-bold mb-3 tracking-tight">
            Món ngon luôn chờ bạn
          </h2>
          <p className="text-orange-100 text-base leading-relaxed">
            Hơn 1.000+ nhà hàng đối tác, hàng ngàn món ăn giao tận tay bạn chỉ
            trong vài phút.
          </p>
        </div>
      </section>

      {/* Right Form Section */}
      <section className="flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-8 bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-slate-100">
          {/* Header Mobile Brand */}
          <div>
            <Link
              to="/"
              className="lg:hidden text-2xl font-black text-orange-600 block mb-6"
            >
              MămMăm.
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Chào mừng trở lại!
            </h1>
            <p className="text-slate-500 text-sm mt-2">
              Đăng nhập để tiếp tục khám phá thế giới ẩm thực.
            </p>
          </div>

          {errors.root?.message && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.root.message}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={onSubmit}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                Email hoặc số điện thoại
              </label>
              <input
                type="text"
                {...register("email")}
                placeholder="nhapemail@example.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition text-slate-800 text-sm bg-slate-50/50 focus:bg-white"
              />
              {errors.email?.message && (
                <p className="mt-1 text-xs font-medium text-rose-600">
                  {errors.email.message}
                </p>
              )}
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
                {...register("password")}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition text-slate-800 text-sm bg-slate-50/50 focus:bg-white"
              />
              {errors.password?.message && (
                <p className="mt-1 text-xs font-medium text-rose-600">
                  {errors.password.message}
                </p>
              )}
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
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl shadow-sm transition text-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Đang xử lý..." : "Đăng nhập"}
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
