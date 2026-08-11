import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api";
import {
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  ArrowLeft,
} from "lucide-react";

export const ForgotPassword = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [demoToken, setDemoToken] = useState("");

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const res = await api.post("/auth/forgot-password", { email });
      setSuccess("Mã xác nhận đã được khởi tạo!");
      if (res.data.resetToken) {
        setDemoToken(res.data.resetToken);
        setToken(res.data.resetToken);
      }
      setStep(2);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Có lỗi xảy ra, vui lòng kiểm tra email.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu nhập lại không khớp.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.post("/auth/reset-password", {
        email,
        token,
        newPassword,
      });
      setSuccess(res.data.message || "Đặt lại mật khẩu thành công!");
    } catch (err: any) {
      setError(err.response?.data?.message || "Đặt lại mật khẩu thất bại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-slate-50/50 text-slate-800">
      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-slate-100">
        <Link
          to="/login"
          className="text-xs font-bold text-orange-600 hover:underline inline-flex items-center gap-1 mb-4"
        >
          <ArrowLeft className="w-3 h-3" />
          Quay lại đăng nhập
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span>{step === 1 ? "Quên mật khẩu" : "Đặt lại mật khẩu mới"}</span>
          <KeyRound className="w-5 h-5 text-orange-500" />
        </h1>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          {step === 1
            ? "Nhập địa chỉ email của bạn để nhận mã xác nhận."
            : "Nhập mã xác nhận (6 chữ số) và mật khẩu mới."}
        </p>

        {error && (
          <div className="p-4 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 mb-4 rounded-xl bg-green-50 border border-green-200 text-green-600 text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-green-500" />
            <span>{success}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestToken} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Email tài khoản
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition text-slate-800 text-sm bg-slate-50/50 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl shadow-sm transition text-sm disabled:opacity-70"
            >
              {isLoading ? "Đang gửi..." : "Gửi mã xác nhận"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {demoToken && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <b>Mã xác nhận (Demo/Test):</b>{" "}
                  <code className="text-orange-600 font-bold">{demoToken}</code>
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Mã xác nhận (OTP)
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="123456"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition text-slate-800 text-sm bg-slate-50/50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Mật khẩu mới
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition text-slate-800 text-sm bg-slate-50/50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Nhập lại mật khẩu mới
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition text-slate-800 text-sm bg-slate-50/50 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl shadow-sm transition text-sm disabled:opacity-70"
            >
              {isLoading ? "Đang cập nhật..." : "Đổi mật khẩu"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
};
