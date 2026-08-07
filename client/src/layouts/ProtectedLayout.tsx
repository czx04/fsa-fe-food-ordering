import { Outlet, Navigate, Link, NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedLayoutProps {
  allowedRoles?: string[];
}

export const ProtectedLayout = ({ allowedRoles }: ProtectedLayoutProps) => {
  const { isAuthenticated, user, isLoading, logout } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <div>403 - Forbidden (Không có quyền truy cập)</div>;
  }

  return (
    <div className="layout-protected">
      <header className="topbar">
        <div className="container topbar-inner">
          <Link className="brand" to="/home">
            MămMăm
          </Link>
          <nav className="nav">
            <NavLink to="/home">Trang chủ</NavLink>
            <NavLink to="/restaurants">Nhà hàng</NavLink>
            <NavLink to="/orders">Đơn hàng</NavLink>
          </nav>
          <div className="nav-actions">
            <button className="icon-btn">⌕</button>
            <Link className="icon-btn" to="/profile">
              ♙
            </Link>
            <Link className="icon-btn cart-btn" to="/cart">
              🛒
            </Link>
            <button
              className="btn btn-sm"
              onClick={logout}
              style={{
                marginLeft: "10px",
                background: "transparent",
                color: "#ff5a1f",
                border: "1px solid #ff5a1f",
              }}
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main style={{ minHeight: "60vh" }}>
        <Outlet />
      </main>

      <footer id="footer" className="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <Link className="brand" to="/home">
                MămMăm
              </Link>
              <p
                className="muted"
                style={{ maxWidth: "280px", marginTop: "18px" }}
              >
                Món ngon quanh bạn, giao nhanh đến cửa. Một trải nghiệm đặt món
                nhẹ nhàng và đầy cảm hứng.
              </p>
            </div>
            <div>
              <h4>Khám phá</h4>
              <Link to="/restaurants">Nhà hàng</Link>
            </div>
            <div>
              <h4>Dịch vụ</h4>
              <Link to="/profile">Tài khoản</Link>
            </div>
          </div>
          <div className="copyright">
            <span>© 2026 MămMăm. All rights reserved.</span>
            <span>Quyền riêng tư · Điều khoản</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
