import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";

export const AdminDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div
      style={{
        padding: "60px 20px",
        textAlign: "center",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      <div style={{ fontSize: "64px", marginBottom: "16px" }}>⚙️</div>
      <h2>Admin Dashboard</h2>
      <p className="muted" style={{ fontSize: "18px", margin: "12px 0 24px" }}>
        Xin chào <b>{user?.fullName || "Admin"}</b> ({user?.email})!
      </p>

      <div
        style={{
          background: "#fff3cd",
          color: "#856404",
          padding: "16px 24px",
          borderRadius: "12px",
          fontWeight: 600,
          marginBottom: "32px",
          border: "1px solid #ffeeba",
        }}
      >
        🚧 Feature under construction (Đang phát triển)
      </div>

      <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
        <Link className="btn btn-outline" to="/home">
          Về trang chủ
        </Link>
        <button className="btn" onClick={logout}>
          Đăng xuất
        </button>
      </div>
    </div>
  );
};
