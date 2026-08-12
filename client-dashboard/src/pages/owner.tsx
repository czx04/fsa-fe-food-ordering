import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApexOptions } from "apexcharts";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  CircleDollarSign,
  CirclePlus,
  Clock3,
  Eye,
  MessageSquareReply,
  MoreHorizontal,
  PackageCheck,
  Pencil,
  Plus,
  RefreshCcw,
  Save,
  ShoppingBag,
  Star,
  Store,
  Trash2,
  TrendingDown,
  TrendingUp,
  Utensils,
  X,
} from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router";
import { z } from "zod";
import { useToast } from "../app/ToastContext";
import {
  ApprovalBadge,
  Badge,
  OperationBadge,
  OrderBadge,
  PaymentBadge,
  ReviewBadge,
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
  PageLoader,
  Pagination,
  SearchInput,
  Select,
  SkeletonRows,
  Textarea,
} from "../components/ui";
import { RestaurantForm } from "../features/RestaurantForm";
import { analyticsRange, formatAnalyticsPeriod, formatCompactMoney, type AnalyticsGranularity } from "../lib/analytics";
import { api } from "../lib/api";
import {
  formatDateTime,
  formatMoney,
  formatNumber,
  getErrorMessage,
  orderStatusLabels,
  readEntityId,
} from "../lib/format";
import { dashboardChartTheme } from "../lib/theme";
import type {
  ListResponse,
  MenuCategory,
  MenuItem,
  MenuOptionGroup,
  Order,
  OrderStatus,
  OwnerDashboard,
  Restaurant,
  Review,
} from "../types";

const AnalyticsChart = lazy(() => import("../components/AnalyticsChart"));

const getOwnerRestaurants = () => api.get<{ data: Restaurant[] }>("/owner/restaurants").then((response) => response.data.data);

export function OwnerHomePage() {
  const query = useQuery({ queryKey: ["owner", "restaurants"], queryFn: getOwnerRestaurants });
  if (query.isLoading) return <PageLoader />;
  if (query.isError) return <ErrorState message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} />;
  if (!query.data?.length) return <Navigate to="/owner/onboarding" replace />;
  const lastId = localStorage.getItem("dashboardLastRestaurant");
  const restaurant = query.data.find((item) => item._id === lastId) ?? query.data[0];
  return <Navigate to={`/owner/restaurants/${restaurant._id}/overview`} replace />;
}

export function OwnerRestaurantsPage() {
  const query = useQuery({ queryKey: ["owner", "restaurants"], queryFn: getOwnerRestaurants });
  return (
    <>
      <PageHeader title="Nhà hàng của tôi" description="Chọn một nhà hàng để bắt đầu vận hành hoặc nộp hồ sơ mới." actions={<LinkButton to="/owner/onboarding"><Plus size={17} /> Thêm nhà hàng</LinkButton>} />
      {query.isLoading ? <SkeletonRows count={4} /> : query.isError ? <ErrorState message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : !query.data?.length ? (
        <Card><EmptyState icon={Store} title="Bạn chưa có nhà hàng" description="Tạo hồ sơ đầu tiên để bắt đầu bán hàng trên MămMăm." action={<LinkButton to="/owner/onboarding">Tạo hồ sơ nhà hàng</LinkButton>} /></Card>
      ) : (
        <div className="restaurant-card-grid">
          {query.data.map((restaurant) => (
            <Card className="restaurant-card" key={restaurant._id}>
              <div className="restaurant-cover" style={restaurant.coverUrl ? { backgroundImage: `url(${restaurant.coverUrl})` } : undefined}>
                {!restaurant.coverUrl && <Store size={30} />}
                <div className="restaurant-cover-badges"><ApprovalBadge value={restaurant.approvalStatus} /><OperationBadge value={restaurant.operationStatus} /></div>
              </div>
              <div className="restaurant-card-body">
                <div><h2>{restaurant.name}</h2><p>{restaurant.address.district}, {restaurant.address.city}</p></div>
                {restaurant.approvalStatus === "rejected" && <div className="inline-alert danger"><b>Lý do từ chối:</b> {restaurant.rejectionReason || "Chưa có lý do."}</div>}
                <div className="restaurant-stats">
                  <span><Star size={15} /> <b>{restaurant.ratingSummary.average.toFixed(1)}</b> ({restaurant.ratingSummary.count})</span>
                  <span><PackageCheck size={15} /> <b>{formatNumber(restaurant.stats.completedOrderCount)}</b> đơn</span>
                </div>
                <div className="card-actions">
                  <LinkButton to={`/owner/restaurants/${restaurant._id}/overview`}>Quản lý <ArrowRight size={16} /></LinkButton>
                  <LinkButton variant="secondary" to={`/owner/restaurants/${restaurant._id}/settings`}><Pencil size={16} /> Chỉnh sửa</LinkButton>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

export function OwnerOnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post<{ restaurant: Restaurant }>("/owner/restaurants", payload).then((response) => response.data.restaurant),
    onSuccess: async (restaurant) => {
      await queryClient.invalidateQueries({ queryKey: ["owner", "restaurants"] });
      toast.success("Đã nộp hồ sơ nhà hàng. MămMăm sẽ sớm xét duyệt.");
      navigate(`/owner/restaurants/${restaurant._id}/settings`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  return (
    <>
      <PageHeader title="Thêm nhà hàng" description="Hoàn thiện hồ sơ để gửi Ban quản trị xét duyệt." actions={<LinkButton variant="secondary" to="/owner/restaurants"><ArrowLeft size={16} /> Danh sách quán</LinkButton>} />
      <div className="onboarding-note"><span>1</span><div><b>Thông tin hồ sơ</b><small>Sau khi gửi, quán ở trạng thái Chờ duyệt. Bạn vẫn có thể cập nhật hồ sơ và chuẩn bị thực đơn.</small></div></div>
      <RestaurantForm submitLabel="Gửi hồ sơ xét duyệt" submitting={mutation.isPending} onSubmit={async (payload) => { await mutation.mutateAsync(payload); }} />
    </>
  );
}

export function OwnerOverviewPage() {
  const { restaurantId = "" } = useParams();
  const [granularity, setGranularity] = useState<AnalyticsGranularity>("day");
  const [dates, setDates] = useState(() => analyticsRange("day"));
  const dashboardParams = useMemo(() => ({ ...dates, granularity }), [dates, granularity]);
  const query = useQuery({
    queryKey: ["owner", restaurantId, "dashboard", dashboardParams],
    queryFn: () => api.get<OwnerDashboard>(`/owner/restaurants/${restaurantId}/dashboard`, { params: dashboardParams }).then((response) => response.data),
    enabled: Boolean(restaurantId),
    refetchInterval: 60_000,
  });
  const restaurantQuery = useQuery({
    queryKey: ["owner", "restaurant", restaurantId],
    queryFn: () => api.get<{ restaurant: Restaurant }>(`/owner/restaurants/${restaurantId}`).then((response) => response.data.restaurant),
    enabled: Boolean(restaurantId),
  });
  if (query.isLoading || restaurantQuery.isLoading) return <SkeletonRows count={6} />;
  if (query.isError) return <ErrorState message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} />;
  const data = query.data;
  const restaurant = restaurantQuery.data;
  if (!data || !restaurant) return null;
  const chartOptions: ApexOptions = {
    chart: { toolbar: { show: false }, fontFamily: "inherit", zoom: { enabled: false } },
    colors: [dashboardChartTheme.primary, dashboardChartTheme.secondary],
    stroke: { curve: "smooth", width: [3, 2] },
    fill: { type: ["gradient", "solid"], gradient: { opacityFrom: 0.18, opacityTo: 0.02 } },
    dataLabels: { enabled: false },
    grid: { borderColor: dashboardChartTheme.grid, strokeDashArray: 4 },
    xaxis: { categories: data.chart.map((point) => formatAnalyticsPeriod(point.date, data.granularity)), labels: { rotate: 0, hideOverlappingLabels: true } },
    yaxis: [{ labels: { formatter: (value) => formatCompactMoney(value) } }, { opposite: true, labels: { formatter: (value) => formatNumber(Math.round(value)) } }],
    legend: { position: "top", horizontalAlign: "right" },
    tooltip: { shared: true, y: { formatter: (value, options) => options.seriesIndex === 0 ? formatMoney(value) : `${formatNumber(value)} đơn` } },
  };
  const categoryChartOptions: ApexOptions = {
    chart: { toolbar: { show: false }, fontFamily: "inherit" },
    colors: [dashboardChartTheme.primary],
    plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: "55%" } },
    dataLabels: { enabled: false },
    grid: { borderColor: dashboardChartTheme.grid, strokeDashArray: 4 },
    xaxis: {
      categories: data.categoryBreakdown.map((item) => item.label),
      labels: { formatter: (value) => formatCompactMoney(Number(value)) },
    },
    tooltip: { y: { formatter: (value) => formatMoney(value) } },
  };

  const changeGranularity = (value: AnalyticsGranularity) => {
    setGranularity(value);
    setDates(analyticsRange(value));
  };

  return (
    <>
      <PageHeader
        title={`Tổng quan ${restaurant.name}`}
        description="Doanh thu, đơn hàng và món bán chạy chỉ tính cho nhà hàng đang chọn."
      />
      {restaurant.approvalStatus !== "approved" && <div className={`inline-alert ${restaurant.approvalStatus === "rejected" ? "danger" : "warning"}`}><b>{restaurant.approvalStatus === "rejected" ? "Hồ sơ bị từ chối." : "Hồ sơ đang chờ duyệt."}</b> {restaurant.rejectionReason || "Các tính năng nhận đơn chỉ mở sau khi được duyệt."} <Link to={`/owner/restaurants/${restaurantId}/settings`}>Xem hồ sơ</Link></div>}

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
            <span>Từ ngày</span>
            <Input type="date" value={dates.from} onChange={(event) => setDates((current) => ({ ...current, from: event.target.value }))} />
          </label>
          <label className="analytics-filter-field">
            <span>Đến ngày</span>
            <Input type="date" value={dates.to} onChange={(event) => setDates((current) => ({ ...current, to: event.target.value }))} />
          </label>
        </div>
      </Card>

      <div className="metric-grid">
        <MetricCard icon={CircleDollarSign} label="Doanh thu đơn hoàn tất" value={formatMoney(data.metrics.revenue.current)} metric={data.metrics.revenue} />
        <MetricCard icon={ShoppingBag} label="Tổng đơn hàng" value={formatNumber(data.metrics.orders.current)} metric={data.metrics.orders} />
        <MetricCard icon={Utensils} label="Món ăn bán chạy" value={data.topItems[0]?.name ?? "Chưa có dữ liệu"} />
        <MetricCard icon={TrendingDown} label="Tỷ lệ hủy" value={`${data.metrics.cancellationRate.current.toFixed(1)}%`} metric={data.metrics.cancellationRate} inverse />
      </div>
      <div className="attention-grid">
        <Link to={`/owner/restaurants/${restaurantId}/orders?status=pending`}><span className="attention-icon warning"><Clock3 size={20} /></span><div><b>{data.attention.pendingOrders}</b><p>Đơn chờ xác nhận</p></div><ChevronRight size={18} /></Link>
        <Link to={`/owner/restaurants/${restaurantId}/menu?availability=unavailable`}><span className="attention-icon danger"><Utensils size={20} /></span><div><b>{data.attention.unavailableItems}</b><p>Món đang hết hàng</p></div><ChevronRight size={18} /></Link>
        <Link to={`/owner/restaurants/${restaurantId}/reviews?reply=unanswered`}><span className="attention-icon info"><MessageSquareReply size={20} /></span><div><b>{data.attention.unansweredReviews}</b><p>Đánh giá chưa phản hồi</p></div><ChevronRight size={18} /></Link>
      </div>
      <div className="analytics-chart-grid">
        <Card className="chart-card">
          <div className="card-heading"><div><h2>Doanh thu và đơn hàng</h2><p>Đơn hoàn tất theo {data.granularity === "day" ? "ngày" : data.granularity === "month" ? "tháng" : "năm"}.</p></div></div>
          {data.chart.length ? <Suspense fallback={<SkeletonRows count={3} />}><AnalyticsChart options={chartOptions} series={[{ name: "Doanh thu", type: "area", data: data.chart.map((point) => point.revenue) }, { name: "Đơn hàng", type: "line", data: data.chart.map((point) => point.orders) }]} height={340} /></Suspense> : <EmptyState title="Chưa có số liệu" description="Khoảng thời gian này chưa có đơn hoàn tất." />}
        </Card>
        <Card className="chart-card">
          <div className="card-heading"><div><h2>Doanh thu theo danh mục món</h2><p>Top 10 danh mục của nhà hàng.</p></div></div>
          {data.categoryBreakdown.length ? <Suspense fallback={<SkeletonRows count={3} />}><AnalyticsChart type="bar" options={categoryChartOptions} series={[{ name: "Doanh thu", type: "bar", data: data.categoryBreakdown.map((item) => item.revenue) }]} height={340} /></Suspense> : <EmptyState title="Chưa có dữ liệu" description="Chưa có doanh thu theo danh mục trong kỳ này." />}
        </Card>
      </div>
      <Card className="owner-top-items-card">
        <div className="card-heading"><div><h2>Top món bán chạy</h2><p>Theo số lượng trong đơn hoàn tất.</p></div></div>
        <div className="rank-list">
          {data.topItems.length ? data.topItems.map((item, index) => <div key={item.itemId}><span>{index + 1}</span><div><b>{item.name}</b><small>{formatNumber(item.quantity)} phần</small></div><strong>{formatMoney(item.revenue)}</strong></div>) : <EmptyState icon={Utensils} title="Chưa có món bán chạy" description="Dữ liệu sẽ xuất hiện khi có đơn hoàn tất." />}
        </div>
      </Card>
      <Card>
        <div className="card-heading"><div><h2>Đơn hàng gần đây</h2><p>Cập nhật tự động mỗi phút.</p></div><Link to={`/owner/restaurants/${restaurantId}/orders`}>Xem tất cả <ArrowRight size={15} /></Link></div>
        <OrdersTable orders={data.recentOrders} restaurantId={restaurantId} />
      </Card>
    </>
  );
}

function MetricCard({ icon: Icon, label, value, metric, inverse }: { icon: typeof Store; label: string; value: string; metric?: { changePercent: number | null }; inverse?: boolean }) {
  const change = metric?.changePercent ?? null;
  const positive = change !== null && (inverse ? change <= 0 : change >= 0);
  return (
    <Card className="metric-card"><span className="metric-icon"><Icon size={21} /></span><div><p>{label}</p><strong>{value}</strong></div>{change !== null && <span className={`metric-change ${positive ? "positive" : "negative"}`}>{change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}{Math.abs(change).toFixed(1)}% <small>so với kỳ trước</small></span>}</Card>
  );
}

function OrdersTable({ orders, restaurantId, admin = false }: { orders: Order[]; restaurantId?: string; admin?: boolean }) {
  if (!orders.length) return <EmptyState icon={ShoppingBag} title="Chưa có đơn hàng" description="Không có đơn phù hợp với điều kiện hiện tại." />;
  return (
    <div className="table-wrap"><table><thead><tr><th>Mã đơn</th>{admin && <th>Nhà hàng</th>}<th>Khách hàng</th><th>Thời gian</th><th>Tổng tiền</th><th>Trạng thái</th><th /></tr></thead><tbody>
      {orders.map((order) => <tr key={order._id}><td><b>#{order.orderNumber}</b><small>{order.paymentMethod.toUpperCase()}</small></td>{admin && <td>{order.restaurantSnapshot.name}</td>}<td><b>{order.recipient.fullName}</b><small>{order.recipient.phone}</small></td><td>{formatDateTime(order.placedAt)}</td><td><b>{formatMoney(order.pricing.grandTotal)}</b><PaymentBadge value={order.paymentStatus} /></td><td><OrderBadge value={order.orderStatus} /></td><td><Link className="table-action" to={admin ? `/admin/orders/${order._id}` : `/owner/restaurants/${restaurantId}/orders/${order._id}`} aria-label="Xem đơn"><Eye size={17} /></Link></td></tr>)}
    </tbody></table></div>
  );
}

const orderTabs: Array<{ value: string; label: string }> = [
  { value: "", label: "Tất cả" },
  { value: "pending", label: "Chờ xác nhận" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "preparing", label: "Đang chuẩn bị" },
  { value: "delivering", label: "Đang giao" },
  { value: "delivered", label: "Hoàn tất" },
  { value: "cancelled", label: "Đã hủy" },
];

export function OwnerOrdersPage() {
  const { restaurantId = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "";
  const search = params.get("search") ?? "";
  const page = Number(params.get("page") || "1");
  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.set("page", "1");
    setParams(next);
  };
  const query = useQuery({
    queryKey: ["owner", restaurantId, "orders", Object.fromEntries(params)],
    queryFn: () => api.get<ListResponse<Order>>(`/owner/restaurants/${restaurantId}/orders`, { params: Object.fromEntries(params) }).then((response) => response.data),
    enabled: Boolean(restaurantId),
    refetchInterval: status === "delivered" || status === "cancelled" ? false : 30_000,
  });
  return (
    <>
      <PageHeader title="Đơn hàng" description="Theo dõi và xử lý đơn theo đúng trình tự vận hành." actions={<Button variant="secondary" onClick={() => void query.refetch()}><RefreshCcw size={16} /> Làm mới</Button>} />
      <div className="tabs" role="tablist">{orderTabs.map((tab) => <button key={tab.value} className={status === tab.value ? "active" : ""} onClick={() => setParam("status", tab.value)}>{tab.label}</button>)}</div>
      <Card>
        <div className="filter-bar">
          <SearchInput value={search} onChange={(value) => setParam("search", value)} placeholder="Mã đơn, tên hoặc số điện thoại..." />
          <Input type="date" value={params.get("from") ?? ""} onChange={(event) => setParam("from", event.target.value)} aria-label="Từ ngày" />
          <Input type="date" value={params.get("to") ?? ""} onChange={(event) => setParam("to", event.target.value)} aria-label="Đến ngày" />
          <Select value={params.get("paymentStatus") ?? ""} onChange={(event) => setParam("paymentStatus", event.target.value)} aria-label="Thanh toán"><option value="">Mọi thanh toán</option><option value="unpaid">Chưa thanh toán</option><option value="pending">Chờ thanh toán</option><option value="paid">Đã thanh toán</option><option value="failed">Thất bại</option><option value="refunded">Đã hoàn tiền</option></Select>
        </div>
        {query.isLoading ? <SkeletonRows /> : query.isError ? <ErrorState message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : query.data ? <><OrdersTable orders={query.data.data} restaurantId={restaurantId} /><Pagination meta={query.data.meta} onPage={(nextPage) => setParam("page", String(nextPage))} /></> : null}
      </Card>
      <span className="sr-only">Trang {page}</span>
    </>
  );
}

const validNextStatuses: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["delivering"],
  delivering: ["delivered"],
};

export function OwnerOrderDetailPage() {
  const { restaurantId = "", orderId = "" } = useParams();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [actionStatus, setActionStatus] = useState<OrderStatus | null>(null);
  const [reason, setReason] = useState("");
  const query = useQuery({
    queryKey: ["owner", restaurantId, "order", orderId],
    queryFn: () => api.get<{ order: Order }>(`/owner/restaurants/${restaurantId}/orders/${orderId}`).then((response) => response.data.order),
    enabled: Boolean(restaurantId && orderId),
    refetchInterval: 30_000,
  });
  const mutation = useMutation({
    mutationFn: ({ status, reason: actionReason }: { status: OrderStatus; reason?: string }) => api.patch<{ order: Order }>(`/owner/restaurants/${restaurantId}/orders/${orderId}/status`, { status, reason: actionReason }).then((response) => response.data.order),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["owner", restaurantId, "order", orderId] }),
        queryClient.invalidateQueries({ queryKey: ["owner", restaurantId, "orders"] }),
        queryClient.invalidateQueries({ queryKey: ["owner", restaurantId, "dashboard"] }),
      ]);
      toast.success("Đã cập nhật trạng thái đơn hàng.");
      setActionStatus(null); setReason("");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  if (query.isLoading) return <SkeletonRows count={7} />;
  if (query.isError || !query.data) return <ErrorState message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} />;
  const order = query.data;
  const nextStatuses = validNextStatuses[order.orderStatus] ?? [];
  return (
    <>
      <PageHeader title={`Đơn hàng #${order.orderNumber}`} description={`Đặt lúc ${formatDateTime(order.placedAt)}`} actions={<LinkButton variant="secondary" to={`/owner/restaurants/${restaurantId}/orders`}><ArrowLeft size={16} /> Danh sách đơn</LinkButton>} />
      <div className="order-detail-layout">
        <div className="order-detail-main">
          <Card>
            <div className="card-heading"><div><h2>Tiến trình đơn hàng</h2><p>Trạng thái hiện tại: <OrderBadge value={order.orderStatus} /></p></div></div>
            <div className="order-timeline">
              {order.statusHistory.map((entry, index) => <div key={`${entry.changedAt}-${index}`}><span><Check size={14} /></span><div><b>{orderStatusLabels[entry.to as OrderStatus] ?? entry.to}</b><small>{formatDateTime(entry.changedAt)} · {entry.changedByRole}</small>{entry.reason && <p>Lý do: {entry.reason}</p>}</div></div>)}
            </div>
            {nextStatuses.length > 0 && <div className="order-actions"><span>Thao tác tiếp theo</span><div>{nextStatuses.map((statusValue) => <Button key={statusValue} variant={statusValue === "cancelled" ? "danger" : "primary"} onClick={() => statusValue === "cancelled" ? setActionStatus(statusValue) : mutation.mutate({ status: statusValue })} loading={mutation.isPending && actionStatus === statusValue}>{statusValue === "cancelled" ? <X size={16} /> : <Check size={16} />}{orderStatusLabels[statusValue]}</Button>)}</div></div>}
          </Card>
          <Card>
            <div className="card-heading"><div><h2>Món đã đặt</h2><p>{order.items.reduce((sum, item) => sum + item.quantity, 0)} phần</p></div></div>
            <div className="order-items">{order.items.map((item, index) => <div key={`${item.menuItemId}-${index}`}>{item.imageUrl ? <img src={item.imageUrl} alt="" /> : <span className="item-placeholder"><Utensils size={18} /></span>}<div><b>{item.quantity} × {item.name}</b>{item.selectedOptions.map((option) => <small key={`${option.groupName}-${option.optionName}`}>{option.groupName}: {option.optionName} (+{formatMoney(option.priceDelta)})</small>)}{item.note && <p>Ghi chú: {item.note}</p>}</div><strong>{formatMoney(item.lineTotal)}</strong></div>)}</div>
          </Card>
          <Card>
            <div className="card-heading"><div><h2>Địa chỉ giao hàng</h2></div></div>
            <dl className="detail-list"><div><dt>Người nhận</dt><dd>{order.recipient.fullName}</dd></div><div><dt>Số điện thoại</dt><dd>{order.recipient.phone}</dd></div><div><dt>Địa chỉ</dt><dd>{order.recipient.addressText}</dd></div>{order.recipient.note && <div><dt>Ghi chú</dt><dd>{order.recipient.note}</dd></div>}</dl>
          </Card>
        </div>
        <aside className="order-detail-side">
          <Card><div className="card-heading"><div><h2>Thanh toán</h2></div><PaymentBadge value={order.paymentStatus} /></div><dl className="pricing-list"><div><dt>Tạm tính</dt><dd>{formatMoney(order.pricing.subtotal)}</dd></div><div><dt>Phí giao hàng</dt><dd>{formatMoney(order.pricing.deliveryFee)}</dd></div>{order.pricing.discountAmount > 0 && <div className="discount"><dt>Giảm giá</dt><dd>-{formatMoney(order.pricing.discountAmount)}</dd></div>}<div className="pricing-total"><dt>Tổng cộng</dt><dd>{formatMoney(order.pricing.grandTotal)}</dd></div></dl><p className="payment-method">Phương thức: <b>{order.paymentMethod.toUpperCase()}</b></p></Card>
          <Card><div className="card-heading"><div><h2>Khách hàng</h2></div></div><dl className="detail-list compact"><div><dt>Họ tên</dt><dd>{order.customerSnapshot.fullName}</dd></div><div><dt>Email</dt><dd>{order.customerSnapshot.email}</dd></div><div><dt>Điện thoại</dt><dd>{order.customerSnapshot.phone}</dd></div></dl></Card>
        </aside>
      </div>
      <Modal open={actionStatus === "cancelled"} title="Hủy đơn hàng" description="Thao tác này không thể hoàn tác. Vui lòng cho biết lý do." onClose={() => setActionStatus(null)}>
        <div className="modal-body"><Field label="Lý do hủy" required><Textarea rows={4} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ví dụ: Hết nguyên liệu..." /></Field></div>
        <div className="modal-actions"><Button variant="secondary" onClick={() => setActionStatus(null)}>Giữ đơn</Button><Button variant="danger" disabled={reason.trim().length < 3} loading={mutation.isPending} onClick={() => mutation.mutate({ status: "cancelled", reason: reason.trim() })}>Xác nhận hủy</Button></div>
      </Modal>
    </>
  );
}

export function OwnerSettingsPage() {
  const { restaurantId = "" } = useParams();
  const queryClient = useQueryClient();
  const toast = useToast();
  const query = useQuery({ queryKey: ["owner", "restaurant", restaurantId], queryFn: () => api.get<{ restaurant: Restaurant }>(`/owner/restaurants/${restaurantId}`).then((response) => response.data.restaurant), enabled: Boolean(restaurantId) });
  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.patch<{ restaurant: Restaurant }>(`/owner/restaurants/${restaurantId}`, payload).then((response) => response.data.restaurant),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["owner"] }); toast.success("Đã lưu thông tin nhà hàng."); },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const statusMutation = useMutation({
    mutationFn: (operationStatus: "open" | "temporarily_closed") => api.patch(`/owner/restaurants/${restaurantId}/operation-status`, { operationStatus }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["owner"] }); toast.success("Đã cập nhật trạng thái vận hành."); },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  if (query.isLoading) return <SkeletonRows count={6} />;
  if (query.isError || !query.data) return <ErrorState message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} />;
  const restaurant = query.data;
  return (
    <>
      <PageHeader title="Cài đặt nhà hàng" description="Cập nhật hồ sơ, lịch hoạt động và phạm vi giao hàng." actions={<div className="badge-row"><ApprovalBadge value={restaurant.approvalStatus} /><OperationBadge value={restaurant.operationStatus} /></div>} />
      {restaurant.approvalStatus === "rejected" && <div className="inline-alert danger"><b>Hồ sơ cần chỉnh sửa:</b> {restaurant.rejectionReason || "Vui lòng kiểm tra lại thông tin."}</div>}
      <Card className="operation-control">
        <div><span className="section-icon"><Store size={18} /></span><div><h2>Trạng thái nhận đơn</h2><p>{restaurant.operationStatus === "suspended" ? "Nhà hàng đang bị đình chỉ bởi quản trị viên." : "Tạm đóng cửa khi quán chưa thể nhận đơn mới."}</p></div></div>
        <div className="segmented-control"><button disabled={restaurant.operationStatus === "suspended" || statusMutation.isPending} className={restaurant.operationStatus === "open" ? "active" : ""} onClick={() => statusMutation.mutate("open")}>Đang mở</button><button disabled={restaurant.operationStatus === "suspended" || statusMutation.isPending} className={restaurant.operationStatus === "temporarily_closed" ? "active" : ""} onClick={() => statusMutation.mutate("temporarily_closed")}>Tạm đóng</button></div>
      </Card>
      <RestaurantForm restaurant={restaurant} submitLabel="Lưu thông tin nhà hàng" submitting={updateMutation.isPending} onSubmit={async (payload) => { await updateMutation.mutateAsync(payload); }} />
    </>
  );
}

const categorySchema = z.object({ name: z.string().trim().min(2, "Tên danh mục cần ít nhất 2 ký tự."), description: z.string().trim().optional() });
type CategoryValues = z.infer<typeof categorySchema>;

export function OwnerMenuPage() {
  const { restaurantId = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [categoryModal, setCategoryModal] = useState<MenuCategory | "new" | null>(null);
  const [deleteItem, setDeleteItem] = useState<MenuItem | null>(null);
  const search = params.get("search") ?? "";
  const categoryId = params.get("categoryId") ?? "";
  const setParam = (key: string, value: string) => { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); next.set("page", "1"); setParams(next); };
  const categoriesQuery = useQuery({ queryKey: ["owner", restaurantId, "menu-categories"], queryFn: () => api.get<{ data: MenuCategory[] }>(`/owner/restaurants/${restaurantId}/menu-categories`).then((response) => response.data.data), enabled: Boolean(restaurantId) });
  const itemsQuery = useQuery({ queryKey: ["owner", restaurantId, "menu-items", Object.fromEntries(params)], queryFn: () => api.get<ListResponse<MenuItem>>(`/owner/restaurants/${restaurantId}/menu-items`, { params: Object.fromEntries(params) }).then((response) => response.data), enabled: Boolean(restaurantId) });
  const toggleMutation = useMutation({
    mutationFn: ({ itemId, isAvailable }: { itemId: string; isAvailable: boolean }) => api.patch(`/owner/restaurants/${restaurantId}/menu-items/${itemId}/availability`, { isAvailable }),
    onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ["owner", restaurantId, "menu-items"] }), queryClient.invalidateQueries({ queryKey: ["owner", restaurantId, "dashboard"] })]); toast.success("Đã cập nhật tình trạng món."); },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => api.delete(`/owner/restaurants/${restaurantId}/menu-items/${itemId}`),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["owner", restaurantId, "menu-items"] }); setDeleteItem(null); toast.success("Đã xóa món khỏi thực đơn."); },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  return (
    <>
      <PageHeader title="Thực đơn" description="Quản lý danh mục, giá bán, lựa chọn và tình trạng món." actions={<div className="page-actions"><Button variant="secondary" onClick={() => setCategoryModal("new")}><CirclePlus size={16} /> Thêm danh mục</Button><LinkButton to={`/owner/restaurants/${restaurantId}/menu/items/new`}><Plus size={17} /> Thêm món</LinkButton></div>} />
      <Card>
        <div className="menu-category-bar">
          <button className={!categoryId ? "active" : ""} onClick={() => setParam("categoryId", "")}>Tất cả</button>
          {categoriesQuery.data?.map((category) => <div key={category._id} className={categoryId === category._id ? "active" : ""}><button onClick={() => setParam("categoryId", category._id)}>{category.name} <span>{category.itemCount ?? 0}</span></button><button className="category-edit" aria-label={`Sửa ${category.name}`} onClick={() => setCategoryModal(category)}><Pencil size={13} /></button></div>)}
        </div>
        <div className="filter-bar"><SearchInput value={search} onChange={(value) => setParam("search", value)} placeholder="Tìm tên món..." /><Select value={params.get("availability") ?? ""} onChange={(event) => setParam("availability", event.target.value)}><option value="">Mọi tình trạng</option><option value="available">Đang bán</option><option value="unavailable">Hết hàng</option></Select><Select value={params.get("visibility") ?? ""} onChange={(event) => setParam("visibility", event.target.value)}><option value="">Mọi hiển thị</option><option value="visible">Đang hiện</option><option value="hidden">Đã ẩn</option></Select></div>
        {itemsQuery.isLoading ? <SkeletonRows /> : itemsQuery.isError ? <ErrorState message={getErrorMessage(itemsQuery.error)} onRetry={() => void itemsQuery.refetch()} /> : !itemsQuery.data?.data.length ? <EmptyState icon={Utensils} title="Không có món phù hợp" description="Thêm món mới hoặc thay đổi bộ lọc hiện tại." action={<LinkButton to={`/owner/restaurants/${restaurantId}/menu/items/new`}>Thêm món đầu tiên</LinkButton>} /> : <>
          <div className="menu-item-list">{itemsQuery.data.data.map((item) => {
            const category = typeof item.menuCategoryId === "string" ? categoriesQuery.data?.find((entry) => entry._id === item.menuCategoryId) : item.menuCategoryId;
            return <article key={item._id} className="menu-item-row">{item.imageUrls[0] ? <img src={item.imageUrls[0]} alt={item.name} /> : <span className="menu-image-placeholder"><Utensils size={22} /></span>}<div className="menu-item-copy"><div><h3>{item.name}</h3><Badge value={item.isVisible ? "visible" : "hidden"}>{item.isVisible ? "Đang hiển thị" : "Đã ẩn"}</Badge></div><p>{category?.name ?? "Chưa phân loại"} · Đã bán {formatNumber(item.soldCount)}</p><strong>{item.salePrice ? <><span>{formatMoney(item.basePrice ?? 0)}</span>{formatMoney(item.salePrice)}</> : formatMoney(item.basePrice ?? 0)}</strong></div><label className="switch"><input type="checkbox" checked={item.isAvailable} disabled={toggleMutation.isPending} onChange={(event) => toggleMutation.mutate({ itemId: item._id, isAvailable: event.target.checked })} /><span /><small>{item.isAvailable ? "Đang bán" : "Hết hàng"}</small></label><div className="row-actions"><Link className="icon-button" to={`/owner/restaurants/${restaurantId}/menu/items/${item._id}/edit`} aria-label="Sửa món"><Pencil size={17} /></Link><button className="icon-button danger" onClick={() => setDeleteItem(item)} aria-label="Xóa món"><Trash2 size={17} /></button></div></article>;
          })}</div><Pagination meta={itemsQuery.data.meta} onPage={(page) => { const next = new URLSearchParams(params); next.set("page", String(page)); setParams(next); }} />
        </>}
      </Card>
      <CategoryModal restaurantId={restaurantId} category={categoryModal} onClose={() => setCategoryModal(null)} />
      <Modal open={Boolean(deleteItem)} title="Xóa món khỏi thực đơn?" description={deleteItem ? `Món “${deleteItem.name}” sẽ không còn xuất hiện trong thực đơn. Dữ liệu đơn cũ vẫn được giữ.` : ""} onClose={() => setDeleteItem(null)}><div className="modal-actions"><Button variant="secondary" onClick={() => setDeleteItem(null)}>Giữ lại</Button><Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteItem && deleteMutation.mutate(deleteItem._id)}>Xóa món</Button></div></Modal>
    </>
  );
}

function CategoryModal({ restaurantId, category, onClose }: { restaurantId: string; category: MenuCategory | "new" | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CategoryValues>({ resolver: zodResolver(categorySchema), values: { name: category && category !== "new" ? category.name : "", description: category && category !== "new" ? category.description ?? "" : "" } });
  const close = () => { reset(); setConfirmDelete(false); onClose(); };
  const submit = handleSubmit(async (values) => {
    try {
      if (category && category !== "new") await api.patch(`/owner/restaurants/${restaurantId}/menu-categories/${category._id}`, values);
      else await api.post(`/owner/restaurants/${restaurantId}/menu-categories`, values);
      await queryClient.invalidateQueries({ queryKey: ["owner", restaurantId, "menu-categories"] });
      toast.success(category === "new" ? "Đã thêm danh mục." : "Đã cập nhật danh mục."); close();
    } catch (error) { toast.error(getErrorMessage(error)); }
  });
  const remove = async () => {
    if (!category || category === "new") return;
    try { await api.delete(`/owner/restaurants/${restaurantId}/menu-categories/${category._id}`); await queryClient.invalidateQueries({ queryKey: ["owner", restaurantId] }); toast.success("Đã xóa danh mục."); close(); } catch (error) { toast.error(getErrorMessage(error)); }
  };
  return <Modal open={Boolean(category)} title={category === "new" ? "Thêm danh mục" : "Chỉnh sửa danh mục"} onClose={close}><form onSubmit={(event) => void submit(event)}><div className="modal-body"><Field label="Tên danh mục" required error={errors.name?.message}><Input autoFocus {...register("name")} /></Field><Field label="Mô tả"><Textarea rows={3} {...register("description")} /></Field>{confirmDelete && <div className="inline-alert danger">Chỉ có thể xóa danh mục không còn món. Nhấn xác nhận lần nữa.</div>}</div><div className="modal-actions spread">{category !== "new" && <Button type="button" variant="danger" onClick={() => confirmDelete ? void remove() : setConfirmDelete(true)}><Trash2 size={16} /> {confirmDelete ? "Xác nhận xóa" : "Xóa"}</Button>}<div><Button type="button" variant="secondary" onClick={close}>Hủy</Button><Button type="submit" loading={isSubmitting}><Save size={16} /> Lưu</Button></div></div></form></Modal>;
}

const menuItemSchema = z.object({
  menuCategoryId: z.string().min(1, "Vui lòng chọn danh mục."),
  name: z.string().trim().min(2, "Tên món cần ít nhất 2 ký tự."),
  shortDescription: z.string().trim().max(180, "Mô tả ngắn tối đa 180 ký tự."),
  description: z.string().trim(),
  ingredients: z.string(),
  imageUrls: z.string(),
  basePrice: z.number().min(0, "Giá không được âm."),
  salePrice: z.union([z.literal(""), z.number().min(0)]),
  isAvailable: z.boolean(),
  isVisible: z.boolean(),
}).refine((values) => values.salePrice === "" || values.salePrice <= values.basePrice, { path: ["salePrice"], message: "Giá khuyến mãi không được lớn hơn giá gốc." });
type MenuItemValues = z.infer<typeof menuItemSchema>;

const emptyMenuValues: MenuItemValues = { menuCategoryId: "", name: "", shortDescription: "", description: "", ingredients: "", imageUrls: "", basePrice: 0, salePrice: "", isAvailable: true, isVisible: true };

export function OwnerMenuItemEditorPage() {
  const { restaurantId = "", itemId } = useParams();
  const isEdit = Boolean(itemId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [optionGroups, setOptionGroups] = useState<MenuOptionGroup[]>([]);
  const categoriesQuery = useQuery({ queryKey: ["owner", restaurantId, "menu-categories"], queryFn: () => api.get<{ data: MenuCategory[] }>(`/owner/restaurants/${restaurantId}/menu-categories`).then((response) => response.data.data), enabled: Boolean(restaurantId) });
  const itemQuery = useQuery({ queryKey: ["owner", restaurantId, "menu-item", itemId], queryFn: () => api.get<{ item: MenuItem }>(`/owner/restaurants/${restaurantId}/menu-items/${itemId}`).then((response) => response.data.item), enabled: isEdit });
  const item = itemQuery.data;
  const values = useMemo<MenuItemValues>(() => item ? { menuCategoryId: readEntityId(item.menuCategoryId), name: item.name, shortDescription: item.shortDescription ?? "", description: item.description ?? "", ingredients: item.ingredients.join(", "), imageUrls: item.imageUrls.join("\n"), basePrice: item.basePrice ?? 0, salePrice: item.salePrice ?? "", isAvailable: item.isAvailable, isVisible: item.isVisible } : emptyMenuValues, [item]);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<MenuItemValues>({ resolver: zodResolver(menuItemSchema), values });
  useEffect(() => {
    if (item) setOptionGroups(item.optionGroups);
  }, [item]);
  const addGroup = () => setOptionGroups((current) => [...current, { name: "", minSelect: 0, maxSelect: 1, required: false, options: [{ name: "", priceDelta: 0, isAvailable: true }] }]);
  const updateGroup = (groupIndex: number, patch: Partial<MenuOptionGroup>) => setOptionGroups((current) => current.map((group, index) => index === groupIndex ? { ...group, ...patch } : group));
  const updateOption = (groupIndex: number, optionIndex: number, patch: Partial<MenuOptionGroup["options"][number]>) => setOptionGroups((current) => current.map((group, index) => index === groupIndex ? { ...group, options: group.options.map((option, indexOption) => indexOption === optionIndex ? { ...option, ...patch } : option) } : group));
  const submit = handleSubmit(async (formValues) => {
    const invalidGroup = optionGroups.find((group) => !group.name.trim() || group.maxSelect < group.minSelect || !group.options.length || group.options.some((option) => !option.name.trim()));
    if (invalidGroup) { toast.error("Vui lòng hoàn thiện tên và giới hạn của các nhóm lựa chọn."); return; }
    const payload = { ...formValues, salePrice: formValues.salePrice === "" ? null : formValues.salePrice, ingredients: formValues.ingredients.split(",").map((value) => value.trim()).filter(Boolean), imageUrls: formValues.imageUrls.split(/[\n,]/).map((value) => value.trim()).filter(Boolean), optionGroups };
    try {
      if (isEdit) await api.patch(`/owner/restaurants/${restaurantId}/menu-items/${itemId}`, payload);
      else await api.post(`/owner/restaurants/${restaurantId}/menu-items`, payload);
      await queryClient.invalidateQueries({ queryKey: ["owner", restaurantId, "menu"] });
      toast.success(isEdit ? "Đã cập nhật món." : "Đã thêm món mới.");
      reset(); navigate(`/owner/restaurants/${restaurantId}/menu`);
    } catch (error) { toast.error(getErrorMessage(error)); }
  });
  if (isEdit && itemQuery.isLoading) return <SkeletonRows count={6} />;
  if (itemQuery.isError) return <ErrorState message={getErrorMessage(itemQuery.error)} onRetry={() => void itemQuery.refetch()} />;
  return (
    <>
      <PageHeader title={isEdit ? "Chỉnh sửa món" : "Thêm món mới"} description="Thông tin này được hiển thị trực tiếp trên trang đặt món." actions={<LinkButton variant="secondary" to={`/owner/restaurants/${restaurantId}/menu`}><ArrowLeft size={16} /> Thực đơn</LinkButton>} />
      <form className="editor-layout" onSubmit={(event) => void submit(event)}>
        <div className="editor-main">
          <Card><div className="card-heading"><div><h2>Thông tin món</h2></div></div><div className="form-grid"><Field label="Tên món" required error={errors.name?.message}><Input {...register("name")} /></Field><Field label="Danh mục" required error={errors.menuCategoryId?.message}><Select {...register("menuCategoryId")}><option value="">Chọn danh mục</option>{categoriesQuery.data?.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}</Select></Field><Field label="Mô tả ngắn" error={errors.shortDescription?.message}><Input maxLength={180} {...register("shortDescription")} /></Field><Field label="Nguyên liệu" hint="Phân tách bằng dấu phẩy."><Input {...register("ingredients")} /></Field><div className="form-span"><Field label="Mô tả chi tiết"><Textarea rows={4} {...register("description")} /></Field></div></div></Card>
          <Card><div className="card-heading"><div><h2>Nhóm lựa chọn</h2><p>Ví dụ: Kích cỡ, mức cay, topping.</p></div><Button type="button" variant="secondary" onClick={addGroup}><Plus size={15} /> Thêm nhóm</Button></div><div className="option-groups">{optionGroups.length === 0 ? <EmptyState icon={MoreHorizontal} title="Chưa có lựa chọn" description="Món này được bán với cấu hình mặc định." /> : optionGroups.map((group, groupIndex) => <div className="option-group" key={groupIndex}><div className="option-group-head"><Input value={group.name} onChange={(event) => updateGroup(groupIndex, { name: event.target.value })} placeholder="Tên nhóm" /><label className="checkbox-label"><input type="checkbox" checked={group.required} onChange={(event) => updateGroup(groupIndex, { required: event.target.checked, minSelect: event.target.checked ? Math.max(1, group.minSelect) : group.minSelect })} /> Bắt buộc</label><Field label="Tối thiểu"><Input type="number" min={0} value={group.minSelect} onChange={(event) => updateGroup(groupIndex, { minSelect: Number(event.target.value) })} /></Field><Field label="Tối đa"><Input type="number" min={1} value={group.maxSelect} onChange={(event) => updateGroup(groupIndex, { maxSelect: Number(event.target.value) })} /></Field><button type="button" className="icon-button danger" onClick={() => setOptionGroups((current) => current.filter((_, index) => index !== groupIndex))}><Trash2 size={16} /></button></div><div className="option-list">{group.options.map((option, optionIndex) => <div key={optionIndex}><Input value={option.name} onChange={(event) => updateOption(groupIndex, optionIndex, { name: event.target.value })} placeholder="Tên lựa chọn" /><Input type="number" min={0} value={option.priceDelta} onChange={(event) => updateOption(groupIndex, optionIndex, { priceDelta: Number(event.target.value) })} aria-label="Phụ thu" /><label className="checkbox-label"><input type="checkbox" checked={option.isAvailable} onChange={(event) => updateOption(groupIndex, optionIndex, { isAvailable: event.target.checked })} /> Còn hàng</label><button type="button" className="icon-button" onClick={() => updateGroup(groupIndex, { options: group.options.filter((_, index) => index !== optionIndex) })}><X size={15} /></button></div>)}<Button type="button" variant="ghost" onClick={() => updateGroup(groupIndex, { options: [...group.options, { name: "", priceDelta: 0, isAvailable: true }] })}><Plus size={15} /> Thêm lựa chọn</Button></div></div>)}</div></Card>
        </div>
        <aside className="editor-side"><Card><div className="card-heading"><div><h2>Giá và hiển thị</h2></div></div><div className="stack-fields"><Field label="Giá gốc (₫)" required error={errors.basePrice?.message}><Input type="number" min={0} {...register("basePrice", { valueAsNumber: true })} /></Field><Field label="Giá khuyến mãi (₫)" error={errors.salePrice?.message as string | undefined}><Input type="number" min={0} {...register("salePrice", { setValueAs: (value: string) => value === "" ? "" : Number(value) })} /></Field><Field label="URL hình ảnh" hint="Mỗi URL một dòng."><Textarea rows={4} {...register("imageUrls")} /></Field><label className="switch-row"><span><b>Đang bán</b><small>Cho phép khách thêm món vào giỏ.</small></span><input type="checkbox" {...register("isAvailable")} /></label><label className="switch-row"><span><b>Hiển thị</b><small>Xuất hiện trên trang nhà hàng.</small></span><input type="checkbox" {...register("isVisible")} /></label><Button type="submit" loading={isSubmitting} className="btn-block"><Save size={16} /> {isEdit ? "Lưu thay đổi" : "Tạo món"}</Button></div></Card></aside>
      </form>
    </>
  );
}

export function OwnerReviewsPage() {
  const { restaurantId = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [activeReview, setActiveReview] = useState<Review | null>(null);
  const [reply, setReply] = useState("");
  const setParam = (key: string, value: string) => { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); next.set("page", "1"); setParams(next); };
  const query = useQuery({ queryKey: ["owner", restaurantId, "reviews", Object.fromEntries(params)], queryFn: () => api.get<ListResponse<Review>>(`/owner/restaurants/${restaurantId}/reviews`, { params: Object.fromEntries(params) }).then((response) => response.data), enabled: Boolean(restaurantId) });
  const replyMutation = useMutation({
    mutationFn: ({ reviewId, content }: { reviewId: string; content: string }) => api.put(`/owner/restaurants/${restaurantId}/reviews/${reviewId}/reply`, { content }),
    onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ["owner", restaurantId, "reviews"] }), queryClient.invalidateQueries({ queryKey: ["owner", restaurantId, "dashboard"] })]); toast.success("Đã lưu phản hồi."); setActiveReview(null); setReply(""); },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const removeReply = async (review: Review) => { try { await api.delete(`/owner/restaurants/${restaurantId}/reviews/${review._id}/reply`); await queryClient.invalidateQueries({ queryKey: ["owner", restaurantId, "reviews"] }); toast.success("Đã xóa phản hồi."); } catch (error) { toast.error(getErrorMessage(error)); } };
  const openReply = (review: Review) => { setActiveReview(review); setReply(review.ownerReply?.content ?? ""); };
  return (
    <>
      <PageHeader title="Đánh giá khách hàng" description="Lắng nghe phản hồi và trả lời với tư cách nhà hàng." />
      <Card>
        <div className="filter-bar"><Select value={params.get("rating") ?? ""} onChange={(event) => setParam("rating", event.target.value)}><option value="">Mọi số sao</option>{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} sao</option>)}</Select><Select value={params.get("reply") ?? ""} onChange={(event) => setParam("reply", event.target.value)}><option value="">Tất cả phản hồi</option><option value="unanswered">Chưa phản hồi</option><option value="answered">Đã phản hồi</option></Select><Input type="date" value={params.get("from") ?? ""} onChange={(event) => setParam("from", event.target.value)} /></div>
        {query.isLoading ? <SkeletonRows /> : query.isError ? <ErrorState message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : !query.data?.data.length ? <EmptyState icon={Star} title="Chưa có đánh giá" description="Không có đánh giá phù hợp với bộ lọc hiện tại." /> : <><div className="review-list">{query.data.data.map((review) => { const customer = typeof review.customerId === "string" ? null : review.customerId; return <article className="review-card" key={review._id}><div className="review-head"><div className="avatar">{customer?.fullName?.charAt(0) ?? "K"}</div><div><b>{customer?.fullName ?? "Khách hàng"}</b><span className="stars">{Array.from({ length: 5 }, (_, index) => <Star key={index} size={15} fill={index < review.rating ? "currentColor" : "none"} />)}</span><small>{formatDateTime(review.createdAt)}</small></div><ReviewBadge value={review.visibilityStatus} /></div><p className="review-content">{review.content}</p>{review.imageUrls.length > 0 && <div className="review-images">{review.imageUrls.map((url) => <img key={url} src={url} alt="Ảnh đánh giá" />)}</div>}{review.ownerReply && <div className="owner-reply"><div><MessageSquareReply size={17} /><b>Phản hồi của nhà hàng</b><small>{formatDateTime(review.ownerReply.createdAt)}</small></div><p>{review.ownerReply.content}</p></div>}<div className="review-actions"><Button variant="secondary" onClick={() => openReply(review)}><MessageSquareReply size={16} /> {review.ownerReply ? "Sửa phản hồi" : "Phản hồi"}</Button>{review.ownerReply && <Button variant="ghost" onClick={() => void removeReply(review)}><Trash2 size={15} /> Xóa phản hồi</Button>}</div></article>; })}</div><Pagination meta={query.data.meta} onPage={(page) => setParam("page", String(page))} /></>}
      </Card>
      <Modal open={Boolean(activeReview)} title="Phản hồi đánh giá" description="Phản hồi sẽ hiển thị công khai trên trang nhà hàng." onClose={() => { setActiveReview(null); setReply(""); }}><div className="modal-body"><Field label="Nội dung" required hint={`${reply.length}/500 ký tự`}><Textarea rows={5} maxLength={500} value={reply} onChange={(event) => setReply(event.target.value)} /></Field></div><div className="modal-actions"><Button variant="secondary" onClick={() => setActiveReview(null)}>Hủy</Button><Button loading={replyMutation.isPending} disabled={reply.trim().length < 3} onClick={() => activeReview && replyMutation.mutate({ reviewId: activeReview._id, content: reply.trim() })}><Save size={16} /> Lưu phản hồi</Button></div></Modal>
    </>
  );
}
