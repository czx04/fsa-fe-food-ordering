import { zodResolver } from "@hookform/resolvers/zod";
import { CircleSlash2, Home, KeyRound, Mail, Phone, ShieldAlert, UserRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, Navigate } from "react-router";
import { z } from "zod";
import { useAuth } from "../app/AuthContext";
import { useToast } from "../app/ToastContext";
import { Button, Card, Field, Input, PageHeader } from "../components/ui";
import { RoleBadge, UserStatusBadge } from "../components/StatusBadge";
import { api } from "../lib/api";
import { formatDateTime, getErrorMessage, initials } from "../lib/format";
import type { User } from "../types";

const accountSchema = z.object({
  fullName: z.string().trim().min(2, "Họ tên cần ít nhất 2 ký tự."),
  phone: z.string().trim().regex(/^0\d{9,10}$/, "Số điện thoại không hợp lệ."),
  avatarUrl: z.union([z.literal(""), z.string().url("URL ảnh không hợp lệ.")]),
});
type AccountValues = z.infer<typeof accountSchema>;

export function AccountPage() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AccountValues>({
    resolver: zodResolver(accountSchema),
    values: { fullName: user?.fullName ?? "", phone: user?.phone ?? "", avatarUrl: user?.avatarUrl ?? "" },
  });
  const submit = handleSubmit(async (values) => {
    try {
      await api.patch<{ user: User }>("/users/me", values);
      await refreshUser();
      toast.success("Đã cập nhật hồ sơ tài khoản.");
    } catch (error) { toast.error(getErrorMessage(error)); }
  });
  if (!user) return null;
  return (
    <>
      <PageHeader title="Tài khoản của tôi" description="Quản lý thông tin nhận diện trong hệ thống." />
      <div className="account-grid">
        <Card className="account-summary">
          <span className="avatar avatar-large">{initials(user.fullName)}</span>
          <h2>{user.fullName}</h2><p>{user.email}</p>
          <div className="badge-row"><RoleBadge value={user.role} /><UserStatusBadge value={user.status} /></div>
          <dl className="summary-list">
            <div><dt><Mail size={16} /> Email</dt><dd>{user.email}</dd></div>
            <div><dt><Phone size={16} /> Điện thoại</dt><dd>{user.phone}</dd></div>
            <div><dt><KeyRound size={16} /> Đăng nhập gần nhất</dt><dd>{formatDateTime(user.lastLoginAt)}</dd></div>
          </dl>
        </Card>
        <Card>
          <div className="card-heading"><div><h2>Thông tin cá nhân</h2><p>Email và vai trò chỉ có thể thay đổi qua quản trị hệ thống.</p></div></div>
          <form className="form-grid" onSubmit={submit}>
            <Field label="Họ và tên" required error={errors.fullName?.message}><Input {...register("fullName")} /></Field>
            <Field label="Số điện thoại" required error={errors.phone?.message}><Input {...register("phone")} /></Field>
            <Field label="URL ảnh đại diện" error={errors.avatarUrl?.message}><Input placeholder="https://..." {...register("avatarUrl")} /></Field>
            <Field label="Email"><Input value={user.email} disabled /></Field>
            <div className="form-actions form-span"><Button type="submit" loading={isSubmitting}><UserRound size={17} /> Lưu thay đổi</Button></div>
          </form>
        </Card>
      </div>
    </>
  );
}

export function ForbiddenPage() {
  const { user } = useAuth();
  return <StandaloneState icon={ShieldAlert} title="Bạn không có quyền truy cập" description="Tài khoản hiện tại không được phép mở trang này." to={user?.role === "admin" ? "/admin/overview" : "/owner"} />;
}

export function NotFoundPage() {
  const { user } = useAuth();
  return <StandaloneState icon={CircleSlash2} title="Không tìm thấy trang" description="Đường dẫn có thể đã thay đổi hoặc không còn tồn tại." to={user?.role === "admin" ? "/admin/overview" : user ? "/owner" : "/login"} />;
}

function StandaloneState({ icon: Icon, title, description, to }: { icon: typeof Home; title: string; description: string; to: string }) {
  return (
    <main className="standalone-state"><span><Icon size={32} /></span><h1>{title}</h1><p>{description}</p><Link className="btn btn-primary" to={to}><Home size={17} /> Về trang chính</Link></main>
  );
}

export function RoleHomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user?.role === "admin" ? "/admin/overview" : "/owner"} replace />;
}
