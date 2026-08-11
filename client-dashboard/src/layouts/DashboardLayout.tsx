import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  BookOpen,
  ChevronDown,
  ChefHat,
  ClipboardList,
  Clock3,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  PanelLeftClose,
  Settings,
  ShieldCheck,
  Store,
  Tags,
  TicketPercent,
  UserRoundCog,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from "react-router";
import { useAuth } from "../app/AuthContext";
import { api } from "../lib/api";
import { initials } from "../lib/format";
import type { Restaurant } from "../types";
import { ApprovalBadge } from "../components/StatusBadge";

interface NavItem {
  label: string;
  icon: LucideIcon;
  to: string;
  end?: boolean;
}

const ownerNavigation = (restaurantId?: string): NavItem[] => {
  const base = restaurantId ? `/owner/restaurants/${restaurantId}` : "/owner/restaurants";
  if (!restaurantId) return [{ label: "Nhà hàng của tôi", icon: Store, to: "/owner/restaurants", end: true }];
  return [
    { label: "Tổng quan", icon: LayoutDashboard, to: `${base}/overview`, end: true },
    { label: "Đơn hàng", icon: ClipboardList, to: `${base}/orders` },
    { label: "Thực đơn", icon: BookOpen, to: `${base}/menu` },
    { label: "Đánh giá", icon: MessageSquareText, to: `${base}/reviews` },
    { label: "Cài đặt quán", icon: Settings, to: `${base}/settings` },
  ];
};

const adminNavigation: NavItem[] = [
  { label: "Tổng quan", icon: LayoutDashboard, to: "/admin/overview", end: true },
  { label: "Nhà hàng", icon: Store, to: "/admin/restaurants" },
  { label: "Người dùng", icon: Users, to: "/admin/users" },
  { label: "Đơn hàng", icon: ClipboardList, to: "/admin/orders" },
  { label: "Danh mục ẩm thực", icon: Tags, to: "/admin/cuisines" },
  { label: "Mã giảm giá", icon: TicketPercent, to: "/admin/coupons" },
  { label: "Kiểm duyệt đánh giá", icon: MessageSquareText, to: "/admin/reviews" },
  { label: "Phân tích", icon: BarChart3, to: "/admin/analytics" },
  { label: "Nhật ký hệ thống", icon: Clock3, to: "/admin/audit-logs" },
];

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const restaurantsQuery = useQuery({
    queryKey: ["owner", "restaurants", "shell"],
    queryFn: () => api.get<{ data: Restaurant[] }>("/owner/restaurants").then((response) => response.data.data),
    enabled: user?.role === "restaurant_owner",
    staleTime: 60_000,
  });

  const selectedRestaurant = restaurantsQuery.data?.find((restaurant) => restaurant._id === params.restaurantId);
  const navigation = useMemo(
    () => (user?.role === "admin" ? adminNavigation : ownerNavigation(params.restaurantId)),
    [params.restaurantId, user?.role],
  );

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const switchRestaurant = (restaurantId: string) => {
    localStorage.setItem("dashboardLastRestaurant", restaurantId);
    navigate(`/owner/restaurants/${restaurantId}/overview`);
  };

  return (
    <div className={`dashboard-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      {mobileOpen && <button className="mobile-backdrop" aria-label="Đóng menu" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${mobileOpen ? "sidebar-mobile-open" : ""}`}>
        <div className="sidebar-brand">
          <Link to={user?.role === "admin" ? "/admin/overview" : "/owner/restaurants"}>
            <span className="brand-mark"><ChefHat size={22} /></span>
            {!collapsed && <span className="brand-copy"><b>MămMăm</b><small>Console</small></span>}
          </Link>
          <button className="icon-button mobile-only" onClick={() => setMobileOpen(false)} aria-label="Đóng menu"><X size={19} /></button>
        </div>

        {!collapsed && (
          <div className="role-chip">
            {user?.role === "admin" ? <ShieldCheck size={16} /> : <Store size={16} />}
            <span>{user?.role === "admin" ? "Quản trị hệ thống" : "Kênh chủ nhà hàng"}</span>
          </div>
        )}

        {user?.role === "restaurant_owner" && !collapsed && (
          <div className="restaurant-switcher">
            <label htmlFor="restaurant-switch">Nhà hàng đang quản lý</label>
            <div className="select-wrap">
              <select
                id="restaurant-switch"
                value={params.restaurantId ?? ""}
                onChange={(event) => event.target.value && switchRestaurant(event.target.value)}
              >
                <option value="">Chọn nhà hàng</option>
                {restaurantsQuery.data?.map((restaurant) => <option key={restaurant._id} value={restaurant._id}>{restaurant.name}</option>)}
              </select>
              <ChevronDown size={15} />
            </div>
            {selectedRestaurant && <ApprovalBadge value={selectedRestaurant.approvalStatus} />}
          </div>
        )}

        <nav className="sidebar-nav" aria-label="Điều hướng chính">
          {!collapsed && <p>VẬN HÀNH</p>}
          {navigation.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} title={collapsed ? item.label : undefined}>
              <item.icon size={19} />{!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <NavLink to="/account" title={collapsed ? "Tài khoản" : undefined}><UserRoundCog size={19} />{!collapsed && <span>Tài khoản</span>}</NavLink>
          <button onClick={() => void logout()} title={collapsed ? "Đăng xuất" : undefined}><LogOut size={19} />{!collapsed && <span>Đăng xuất</span>}</button>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Mở menu"><Menu size={20} /></button>
            <button className="icon-button desktop-only" onClick={() => setCollapsed((value) => !value)} aria-label="Thu gọn menu"><PanelLeftClose size={20} /></button>
            <div className="topbar-context">
              <small>{user?.role === "admin" ? "MămMăm Platform" : "Nhà hàng"}</small>
              <strong>{user?.role === "admin" ? "Trung tâm quản trị" : selectedRestaurant?.name ?? "Kênh đối tác"}</strong>
            </div>
          </div>
          <div className="profile-menu">
            <button className="profile-trigger" onClick={() => setProfileOpen((value) => !value)} aria-expanded={profileOpen}>
              <span className="avatar">{initials(user?.fullName ?? "MM")}</span>
              <span className="desktop-only"><b>{user?.fullName}</b><small>{user?.email}</small></span>
              <ChevronDown size={15} />
            </button>
            {profileOpen && (
              <div className="profile-popover">
                <Link to="/account" onClick={() => setProfileOpen(false)}><UserRoundCog size={17} /> Hồ sơ tài khoản</Link>
                <button onClick={() => void logout()}><LogOut size={17} /> Đăng xuất</button>
              </div>
            )}
          </div>
        </header>
        <main className="page-container"><Outlet /></main>
      </div>
    </div>
  );
}
