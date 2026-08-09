import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, ChefHat, Eye, EyeOff, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { z } from "zod";
import { useAuth } from "../app/AuthContext";
import { useToast } from "../app/ToastContext";
import { Button, Field, Input } from "../components/ui";
import { api } from "../lib/api";
import { getErrorMessage } from "../lib/format";

const loginSchema = z.object({
  email: z.string().trim().email("Email không hợp lệ."),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự."),
  remember: z.boolean(),
});
type LoginValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: true },
  });

  if (user) return <Navigate to={user.role === "admin" ? "/admin/overview" : "/owner"} replace />;

  const submit = handleSubmit(async (values) => {
    setServerError("");
    try {
      const nextUser = await login(values);
      navigate(nextUser.role === "admin" ? "/admin/overview" : "/owner", { replace: true });
    } catch (error) {
      setServerError(getErrorMessage(error, "Đăng nhập thất bại."));
    }
  });

  return (
    <div className="auth-form-wrap">
      <div className="mobile-auth-brand"><ChefHat size={22} /><b>MămMăm</b><span>Console</span></div>
      <div className="auth-form-heading">
        <span className="eyebrow"><ShieldCheck size={14} /> Cổng quản trị bảo mật</span>
        <h2>Chào mừng trở lại</h2>
        <p>Đăng nhập bằng tài khoản Chủ nhà hàng hoặc Quản trị viên.</p>
      </div>
      {serverError && <div className="form-alert" role="alert">{serverError}</div>}
      <form onSubmit={submit} className="auth-form">
        <Field label="Email" required error={errors.email?.message}>
          <div className="input-icon-wrap"><Mail size={18} /><Input type="email" autoComplete="email" placeholder="owner@example.com" {...register("email")} /></div>
        </Field>
        <Field label="Mật khẩu" required error={errors.password?.message}>
          <div className="input-icon-wrap">
            <KeyRound size={18} />
            <Input type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Nhập mật khẩu" {...register("password")} />
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </div>
        </Field>
        <div className="auth-form-row">
          <label className="checkbox-label"><input type="checkbox" {...register("remember")} /> Ghi nhớ đăng nhập</label>
          <Link to="/forgot-password">Quên mật khẩu?</Link>
        </div>
        <Button type="submit" loading={isSubmitting} className="btn-block">Đăng nhập <ArrowRight size={17} /></Button>
      </form>
      <p className="auth-helper">Chưa có tài khoản chủ nhà hàng? <a href="http://localhost:5173/register">Đăng ký tại MămMăm</a></p>
    </div>
  );
}

const emailSchema = z.object({ email: z.string().trim().email("Email không hợp lệ.") });
type EmailValues = z.infer<typeof emailSchema>;

export function ForgotPasswordPage() {
  const toast = useToast();
  const [devToken, setDevToken] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EmailValues>({ resolver: zodResolver(emailSchema) });
  const submit = handleSubmit(async (values) => {
    try {
      const response = await api.post<{ message: string; resetToken?: string }>("/auth/forgot-password", values);
      setDevToken(response.data.resetToken ?? "");
      toast.success(response.data.message);
    } catch (error) { toast.error(getErrorMessage(error)); }
  });
  return (
    <div className="auth-form-wrap">
      <div className="auth-form-heading"><span className="eyebrow"><Mail size={14} /> Khôi phục tài khoản</span><h2>Quên mật khẩu?</h2><p>Nhập email để nhận mã xác thực đổi mật khẩu.</p></div>
      <form className="auth-form" onSubmit={submit}>
        <Field label="Email" required error={errors.email?.message}><Input type="email" autoFocus {...register("email")} /></Field>
        <Button type="submit" loading={isSubmitting} className="btn-block">Gửi mã xác thực</Button>
      </form>
      {devToken && <div className="dev-token"><b>Mã thử nghiệm:</b> {devToken}</div>}
      <div className="auth-links"><Link to="/reset-password">Tôi đã có mã</Link><Link to="/login">Quay lại đăng nhập</Link></div>
    </div>
  );
}

const resetSchema = z.object({
  email: z.string().trim().email("Email không hợp lệ."),
  token: z.string().min(4, "Mã xác thực không hợp lệ."),
  newPassword: z.string().min(8, "Mật khẩu mới cần ít nhất 8 ký tự."),
});
type ResetValues = z.infer<typeof resetSchema>;

export function ResetPasswordPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetValues>({ resolver: zodResolver(resetSchema) });
  const submit = handleSubmit(async (values) => {
    try {
      const response = await api.post<{ message: string }>("/auth/reset-password", values);
      toast.success(response.data.message);
      navigate("/login");
    } catch (error) { toast.error(getErrorMessage(error)); }
  });
  return (
    <div className="auth-form-wrap">
      <div className="auth-form-heading"><span className="eyebrow"><KeyRound size={14} /> Đặt lại mật khẩu</span><h2>Tạo mật khẩu mới</h2><p>Mã xác thực có hiệu lực trong 15 phút.</p></div>
      <form className="auth-form" onSubmit={submit}>
        <Field label="Email" required error={errors.email?.message}><Input type="email" {...register("email")} /></Field>
        <Field label="Mã xác thực" required error={errors.token?.message}><Input inputMode="numeric" {...register("token")} /></Field>
        <Field label="Mật khẩu mới" required error={errors.newPassword?.message}><Input type="password" autoComplete="new-password" {...register("newPassword")} /></Field>
        <Button type="submit" loading={isSubmitting} className="btn-block">Đổi mật khẩu</Button>
      </form>
      <div className="auth-links"><Link to="/forgot-password">Gửi lại mã</Link><Link to="/login">Quay lại đăng nhập</Link></div>
    </div>
  );
}

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [message, setMessage] = useState(token ? "Đang xác thực email..." : "Link xác thực không có token.");
  const [success, setSuccess] = useState(false);
  useEffect(() => {
    if (!token) return;
    void api.get<{ message: string }>("/auth/verify-email", { params: { token } })
      .then((response) => { setMessage(response.data.message); setSuccess(true); })
      .catch((error) => setMessage(getErrorMessage(error)));
  }, [token]);
  return (
    <div className="auth-form-wrap auth-result"><span className={`result-icon ${success ? "success" : ""}`}><Mail size={26} /></span><h2>{success ? "Xác thực thành công" : "Xác thực email"}</h2><p>{message}</p><Link className="btn btn-primary" to="/login">Đi đến đăng nhập</Link></div>
  );
}
