import type {
  ApprovalStatus,
  OperationStatus,
  OrderStatus,
  PaymentStatus,
  ReviewVisibility,
  UserRole,
  UserStatus,
} from "../types";

export const formatMoney = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value || 0);

export const formatNumber = (value: number) => new Intl.NumberFormat("vi-VN").format(value || 0);

export const formatDate = (value?: string | Date | null) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
};

export const formatDateTime = (value?: string | Date | null) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
};

export const toDateInput = (value?: string | Date | null) => {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

export const roleLabels: Record<UserRole, string> = {
  customer: "Khách hàng",
  restaurant_owner: "Chủ nhà hàng",
  admin: "Quản trị viên",
};

export const userStatusLabels: Record<UserStatus, string> = {
  active: "Hoạt động",
  locked: "Đã khóa",
  pending_verification: "Chờ xác thực",
};

export const approvalLabels: Record<ApprovalStatus, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Bị từ chối",
};

export const operationLabels: Record<OperationStatus, string> = {
  open: "Đang mở cửa",
  temporarily_closed: "Tạm đóng cửa",
  suspended: "Bị đình chỉ",
};

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  preparing: "Đang chuẩn bị",
  delivering: "Đang giao",
  delivered: "Hoàn tất",
  cancelled: "Đã hủy",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  unpaid: "Chưa thanh toán",
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  failed: "Thất bại",
  refunded: "Đã hoàn tiền",
};

export const reviewVisibilityLabels: Record<ReviewVisibility, string> = {
  visible: "Đang hiển thị",
  hidden: "Đã ẩn",
  flagged: "Cần kiểm duyệt",
};

export const getErrorMessage = (error: unknown, fallback = "Đã có lỗi xảy ra.") => {
  if (typeof error === "object" && error !== null) {
    const candidate = error as { response?: { data?: { message?: string } }; message?: string };
    return candidate.response?.data?.message ?? candidate.message ?? fallback;
  }
  return fallback;
};

export const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

export const readEntityId = (value: string | { _id: string }) => (typeof value === "string" ? value : value._id);
