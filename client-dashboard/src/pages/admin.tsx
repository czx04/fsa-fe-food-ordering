import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApexOptions } from "apexcharts";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  Eye,
  EyeOff,
  Lock,
  MessageSquareWarning,
  Pencil,
  Plus,
  ReceiptText,
  RefreshCcw,
  Save,
  ShieldAlert,
  ShoppingBag,
  Star,
  Store,
  Tags,
  TicketPercent,
  Trash2,
  Unlock,
  Users,
  Utensils,
  X,
} from "lucide-react";
import { lazy, Suspense, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams, useSearchParams } from "react-router";
import { z } from "zod";
import { useToast } from "../app/ToastContext";
import {
  ApprovalBadge,
  Badge,
  OperationBadge,
  OrderBadge,
  PaymentBadge,
  ReviewBadge,
  RoleBadge,
  UserStatusBadge,
} from "../components/StatusBadge";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LinkButton,
  Modal,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  SkeletonRows,
  Textarea,
} from "../components/ui";
import { api } from "../lib/api";
import { analyticsRange, formatAnalyticsPeriod, formatCompactMoney, type AnalyticsGranularity } from "../lib/analytics";
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatNumber,
  getErrorMessage,
  orderStatusLabels,
  roleLabels,
} from "../lib/format";
import { dashboardChartTheme } from "../lib/theme";
import type {
  AdminDashboard,
  AuditLog,
  Coupon,
  Cuisine,
  ListResponse,
  Order,
  OrderStatus,
  Restaurant,
  Review,
  ReviewVisibility,
  User,
} from "../types";

const AnalyticsChart = lazy(() => import("../components/AnalyticsChart"));

const setQueryValue = (params: URLSearchParams, setParams: (value: URLSearchParams) => void, key: string, value: string) => {
  const next = new URLSearchParams(params);
  if (value) next.set(key, value);
  else next.delete(key);
  if (key !== "page") next.set("page", "1");
  setParams(next);
};

export function AdminOverviewPage() {
  const [range, setRange] = useState("30");
  const dates = useMemo(() => {
    const to = new Date(); const from = new Date(); from.setDate(to.getDate() - (Number(range) - 1));
    return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
  }, [range]);
  const query = useQuery({ queryKey: ["admin", "dashboard", dates], queryFn: () => api.get<AdminDashboard>("/admin/dashboard", { params: dates }).then((response) => response.data) });
  if (query.isLoading) return <SkeletonRows count={7} />;
  if (query.isError || !query.data) return <ErrorState message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} />;
  const data = query.data;
  const chartOptions: ApexOptions = {
    chart: { toolbar: { show: false }, fontFamily: "inherit" }, colors: [dashboardChartTheme.primary, dashboardChartTheme.secondary], stroke: { curve: "smooth", width: [3, 2] }, dataLabels: { enabled: false },
    fill: { type: ["gradient", "solid"], gradient: { opacityFrom: 0.18, opacityTo: 0.02 } }, grid: { borderColor: dashboardChartTheme.grid, strokeDashArray: 4 },
    xaxis: { categories: data.chart.map((point) => formatDate(point.date)) }, yaxis: [{ labels: { formatter: (value) => `${Math.round(value / 1_000_000)}tr` } }, { opposite: true, labels: { formatter: (value) => Math.round(value).toString() } }],
    legend: { position: "top", horizontalAlign: "right" }, tooltip: { shared: true, y: { formatter: (value, options) => options.seriesIndex === 0 ? formatMoney(value) : `${formatNumber(value)} đơn` } },
  };
  return (
    <>
      <PageHeader title="Tổng quan nền tảng" description="Sức khỏe vận hành của toàn hệ thống MămMăm." actions={<Select value={range} onChange={(event) => setRange(event.target.value)}><option value="7">7 ngày qua</option><option value="30">30 ngày qua</option><option value="90">90 ngày qua</option></Select>} />
      <div className="metric-grid"><AdminMetric icon={CircleDollarSign} label="GMV đơn hoàn tất" value={formatMoney(data.metrics.gmv.current)} change={data.metrics.gmv.changePercent} /><AdminMetric icon={ShoppingBag} label="Tổng đơn hàng" value={formatNumber(data.metrics.orders.current)} change={data.metrics.orders.changePercent} /><AdminMetric icon={Users} label="Người dùng hoạt động" value={formatNumber(data.metrics.activeUsers)} /><AdminMetric icon={Store} label="Nhà hàng đã duyệt" value={formatNumber(data.metrics.approvedRestaurants)} /></div>
      <div className="attention-grid"><Link to="/admin/restaurants?approvalStatus=pending"><span className="attention-icon warning"><Clock3 size={20} /></span><div><b>{data.attention.pendingRestaurants}</b><p>Nhà hàng chờ duyệt</p></div><ArrowRight size={18} /></Link><Link to="/admin/reviews?visibilityStatus=flagged"><span className="attention-icon danger"><MessageSquareWarning size={20} /></span><div><b>{data.attention.flaggedReviews}</b><p>Đánh giá cần kiểm duyệt</p></div><ArrowRight size={18} /></Link><Link to="/admin/users?status=locked"><span className="attention-icon info"><Lock size={20} /></span><div><b>{data.attention.lockedUsers}</b><p>Tài khoản đang khóa</p></div><ArrowRight size={18} /></Link></div>
      <div className="dashboard-grid"><Card className="chart-card"><div className="card-heading"><div><h2>GMV và đơn hoàn tất</h2><p>Theo khoảng ngày đang chọn.</p></div></div><Suspense fallback={<SkeletonRows count={3} />}><AnalyticsChart options={chartOptions} series={[{ name: "GMV", type: "area", data: data.chart.map((point) => point.gmv) }, { name: "Đơn hàng", type: "line", data: data.chart.map((point) => point.orders) }]} /></Suspense></Card><Card><div className="card-heading"><div><h2>Top nhà hàng</h2><p>Xếp theo GMV đơn hoàn tất.</p></div></div><div className="rank-list">{data.topRestaurants.map((item, index) => <div key={item.restaurantId}><span>{index + 1}</span><div><b>{item.name}</b><small>{formatNumber(item.orders)} đơn · Hủy {item.cancellationRate.toFixed(1)}%</small></div><strong>{formatMoney(item.gmv)}</strong></div>)}</div></Card></div>
      <Card><div className="card-heading"><div><h2>Hồ sơ nhà hàng mới</h2><p>Những hồ sơ gần đây nhất trên hệ thống.</p></div><Link to="/admin/restaurants">Xem tất cả <ArrowRight size={15} /></Link></div><RestaurantsTable restaurants={data.recentRestaurants} /></Card>
    </>
  );
}

function AdminMetric({ icon: Icon, label, value, change }: { icon: typeof Store; label: string; value: string; change?: number | null }) {
  return <Card className="metric-card"><span className="metric-icon"><Icon size={21} /></span><div><p>{label}</p><strong>{value}</strong></div>{change !== undefined && change !== null && <span className={`metric-change ${change >= 0 ? "positive" : "negative"}`}>{change >= 0 ? "+" : ""}{change.toFixed(1)}% <small>so với kỳ trước</small></span>}</Card>;
}

function RestaurantsTable({ restaurants }: { restaurants: Restaurant[] }) {
  if (!restaurants.length) return <EmptyState icon={Store} title="Chưa có nhà hàng" description="Không có hồ sơ phù hợp với bộ lọc." />;
  return <div className="table-wrap"><table><thead><tr><th>Nhà hàng</th><th>Chủ sở hữu</th><th>Khu vực</th><th>Phê duyệt</th><th>Vận hành</th><th>Ngày tạo</th><th /></tr></thead><tbody>{restaurants.map((restaurant) => { const owner = typeof restaurant.ownerId === "string" ? null : restaurant.ownerId; return <tr key={restaurant._id}><td><div className="entity-cell">{restaurant.logoUrl ? <img src={restaurant.logoUrl} alt="" /> : <span><Store size={17} /></span>}<div><b>{restaurant.name}</b><small>{restaurant.slug}</small></div></div></td><td><b>{owner?.fullName ?? "—"}</b><small>{owner?.email}</small></td><td>{restaurant.address.district}<small>{restaurant.address.city}</small></td><td><ApprovalBadge value={restaurant.approvalStatus} /></td><td><OperationBadge value={restaurant.operationStatus} /></td><td>{formatDate(restaurant.createdAt)}</td><td><Link className="table-action" to={`/admin/restaurants/${restaurant._id}`}><Eye size={17} /></Link></td></tr>; })}</tbody></table></div>;
}

export function AdminRestaurantsPage() {
  const [params, setParams] = useSearchParams();
  const query = useQuery({ queryKey: ["admin", "restaurants", Object.fromEntries(params)], queryFn: () => api.get<ListResponse<Restaurant>>("/admin/restaurants", { params: Object.fromEntries(params) }).then((response) => response.data) });
  return <><PageHeader title="Quản lý nhà hàng" description="Duyệt hồ sơ và giám sát trạng thái vận hành của đối tác." actions={<Button variant="secondary" onClick={() => void query.refetch()}><RefreshCcw size={16} /> Làm mới</Button>} /><Card><div className="filter-bar"><SearchInput value={params.get("search") ?? ""} onChange={(value) => setQueryValue(params, setParams, "search", value)} placeholder="Tên quán, chủ sở hữu, số điện thoại..." /><Select value={params.get("approvalStatus") ?? ""} onChange={(event) => setQueryValue(params, setParams, "approvalStatus", event.target.value)}><option value="">Mọi phê duyệt</option><option value="pending">Chờ duyệt</option><option value="approved">Đã duyệt</option><option value="rejected">Từ chối</option></Select><Select value={params.get("operationStatus") ?? ""} onChange={(event) => setQueryValue(params, setParams, "operationStatus", event.target.value)}><option value="">Mọi vận hành</option><option value="open">Đang mở</option><option value="temporarily_closed">Tạm đóng</option><option value="suspended">Đình chỉ</option></Select><Input placeholder="Thành phố" value={params.get("city") ?? ""} onChange={(event) => setQueryValue(params, setParams, "city", event.target.value)} /></div>{query.isLoading ? <SkeletonRows /> : query.isError ? <ErrorState message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : query.data ? <><RestaurantsTable restaurants={query.data.data} /><Pagination meta={query.data.meta} onPage={(page) => setQueryValue(params, setParams, "page", String(page))} /></> : null}</Card></>;
}

export function AdminRestaurantDetailPage() {
  const { restaurantId = "" } = useParams();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [decision, setDecision] = useState<"approved" | "rejected" | "suspended" | "unsuspended" | null>(null);
  const [reason, setReason] = useState("");
  const query = useQuery({ queryKey: ["admin", "restaurant", restaurantId], queryFn: () => api.get<{ restaurant: Restaurant; summary: { menuItems: number; orders: number; reviews: number } }>(`/admin/restaurants/${restaurantId}`).then((response) => response.data), enabled: Boolean(restaurantId) });
  const mutation = useMutation({
    mutationFn: async () => {
      if (!decision) return;
      if (decision === "approved" || decision === "rejected") await api.patch(`/admin/restaurants/${restaurantId}/approval`, { approvalStatus: decision, rejectionReason: decision === "rejected" ? reason : null });
      else await api.patch(`/admin/restaurants/${restaurantId}/operation-status`, { operationStatus: decision === "suspended" ? "suspended" : "temporarily_closed", reason });
    },
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["admin", "restaurant", restaurantId] }); await queryClient.invalidateQueries({ queryKey: ["admin", "restaurants"] }); toast.success("Đã cập nhật trạng thái nhà hàng."); setDecision(null); setReason(""); },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  if (query.isLoading) return <SkeletonRows count={7} />;
  if (query.isError || !query.data) return <ErrorState message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} />;
  const { restaurant, summary } = query.data; const owner = typeof restaurant.ownerId === "string" ? null : restaurant.ownerId;
  const needsReason = decision === "rejected" || decision === "suspended" || decision === "unsuspended";
  return <><PageHeader title={restaurant.name} description={`Hồ sơ tạo ngày ${formatDate(restaurant.createdAt)}`} actions={<LinkButton variant="secondary" to="/admin/restaurants"><ArrowLeft size={16} /> Danh sách</LinkButton>} />
    <div className="detail-hero"><div className="detail-cover" style={restaurant.coverUrl ? { backgroundImage: `url(${restaurant.coverUrl})` } : undefined}>{!restaurant.coverUrl && <Store size={34} />}</div><div><div className="badge-row"><ApprovalBadge value={restaurant.approvalStatus} /><OperationBadge value={restaurant.operationStatus} /></div><h2>{restaurant.name}</h2><p>{restaurant.description}</p><span>{restaurant.address.line1}, {restaurant.address.ward}, {restaurant.address.district}, {restaurant.address.city}</span></div><div className="detail-actions">{restaurant.approvalStatus !== "approved" && <Button onClick={() => setDecision("approved")}><Check size={16} /> Duyệt hồ sơ</Button>}{restaurant.approvalStatus !== "rejected" && <Button variant="danger" onClick={() => setDecision("rejected")}><X size={16} /> Từ chối</Button>}{restaurant.operationStatus === "suspended" ? <Button variant="secondary" onClick={() => setDecision("unsuspended")}><Unlock size={16} /> Gỡ đình chỉ</Button> : <Button variant="danger" onClick={() => setDecision("suspended")}><ShieldAlert size={16} /> Đình chỉ</Button>}</div></div>
    <div className="detail-summary-grid"><Card><span><ReceiptText size={18} /></span><div><b>{formatNumber(summary.orders)}</b><p>Tổng đơn hàng</p></div></Card><Card><span><Tags size={18} /></span><div><b>{formatNumber(summary.menuItems)}</b><p>Món trong thực đơn</p></div></Card><Card><span><Star size={18} /></span><div><b>{formatNumber(summary.reviews)}</b><p>Đánh giá</p></div></Card><Card><span><Users size={18} /></span><div><b>{restaurant.ratingSummary.average.toFixed(1)}</b><p>Điểm trung bình</p></div></Card></div>
    <div className="two-column"><Card><div className="card-heading"><div><h2>Thông tin nhà hàng</h2></div></div><dl className="detail-list"><div><dt>Điện thoại</dt><dd>{restaurant.phone}</dd></div><div><dt>Phân khúc</dt><dd>{restaurant.priceRange}</dd></div><div><dt>Loại ẩm thực</dt><dd>{restaurant.cuisineCategoryIds.map((item) => item.name).join(", ") || "—"}</dd></div><div><dt>Giao hàng</dt><dd>{formatMoney(restaurant.delivery.fee)} · {restaurant.delivery.minMinutes}–{restaurant.delivery.maxMinutes} phút</dd></div><div><dt>Bán kính</dt><dd>{restaurant.delivery.maxDistanceKm ?? "—"} km</dd></div></dl></Card><Card><div className="card-heading"><div><h2>Chủ sở hữu</h2></div></div><dl className="detail-list"><div><dt>Họ tên</dt><dd>{owner?.fullName ?? "—"}</dd></div><div><dt>Email</dt><dd>{owner?.email ?? "—"}</dd></div><div><dt>Điện thoại</dt><dd>{owner?.phone ?? "—"}</dd></div><div><dt>Trạng thái</dt><dd>{owner && <UserStatusBadge value={owner.status} />}</dd></div></dl>{owner && <LinkButton variant="secondary" to={`/admin/users/${owner._id}`}>Xem tài khoản</LinkButton>}</Card></div>
    <Modal open={Boolean(decision)} title={decision === "approved" ? "Duyệt hồ sơ nhà hàng?" : decision === "rejected" ? "Từ chối hồ sơ?" : decision === "suspended" ? "Đình chỉ nhà hàng?" : "Gỡ đình chỉ?"} description="Thao tác sẽ được ghi vào nhật ký hệ thống." onClose={() => { setDecision(null); setReason(""); }}><div className="modal-body">{needsReason && <Field label="Lý do" required><Textarea rows={4} value={reason} onChange={(event) => setReason(event.target.value)} /></Field>}</div><div className="modal-actions"><Button variant="secondary" onClick={() => setDecision(null)}>Hủy</Button><Button variant={decision === "approved" || decision === "unsuspended" ? "primary" : "danger"} disabled={needsReason && reason.trim().length < 3} loading={mutation.isPending} onClick={() => mutation.mutate()}>Xác nhận</Button></div></Modal>
  </>;
}

function UsersTable({ users }: { users: User[] }) {
  if (!users.length) return <EmptyState icon={Users} title="Không có người dùng" description="Không có tài khoản phù hợp với bộ lọc." />;
  return <div className="table-wrap"><table><thead><tr><th>Người dùng</th><th>Vai trò</th><th>Trạng thái</th><th>Điện thoại</th><th>Đăng nhập gần nhất</th><th>Ngày tạo</th><th /></tr></thead><tbody>{users.map((user) => <tr key={user._id}><td><div className="entity-cell"><span className="avatar">{user.fullName.charAt(0)}</span><div><b>{user.fullName}</b><small>{user.email}</small></div></div></td><td><RoleBadge value={user.role} /></td><td><UserStatusBadge value={user.status} /></td><td>{user.phone}</td><td>{formatDateTime(user.lastLoginAt)}</td><td>{formatDate(user.createdAt)}</td><td><Link className="table-action" to={`/admin/users/${user._id}`}><Eye size={17} /></Link></td></tr>)}</tbody></table></div>;
}

export function AdminUsersPage() {
  const [params, setParams] = useSearchParams();
  const query = useQuery({ queryKey: ["admin", "users", Object.fromEntries(params)], queryFn: () => api.get<ListResponse<User>>("/admin/users", { params: Object.fromEntries(params) }).then((response) => response.data) });
  return <><PageHeader title="Quản lý người dùng" description="Tra cứu và kiểm soát trạng thái tài khoản toàn hệ thống." /><Card><div className="filter-bar"><SearchInput value={params.get("search") ?? ""} onChange={(value) => setQueryValue(params, setParams, "search", value)} placeholder="Tên, email hoặc số điện thoại..." /><Select value={params.get("role") ?? ""} onChange={(event) => setQueryValue(params, setParams, "role", event.target.value)}><option value="">Mọi vai trò</option><option value="customer">Khách hàng</option><option value="restaurant_owner">Chủ nhà hàng</option><option value="admin">Quản trị viên</option></Select><Select value={params.get("status") ?? ""} onChange={(event) => setQueryValue(params, setParams, "status", event.target.value)}><option value="">Mọi trạng thái</option><option value="active">Hoạt động</option><option value="locked">Đã khóa</option><option value="pending_verification">Chờ xác thực</option></Select></div>{query.isLoading ? <SkeletonRows /> : query.isError ? <ErrorState message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : query.data ? <><UsersTable users={query.data.data} /><Pagination meta={query.data.meta} onPage={(page) => setQueryValue(params, setParams, "page", String(page))} /></> : null}</Card></>;
}

export function AdminUserDetailPage() {
  const { userId = "" } = useParams();
  const queryClient = useQueryClient(); const toast = useToast(); const [statusAction, setStatusAction] = useState<"locked" | "active" | null>(null); const [reason, setReason] = useState("");
  const query = useQuery({ queryKey: ["admin", "user", userId], queryFn: () => api.get<{ user: User; restaurants: Restaurant[]; orderSummary: { count: number; total: number } }>(`/admin/users/${userId}`).then((response) => response.data), enabled: Boolean(userId) });
  const statusMutation = useMutation({ mutationFn: () => api.patch(`/admin/users/${userId}/status`, { status: statusAction, reason }), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["admin", "user", userId] }); toast.success("Đã cập nhật trạng thái tài khoản."); setStatusAction(null); setReason(""); }, onError: (error) => toast.error(getErrorMessage(error)) });
  const resetPassword = async () => { try { await api.post(`/admin/users/${userId}/password-reset`); toast.success("Đã khởi tạo yêu cầu đặt lại mật khẩu."); } catch (error) { toast.error(getErrorMessage(error)); } };
  if (query.isLoading) return <SkeletonRows count={5} />; if (query.isError || !query.data) return <ErrorState message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} />;
  const { user, restaurants, orderSummary } = query.data;
  return <><PageHeader title={user.fullName} description={user.email} actions={<LinkButton variant="secondary" to="/admin/users"><ArrowLeft size={16} /> Danh sách</LinkButton>} /><div className="account-grid"><Card className="account-summary"><span className="avatar avatar-large">{user.fullName.charAt(0)}</span><h2>{user.fullName}</h2><p>{user.email}</p><div className="badge-row"><RoleBadge value={user.role} /><UserStatusBadge value={user.status} /></div><div className="stack-actions"><Button variant="secondary" onClick={() => void resetPassword()}><RefreshCcw size={16} /> Gửi yêu cầu đổi mật khẩu</Button>{user.status === "locked" ? <Button onClick={() => setStatusAction("active")}><Unlock size={16} /> Mở khóa</Button> : <Button variant="danger" onClick={() => setStatusAction("locked")}><Lock size={16} /> Khóa tài khoản</Button>}</div></Card><div className="settings-stack"><Card><div className="card-heading"><div><h2>Thông tin tài khoản</h2></div></div><dl className="detail-list"><div><dt>Điện thoại</dt><dd>{user.phone}</dd></div><div><dt>Xác thực email</dt><dd>{formatDateTime(user.emailVerifiedAt)}</dd></div><div><dt>Đăng nhập gần nhất</dt><dd>{formatDateTime(user.lastLoginAt)}</dd></div><div><dt>Ngày tạo</dt><dd>{formatDateTime(user.createdAt)}</dd></div></dl></Card><div className="detail-summary-grid"><Card><span><Store size={18} /></span><div><b>{restaurants.length}</b><p>Nhà hàng sở hữu</p></div></Card><Card><span><ShoppingBag size={18} /></span><div><b>{formatNumber(orderSummary.count)}</b><p>Đơn đã đặt</p></div></Card><Card><span><CircleDollarSign size={18} /></span><div><b>{formatMoney(orderSummary.total)}</b><p>Tổng chi tiêu</p></div></Card></div>{restaurants.length > 0 && <Card><div className="card-heading"><div><h2>Nhà hàng sở hữu</h2></div></div><RestaurantsTable restaurants={restaurants} /></Card>}</div></div><Modal open={Boolean(statusAction)} title={statusAction === "locked" ? "Khóa tài khoản?" : "Mở khóa tài khoản?"} description="Thao tác được ghi vào nhật ký hệ thống." onClose={() => setStatusAction(null)}><div className="modal-body"><Field label="Lý do" required><Textarea rows={4} value={reason} onChange={(event) => setReason(event.target.value)} /></Field></div><div className="modal-actions"><Button variant="secondary" onClick={() => setStatusAction(null)}>Hủy</Button><Button variant={statusAction === "locked" ? "danger" : "primary"} disabled={reason.trim().length < 3} loading={statusMutation.isPending} onClick={() => statusMutation.mutate()}>Xác nhận</Button></div></Modal></>;
}

function AdminOrdersTable({ orders }: { orders: Order[] }) {
  if (!orders.length) return <EmptyState icon={ShoppingBag} title="Không có đơn hàng" description="Không có đơn phù hợp với bộ lọc hiện tại." />;
  return <div className="table-wrap"><table><thead><tr><th>Mã đơn</th><th>Nhà hàng</th><th>Khách hàng</th><th>Thời gian</th><th>Thanh toán</th><th>Trạng thái</th><th /></tr></thead><tbody>{orders.map((order) => <tr key={order._id}><td><b>#{order.orderNumber}</b><small>{formatMoney(order.pricing.grandTotal)}</small></td><td>{order.restaurantSnapshot.name}<small>{order.restaurantSnapshot.phone}</small></td><td>{order.customerSnapshot.fullName}<small>{order.customerSnapshot.phone}</small></td><td>{formatDateTime(order.placedAt)}</td><td><PaymentBadge value={order.paymentStatus} /><small>{order.paymentMethod.toUpperCase()}</small></td><td><OrderBadge value={order.orderStatus} /></td><td><Link className="table-action" to={`/admin/orders/${order._id}`}><Eye size={17} /></Link></td></tr>)}</tbody></table></div>;
}

export function AdminOrdersPage() {
  const [params, setParams] = useSearchParams();
  const query = useQuery({ queryKey: ["admin", "orders", Object.fromEntries(params)], queryFn: () => api.get<ListResponse<Order>>("/admin/orders", { params: Object.fromEntries(params) }).then((response) => response.data) });
  return <><PageHeader title="Giám sát đơn hàng" description="Tra cứu đơn hàng trên toàn bộ nền tảng. Chế độ mặc định chỉ đọc." /><Card><div className="filter-bar"><SearchInput value={params.get("search") ?? ""} onChange={(value) => setQueryValue(params, setParams, "search", value)} placeholder="Mã đơn, khách hàng, nhà hàng..." /><Select value={params.get("orderStatus") ?? ""} onChange={(event) => setQueryValue(params, setParams, "orderStatus", event.target.value)}><option value="">Mọi trạng thái</option>{Object.entries(orderStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select><Select value={params.get("paymentStatus") ?? ""} onChange={(event) => setQueryValue(params, setParams, "paymentStatus", event.target.value)}><option value="">Mọi thanh toán</option><option value="unpaid">Chưa thanh toán</option><option value="pending">Chờ thanh toán</option><option value="paid">Đã thanh toán</option><option value="failed">Thất bại</option><option value="refunded">Đã hoàn tiền</option></Select><Input type="date" value={params.get("from") ?? ""} onChange={(event) => setQueryValue(params, setParams, "from", event.target.value)} /><Input type="date" value={params.get("to") ?? ""} onChange={(event) => setQueryValue(params, setParams, "to", event.target.value)} /></div>{query.isLoading ? <SkeletonRows /> : query.isError ? <ErrorState message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : query.data ? <><AdminOrdersTable orders={query.data.data} /><Pagination meta={query.data.meta} onPage={(page) => setQueryValue(params, setParams, "page", String(page))} /></> : null}</Card></>;
}

export function AdminOrderDetailPage() {
  const { orderId = "" } = useParams();
  const query = useQuery({ queryKey: ["admin", "order", orderId], queryFn: () => api.get<{ order: Order }>(`/admin/orders/${orderId}`).then((response) => response.data.order), enabled: Boolean(orderId) });
  if (query.isLoading) return <SkeletonRows count={6} />; if (query.isError || !query.data) return <ErrorState message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} />;
  const order = query.data;
  return <><PageHeader title={`Đơn hàng #${order.orderNumber}`} description={`Đặt lúc ${formatDateTime(order.placedAt)} · Chế độ giám sát`} actions={<LinkButton variant="secondary" to="/admin/orders"><ArrowLeft size={16} /> Danh sách</LinkButton>} /><div className="inline-alert info"><b>Chế độ chỉ đọc.</b> Dashboard chưa mở override trạng thái hoặc hoàn tiền khi chưa có policy và contract payment tương ứng.</div><div className="order-detail-layout"><div className="order-detail-main"><Card><div className="card-heading"><div><h2>Timeline trạng thái</h2></div><OrderBadge value={order.orderStatus} /></div><div className="order-timeline">{order.statusHistory.map((entry, index) => <div key={`${entry.changedAt}-${index}`}><span><Check size={14} /></span><div><b>{orderStatusLabels[entry.to as OrderStatus] ?? entry.to}</b><small>{formatDateTime(entry.changedAt)} · {entry.changedByRole}</small>{entry.reason && <p>{entry.reason}</p>}</div></div>)}</div></Card><Card><div className="card-heading"><div><h2>Món đã đặt</h2></div></div><div className="order-items">{order.items.map((item, index) => <div key={`${item.menuItemId}-${index}`}><span className="item-placeholder"><ReceiptText size={18} /></span><div><b>{item.quantity} × {item.name}</b>{item.selectedOptions.map((option) => <small key={`${option.groupName}-${option.optionName}`}>{option.groupName}: {option.optionName}</small>)}</div><strong>{formatMoney(item.lineTotal)}</strong></div>)}</div></Card><Card><div className="card-heading"><div><h2>Giao hàng</h2></div></div><dl className="detail-list"><div><dt>Người nhận</dt><dd>{order.recipient.fullName}</dd></div><div><dt>Điện thoại</dt><dd>{order.recipient.phone}</dd></div><div><dt>Địa chỉ</dt><dd>{order.recipient.addressText}</dd></div></dl></Card></div><aside className="order-detail-side"><Card><div className="card-heading"><div><h2>Thanh toán</h2></div><PaymentBadge value={order.paymentStatus} /></div><dl className="pricing-list"><div><dt>Tạm tính</dt><dd>{formatMoney(order.pricing.subtotal)}</dd></div><div><dt>Phí giao hàng</dt><dd>{formatMoney(order.pricing.deliveryFee)}</dd></div><div><dt>Giảm giá</dt><dd>-{formatMoney(order.pricing.discountAmount)}</dd></div><div className="pricing-total"><dt>Tổng cộng</dt><dd>{formatMoney(order.pricing.grandTotal)}</dd></div></dl></Card><Card><div className="card-heading"><div><h2>Nhà hàng</h2></div></div><b>{order.restaurantSnapshot.name}</b><p>{order.restaurantSnapshot.addressText}</p><small>{order.restaurantSnapshot.phone}</small></Card><Card><div className="card-heading"><div><h2>Khách hàng</h2></div></div><b>{order.customerSnapshot.fullName}</b><p>{order.customerSnapshot.email}</p><small>{order.customerSnapshot.phone}</small></Card></aside></div></>;
}

const cuisineSchema = z.object({ name: z.string().trim().min(2, "Tên cần ít nhất 2 ký tự."), description: z.string().trim(), imageUrl: z.union([z.literal(""), z.string().url("URL không hợp lệ.")]), isActive: z.boolean() });
type CuisineValues = z.infer<typeof cuisineSchema>;

export function AdminCuisinesPage() {
  const queryClient = useQueryClient(); const toast = useToast(); const [active, setActive] = useState<Cuisine | "new" | null>(null); const [deleteCuisine, setDeleteCuisine] = useState<Cuisine | null>(null);
  const query = useQuery({ queryKey: ["admin", "cuisines"], queryFn: () => api.get<{ data: Cuisine[] }>("/admin/cuisines").then((response) => response.data.data) });
  const removeMutation = useMutation({ mutationFn: (id: string) => api.delete(`/admin/cuisines/${id}`), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["admin", "cuisines"] }); toast.success("Đã xóa danh mục."); setDeleteCuisine(null); }, onError: (error) => toast.error(getErrorMessage(error)) });
  return <><PageHeader title="Danh mục ẩm thực" description="Quản lý nhóm ẩm thực dùng để phân loại nhà hàng." actions={<Button onClick={() => setActive("new")}><Plus size={16} /> Thêm danh mục</Button>} /><Card>{query.isLoading ? <SkeletonRows /> : query.isError ? <ErrorState message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : !query.data?.length ? <EmptyState icon={Tags} title="Chưa có danh mục" description="Tạo danh mục đầu tiên cho nền tảng." /> : <div className="table-wrap"><table><thead><tr><th>Thứ tự</th><th>Danh mục</th><th>Slug</th><th>Nhà hàng</th><th>Trạng thái</th><th /></tr></thead><tbody>{query.data.map((cuisine) => <tr key={cuisine._id}><td>{cuisine.displayOrder}</td><td><div className="entity-cell">{cuisine.imageUrl ? <img src={cuisine.imageUrl} alt="" /> : <span><Tags size={17} /></span>}<div><b>{cuisine.name}</b><small>{cuisine.description}</small></div></div></td><td><code>{cuisine.slug}</code></td><td>{formatNumber(cuisine.restaurantCount ?? 0)}</td><td><Badge value={cuisine.isActive ? "active" : "hidden"}>{cuisine.isActive ? "Đang hoạt động" : "Đã tắt"}</Badge></td><td><div className="row-actions"><button className="icon-button" onClick={() => setActive(cuisine)}><Pencil size={16} /></button><button className="icon-button danger" onClick={() => setDeleteCuisine(cuisine)}><Trash2 size={16} /></button></div></td></tr>)}</tbody></table></div>}</Card><CuisineModal cuisine={active} onClose={() => setActive(null)} /><Modal open={Boolean(deleteCuisine)} title="Xóa danh mục ẩm thực?" description="Không thể xóa khi danh mục đang được nhà hàng sử dụng." onClose={() => setDeleteCuisine(null)}><div className="modal-actions"><Button variant="secondary" onClick={() => setDeleteCuisine(null)}>Hủy</Button><Button variant="danger" loading={removeMutation.isPending} onClick={() => deleteCuisine && removeMutation.mutate(deleteCuisine._id)}>Xác nhận xóa</Button></div></Modal></>;
}

function CuisineModal({ cuisine, onClose }: { cuisine: Cuisine | "new" | null; onClose: () => void }) {
  const queryClient = useQueryClient(); const toast = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CuisineValues>({ resolver: zodResolver(cuisineSchema), values: { name: cuisine && cuisine !== "new" ? cuisine.name : "", description: cuisine && cuisine !== "new" ? cuisine.description ?? "" : "", imageUrl: cuisine && cuisine !== "new" ? cuisine.imageUrl ?? "" : "", isActive: cuisine && cuisine !== "new" ? cuisine.isActive : true } });
  const submit = handleSubmit(async (values) => { try { if (cuisine && cuisine !== "new") await api.patch(`/admin/cuisines/${cuisine._id}`, values); else await api.post("/admin/cuisines", values); await queryClient.invalidateQueries({ queryKey: ["admin", "cuisines"] }); toast.success("Đã lưu danh mục ẩm thực."); onClose(); } catch (error) { toast.error(getErrorMessage(error)); } });
  return <Modal open={Boolean(cuisine)} title={cuisine === "new" ? "Thêm danh mục ẩm thực" : "Chỉnh sửa danh mục"} onClose={onClose}><form onSubmit={(event) => void submit(event)}><div className="modal-body"><Field label="Tên danh mục" required error={errors.name?.message}><Input {...register("name")} /></Field><Field label="Mô tả"><Textarea rows={3} {...register("description")} /></Field><Field label="URL hình ảnh" error={errors.imageUrl?.message}><Input {...register("imageUrl")} /></Field><label className="checkbox-label"><input type="checkbox" {...register("isActive")} /> Đang hoạt động</label></div><div className="modal-actions"><Button type="button" variant="secondary" onClick={onClose}>Hủy</Button><Button type="submit" loading={isSubmitting}><Save size={16} /> Lưu</Button></div></form></Modal>;
}

const couponSchema = z.object({ code: z.string().trim().min(3).max(30), discountType: z.enum(["percentage", "fixed"]), discountValue: z.number().positive("Giá trị phải lớn hơn 0."), minOrderAmount: z.number().min(0), maxDiscountAmount: z.union([z.literal(""), z.number().min(0)]), startsAt: z.string().min(1), endsAt: z.string().min(1), status: z.enum(["active", "disabled"]) }).refine((values) => new Date(values.startsAt) < new Date(values.endsAt), { path: ["endsAt"], message: "Thời điểm kết thúc phải sau bắt đầu." }).refine((values) => values.discountType !== "percentage" || values.discountValue <= 100, { path: ["discountValue"], message: "Phần trăm không được vượt 100." });
type CouponValues = z.infer<typeof couponSchema>;

export function AdminCouponsPage() {
  const [params, setParams] = useSearchParams(); const [active, setActive] = useState<Coupon | "new" | null>(null); const queryClient = useQueryClient(); const toast = useToast();
  const query = useQuery({ queryKey: ["admin", "coupons", Object.fromEntries(params)], queryFn: () => api.get<ListResponse<Coupon>>("/admin/coupons", { params: Object.fromEntries(params) }).then((response) => response.data) });
  const statusMutation = useMutation({ mutationFn: ({ id, status }: { id: string; status: "active" | "disabled" }) => api.patch(`/admin/coupons/${id}/status`, { status }), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] }); toast.success("Đã cập nhật trạng thái coupon."); }, onError: (error) => toast.error(getErrorMessage(error)) });
  return <><PageHeader title="Mã giảm giá" description="Coupon hiện là chương trình toàn nền tảng do Admin quản lý." actions={<Button onClick={() => setActive("new")}><Plus size={16} /> Tạo mã giảm giá</Button>} /><Card><div className="filter-bar"><SearchInput value={params.get("search") ?? ""} onChange={(value) => setQueryValue(params, setParams, "search", value)} placeholder="Tìm mã coupon..." /><Select value={params.get("status") ?? ""} onChange={(event) => setQueryValue(params, setParams, "status", event.target.value)}><option value="">Mọi trạng thái</option><option value="active">Đang hoạt động</option><option value="disabled">Đã tắt</option><option value="expired">Hết hạn</option></Select></div>{query.isLoading ? <SkeletonRows /> : query.isError ? <ErrorState message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : !query.data?.data.length ? <EmptyState icon={TicketPercent} title="Chưa có mã giảm giá" description="Tạo chương trình đầu tiên cho khách hàng." /> : <><div className="table-wrap"><table><thead><tr><th>Mã</th><th>Ưu đãi</th><th>Điều kiện</th><th>Thời gian</th><th>Sử dụng</th><th>Trạng thái</th><th /></tr></thead><tbody>{query.data.data.map((coupon) => { const derivedStatus = new Date(coupon.endsAt) < new Date() ? "expired" : coupon.status; return <tr key={coupon._id}><td><code className="coupon-code">{coupon.code}</code></td><td><b>{coupon.discountType === "percentage" ? `${coupon.discountValue}%` : formatMoney(coupon.discountValue)}</b>{coupon.maxDiscountAmount && <small>Tối đa {formatMoney(coupon.maxDiscountAmount)}</small>}</td><td>Đơn từ {formatMoney(coupon.minOrderAmount)}</td><td>{formatDate(coupon.startsAt)}<small>đến {formatDate(coupon.endsAt)}</small></td><td>{formatNumber(coupon.usageCount ?? 0)} lượt<small>{formatMoney(coupon.totalDiscount ?? 0)}</small></td><td><Badge value={derivedStatus === "active" ? "active" : derivedStatus === "expired" ? "neutral" : "hidden"}>{derivedStatus === "active" ? "Đang hoạt động" : derivedStatus === "expired" ? "Hết hạn" : "Đã tắt"}</Badge></td><td><div className="row-actions"><button className="icon-button" onClick={() => setActive(coupon)}><Pencil size={16} /></button>{derivedStatus !== "expired" && <button className="icon-button" onClick={() => statusMutation.mutate({ id: coupon._id, status: coupon.status === "active" ? "disabled" : "active" })}>{coupon.status === "active" ? <EyeOff size={16} /> : <Eye size={16} />}</button>}</div></td></tr>; })}</tbody></table></div><Pagination meta={query.data.meta} onPage={(page) => setQueryValue(params, setParams, "page", String(page))} /></>}</Card><CouponModal coupon={active} onClose={() => setActive(null)} /></>;
}

function CouponModal({ coupon, onClose }: { coupon: Coupon | "new" | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const toLocal = (value?: string) => value ? new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60_000).toISOString().slice(0, 16) : "";
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<CouponValues>({ resolver: zodResolver(couponSchema), values: { code: coupon && coupon !== "new" ? coupon.code : "", discountType: coupon && coupon !== "new" ? coupon.discountType : "percentage", discountValue: coupon && coupon !== "new" ? coupon.discountValue : 10, minOrderAmount: coupon && coupon !== "new" ? coupon.minOrderAmount : 0, maxDiscountAmount: coupon && coupon !== "new" ? coupon.maxDiscountAmount ?? "" : "", startsAt: coupon && coupon !== "new" ? toLocal(coupon.startsAt) : "", endsAt: coupon && coupon !== "new" ? toLocal(coupon.endsAt) : "", status: coupon && coupon !== "new" && coupon.status !== "expired" ? coupon.status : "active" } });
  const discountType = watch("discountType");
  const submit = handleSubmit(async (values) => { try { const payload = { ...values, code: values.code.toUpperCase(), maxDiscountAmount: values.maxDiscountAmount === "" ? null : values.maxDiscountAmount, startsAt: new Date(values.startsAt).toISOString(), endsAt: new Date(values.endsAt).toISOString() }; if (coupon && coupon !== "new") await api.patch(`/admin/coupons/${coupon._id}`, payload); else await api.post("/admin/coupons", payload); await queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] }); toast.success("Đã lưu mã giảm giá."); onClose(); } catch (error) { toast.error(getErrorMessage(error)); } });
  const title = coupon && coupon !== "new" ? `Chỉnh sửa ${coupon.code}` : "Tạo mã giảm giá";
  return (
    <Modal open={Boolean(coupon)} title={title} onClose={onClose}>
      <form onSubmit={(event) => void submit(event)}>
        <div className="modal-body form-grid">
          <Field label="Mã coupon" required error={errors.code?.message}><Input className="uppercase" {...register("code")} /></Field>
          <Field label="Loại giảm" required><Select {...register("discountType")}><option value="percentage">Phần trăm</option><option value="fixed">Số tiền cố định</option></Select></Field>
          <Field label={discountType === "percentage" ? "Phần trăm giảm" : "Số tiền giảm"} required error={errors.discountValue?.message}><Input type="number" min={0} {...register("discountValue", { valueAsNumber: true })} /></Field>
          <Field label="Giá trị đơn tối thiểu" error={errors.minOrderAmount?.message}><Input type="number" min={0} {...register("minOrderAmount", { valueAsNumber: true })} /></Field>
          <Field label="Giảm tối đa" error={errors.maxDiscountAmount?.message as string | undefined}><Input type="number" min={0} {...register("maxDiscountAmount", { setValueAs: (value: string) => value === "" ? "" : Number(value) })} /></Field>
          <Field label="Trạng thái"><Select {...register("status")}><option value="active">Hoạt động</option><option value="disabled">Tắt</option></Select></Field>
          <Field label="Bắt đầu" required error={errors.startsAt?.message}><Input type="datetime-local" {...register("startsAt")} /></Field>
          <Field label="Kết thúc" required error={errors.endsAt?.message}><Input type="datetime-local" {...register("endsAt")} /></Field>
        </div>
        <div className="modal-actions"><Button type="button" variant="secondary" onClick={onClose}>Hủy</Button><Button type="submit" loading={isSubmitting}><Save size={16} /> Lưu coupon</Button></div>
      </form>
    </Modal>
  );
}

export function AdminReviewsPage() {
  const [params, setParams] = useSearchParams(); const [active, setActive] = useState<Review | null>(null); const [nextVisibility, setNextVisibility] = useState<ReviewVisibility>("hidden"); const [reason, setReason] = useState(""); const queryClient = useQueryClient(); const toast = useToast();
  const query = useQuery({ queryKey: ["admin", "reviews", Object.fromEntries(params)], queryFn: () => api.get<ListResponse<Review>>("/admin/reviews", { params: Object.fromEntries(params) }).then((response) => response.data) });
  const mutation = useMutation({ mutationFn: async () => { if (active) await api.patch(`/admin/reviews/${active._id}/visibility`, { visibilityStatus: nextVisibility, reason }); }, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] }); toast.success("Đã cập nhật trạng thái đánh giá."); setActive(null); setReason(""); }, onError: (error) => toast.error(getErrorMessage(error)) });
  const moderate = (review: Review, visibility: ReviewVisibility) => { setActive(review); setNextVisibility(visibility); setReason(""); };
  return <><PageHeader title="Kiểm duyệt đánh giá" description="Ẩn hoặc khôi phục hiển thị mà không chỉnh sửa nội dung người dùng." /><Card><div className="filter-bar"><SearchInput value={params.get("search") ?? ""} onChange={(value) => setQueryValue(params, setParams, "search", value)} placeholder="Nội dung, nhà hàng, khách hàng..." /><Select value={params.get("visibilityStatus") ?? ""} onChange={(event) => setQueryValue(params, setParams, "visibilityStatus", event.target.value)}><option value="">Mọi trạng thái</option><option value="flagged">Cần kiểm duyệt</option><option value="visible">Đang hiển thị</option><option value="hidden">Đã ẩn</option></Select><Select value={params.get("rating") ?? ""} onChange={(event) => setQueryValue(params, setParams, "rating", event.target.value)}><option value="">Mọi số sao</option>{[1, 2, 3, 4, 5].map((rating) => <option value={rating} key={rating}>{rating} sao</option>)}</Select></div>{query.isLoading ? <SkeletonRows /> : query.isError ? <ErrorState message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : !query.data?.data.length ? <EmptyState icon={MessageSquareWarning} title="Không có đánh giá" description="Hàng đợi kiểm duyệt hiện đang trống." /> : <><div className="review-list admin-review-list">{query.data.data.map((review) => { const restaurant = typeof review.restaurantId === "string" ? null : review.restaurantId; const customer = typeof review.customerId === "string" ? null : review.customerId; return <article className="review-card" key={review._id}><div className="review-head"><div className="avatar">{customer?.fullName.charAt(0) ?? "K"}</div><div><b>{customer?.fullName ?? "Khách hàng"}</b><span className="stars">{Array.from({ length: 5 }, (_, index) => <Star size={15} key={index} fill={index < review.rating ? "currentColor" : "none"} />)}</span><small>{restaurant?.name ?? "Nhà hàng"} · {formatDateTime(review.createdAt)}</small></div><ReviewBadge value={review.visibilityStatus} /></div><p className="review-content">{review.content}</p><div className="review-actions">{review.visibilityStatus !== "visible" && <Button onClick={() => moderate(review, "visible")}><Eye size={16} /> Cho hiển thị</Button>}{review.visibilityStatus !== "hidden" && <Button variant="danger" onClick={() => moderate(review, "hidden")}><EyeOff size={16} /> Ẩn đánh giá</Button>}{review.visibilityStatus !== "flagged" && <Button variant="secondary" onClick={() => moderate(review, "flagged")}><ShieldAlert size={16} /> Đánh dấu</Button>}</div></article>; })}</div><Pagination meta={query.data.meta} onPage={(page) => setQueryValue(params, setParams, "page", String(page))} /></>}</Card><Modal open={Boolean(active)} title="Xác nhận kiểm duyệt" description={`Chuyển đánh giá sang trạng thái “${nextVisibility}”.`} onClose={() => setActive(null)}><div className="modal-body"><Field label="Lý do" required><Textarea rows={4} value={reason} onChange={(event) => setReason(event.target.value)} /></Field></div><div className="modal-actions"><Button variant="secondary" onClick={() => setActive(null)}>Hủy</Button><Button variant={nextVisibility === "visible" ? "primary" : "danger"} disabled={reason.trim().length < 3} loading={mutation.isPending} onClick={() => mutation.mutate()}>Xác nhận</Button></div></Modal></>;
}

type AnalyticsGroup = "restaurant" | "category";

interface AnalyticsItem {
  itemId: string;
  name: string;
  quantity: number;
  revenue: number;
}

interface AnalyticsData {
  range: { from: string; to: string };
  granularity: AnalyticsGranularity;
  groupBy: AnalyticsGroup;
  metrics: {
    totalRevenue: number;
    totalOrders: number;
    deliveredOrders: number;
    topItem: AnalyticsItem | null;
  };
  trend: Array<{ period: string; revenue: number; orders: number }>;
  groupBreakdown: Array<{ label: string; orders: number; revenue: number; quantity: number }>;
  topItems: AnalyticsItem[];
}

export function AdminAnalyticsPage() {
  const [params, setParams] = useSearchParams(dateRangeDefaults());
  const query = useQuery({ queryKey: ["admin", "analytics", Object.fromEntries(params)], queryFn: () => api.get<AnalyticsData>("/admin/analytics", { params: Object.fromEntries(params) }).then((response) => response.data) });
  if (query.isLoading) return <SkeletonRows count={6} />;
  if (query.isError || !query.data) return <ErrorState message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} />;
  const data = query.data;
  const granularity = data.granularity;
  const groupLabel = data.groupBy === "restaurant" ? "nhà hàng" : "danh mục món ăn";
  const trendOptions: ApexOptions = {
    chart: { toolbar: { show: false }, fontFamily: "inherit", zoom: { enabled: false } },
    colors: [dashboardChartTheme.primary, dashboardChartTheme.secondary],
    stroke: { curve: "smooth", width: [3, 2] },
    fill: { type: ["gradient", "solid"], gradient: { opacityFrom: 0.18, opacityTo: 0.02 } },
    dataLabels: { enabled: false },
    grid: { borderColor: dashboardChartTheme.grid, strokeDashArray: 4 },
    xaxis: { categories: data.trend.map((item) => formatAnalyticsPeriod(item.period, granularity)), labels: { hideOverlappingLabels: true } },
    yaxis: [
      { labels: { formatter: (value) => formatCompactMoney(value) } },
      { opposite: true, labels: { formatter: (value) => formatNumber(Math.round(value)) } },
    ],
    legend: { position: "top", horizontalAlign: "right" },
    tooltip: { shared: true, y: { formatter: (value, options) => options.seriesIndex === 0 ? formatMoney(value) : `${formatNumber(value)} đơn` } },
  };
  const breakdownOptions: ApexOptions = {
    chart: { toolbar: { show: false }, fontFamily: "inherit" },
    colors: [dashboardChartTheme.primary],
    plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: "55%" } },
    dataLabels: { enabled: false },
    grid: { borderColor: dashboardChartTheme.grid, strokeDashArray: 4 },
    xaxis: {
      categories: data.groupBreakdown.map((item) => item.label),
      labels: { formatter: (value) => formatCompactMoney(Number(value)) },
    },
    tooltip: { y: { formatter: (value) => formatMoney(value) } },
  };

  const changeGranularity = (value: AnalyticsGranularity) => {
    const next = new URLSearchParams(params);
    const range = analyticsRange(value);
    next.set("granularity", value);
    next.set("from", range.from);
    next.set("to", range.to);
    setParams(next);
  };

  return (
    <>
      <PageHeader title="Phân tích nền tảng" description="Doanh thu, đơn hàng và món bán chạy từ dữ liệu đơn hàng thực tế." />

      <Card className="analytics-filter-card">
        <div className="analytics-filter-bar">
          <label className="analytics-filter-field">
            <span>Thống kê theo</span>
            <Select value={granularity} onChange={(event) => changeGranularity(event.target.value as AnalyticsGranularity)}>
              <option value="day">Ngày</option>
              <option value="month">Tháng</option>
              <option value="year">Năm</option>
            </Select>
          </label>
          <label className="analytics-filter-field">
            <span>Phân nhóm</span>
            <Select value={data.groupBy} onChange={(event) => setQueryValue(params, setParams, "groupBy", event.target.value)}>
              <option value="restaurant">Nhà hàng</option>
              <option value="category">Danh mục món ăn</option>
            </Select>
          </label>
          <label className="analytics-filter-field">
            <span>Từ ngày</span>
            <Input type="date" value={params.get("from") ?? ""} onChange={(event) => setQueryValue(params, setParams, "from", event.target.value)} />
          </label>
          <label className="analytics-filter-field">
            <span>Đến ngày</span>
            <Input type="date" value={params.get("to") ?? ""} onChange={(event) => setQueryValue(params, setParams, "to", event.target.value)} />
          </label>
        </div>
      </Card>

      <div className="metric-grid analytics-metric-grid">
        <AdminMetric icon={CircleDollarSign} label="Tổng doanh thu" value={formatMoney(data.metrics.totalRevenue)} />
        <AdminMetric icon={ShoppingBag} label="Tổng đơn hàng" value={formatNumber(data.metrics.totalOrders)} />
        <AdminMetric icon={Utensils} label="Món ăn bán chạy" value={data.metrics.topItem?.name ?? "Chưa có dữ liệu"} />
      </div>

      <div className="analytics-chart-grid">
        <Card className="chart-card">
          <div className="card-heading"><div><h2>Doanh thu và đơn hàng</h2><p>Thống kê theo {granularity === "day" ? "ngày" : granularity === "month" ? "tháng" : "năm"}.</p></div></div>
          {data.trend.length ? (
            <Suspense fallback={<SkeletonRows count={3} />}>
              <AnalyticsChart
                options={trendOptions}
                series={[
                  { name: "Doanh thu", type: "area", data: data.trend.map((item) => item.revenue) },
                  { name: "Đơn hàng", type: "line", data: data.trend.map((item) => item.orders) },
                ]}
                height={340}
              />
            </Suspense>
          ) : <EmptyState title="Chưa có dữ liệu" description="Không có đơn hàng trong khoảng thời gian đã chọn." />}
        </Card>

        <Card className="chart-card">
          <div className="card-heading"><div><h2>Doanh thu theo {groupLabel}</h2><p>Top 10 nhóm có doanh thu cao nhất.</p></div></div>
          {data.groupBreakdown.length ? (
            <Suspense fallback={<SkeletonRows count={3} />}>
              <AnalyticsChart
                options={breakdownOptions}
                series={[{ name: "Doanh thu", type: "bar", data: data.groupBreakdown.map((item) => item.revenue) }]}
                height={340}
              />
            </Suspense>
          ) : <EmptyState title="Chưa có dữ liệu" description={`Chưa có doanh thu theo ${groupLabel} trong kỳ này.`} />}
        </Card>
      </div>

      <Card>
        <div className="card-heading"><div><span className="section-icon"><ClipboardCheck size={18} /></span><h2>Món ăn bán chạy</h2><p>Xếp theo số lượng món trong đơn đã giao thành công.</p></div></div>
        {data.topItems.length ? (
          <div className="rank-list analytics-rank-list">
            {data.topItems.map((item, index) => (
              <div key={item.itemId}>
                <span>{index + 1}</span>
                <div><b>{item.name}</b><small>{formatNumber(item.quantity)} phần đã bán</small></div>
                <strong>{formatMoney(item.revenue)}</strong>
              </div>
            ))}
          </div>
        ) : <EmptyState icon={Utensils} title="Chưa có món bán chạy" description="Dữ liệu xuất hiện khi có đơn được giao thành công." />}
      </Card>
    </>
  );
}

function dateRangeDefaults() {
  return { ...analyticsRange("day"), granularity: "day", groupBy: "restaurant" };
}

export function AdminAuditLogsPage() {
  const [params, setParams] = useSearchParams();
  const query = useQuery({ queryKey: ["admin", "audit-logs", Object.fromEntries(params)], queryFn: () => api.get<ListResponse<AuditLog>>("/admin/audit-logs", { params: Object.fromEntries(params) }).then((response) => response.data) });
  return <><PageHeader title="Nhật ký hệ thống" description="Lịch sử các thao tác nhạy cảm của Owner và Admin." /><Card><div className="filter-bar"><SearchInput value={params.get("search") ?? ""} onChange={(value) => setQueryValue(params, setParams, "search", value)} placeholder="Action, entity hoặc lý do..." /><Select value={params.get("actorRole") ?? ""} onChange={(event) => setQueryValue(params, setParams, "actorRole", event.target.value)}><option value="">Mọi vai trò</option><option value="admin">Quản trị viên</option><option value="restaurant_owner">Chủ nhà hàng</option></Select><Input type="date" value={params.get("from") ?? ""} onChange={(event) => setQueryValue(params, setParams, "from", event.target.value)} /></div>{query.isLoading ? <SkeletonRows /> : query.isError ? <ErrorState message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : !query.data?.data.length ? <EmptyState icon={Clock3} title="Chưa có nhật ký" description="Các thao tác nhạy cảm sẽ xuất hiện tại đây." /> : <><div className="table-wrap"><table><thead><tr><th>Thời gian</th><th>Người thực hiện</th><th>Hành động</th><th>Đối tượng</th><th>Lý do</th><th>Địa chỉ IP</th></tr></thead><tbody>{query.data.data.map((log) => { const actor = typeof log.actorId === "string" ? null : log.actorId; return <tr key={log._id}><td>{formatDateTime(log.createdAt)}</td><td><b>{actor?.fullName ?? "Hệ thống"}</b><small>{roleLabels[log.actorRole]}</small></td><td><code>{log.action}</code></td><td>{log.entityType}<small>{log.entityId}</small></td><td>{log.reason || "—"}</td><td>{log.ip || "—"}</td></tr>; })}</tbody></table></div><Pagination meta={query.data.meta} onPage={(page) => setQueryValue(params, setParams, "page", String(page))} /></>}</Card></>;
}
