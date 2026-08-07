import { Outlet, Navigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export const PublicLayout = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    // Nếu đã login, chặn không cho vào trang Login/Register, đẩy vào Dashboard/Home
    if (user?.role === "admin") return <Navigate to="/admin" replace />;
    if (user?.role === "restaurant_owner")
      return <Navigate to="/owner" replace />;
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="layout-public">
      <header className="topbar">
        <div className="container topbar-inner">
          <Link className="brand" to="/">
            MămMăm
          </Link>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer id="footer" className="footer">
        <div className="container">
          <div className="copyright">
            <span>© 2026 MămMăm. All rights reserved.</span>
            <span>Quyền riêng tư · Điều khoản</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
