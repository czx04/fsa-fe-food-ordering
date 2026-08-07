import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../utils/api";

export const Login = () => {
  const [email, setEmail] = useState("customer@foodordering.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await api.post("/auth/login", { email, password });
      login(res.data.accessToken, res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || "Đăng nhập thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-art">
        <Link className="brand" to="/home">
          MămMăm
        </Link>
        <div className="center">
          <img src="/assets/noodles.jpg" alt="Món ngon" />
          <h2 style={{ marginTop: "30px" }}>Món ngon luôn chờ bạn</h2>
          <p className="muted">
            Hơn 1.000 nhà hàng, hàng ngàn lựa chọn mỗi ngày.
          </p>
        </div>
        <span className="caption">© 2026 MămMăm</span>
      </section>

      <section className="auth-form-wrap">
        <form className="auth-form" onSubmit={handleLogin}>
          <Link className="brand" to="/home">
            MămMăm
          </Link>
          <h1 style={{ marginTop: "35px" }}>Chào mừng trở lại!</h1>
          <p className="muted">
            Đăng nhập để tiếp tục hành trình ẩm thực của bạn.
          </p>

          {error && (
            <div style={{ color: "red", marginTop: "16px" }}>{error}</div>
          )}

          <div className="field">
            <label>Email hoặc số điện thoại</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <div className="password-line">
              <label>Mật khẩu</label>
              <Link className="link caption" to="/forgot-password">
                Quên mật khẩu?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <label className="check">
            <input type="checkbox" defaultChecked /> Ghi nhớ đăng nhập
          </label>

          <button type="submit" className="btn btn-block" disabled={isLoading}>
            {isLoading ? "Đang xử lý..." : "Đăng nhập"}
          </button>

          <div className="divider">hoặc tiếp tục với</div>
          <div className="social-login">
            <button type="button" className="btn btn-outline">
              G Google
            </button>
            <button type="button" className="btn btn-outline">
              ● Facebook
            </button>
          </div>

          <p className="center muted" style={{ marginTop: "24px" }}>
            Chưa có tài khoản?{" "}
            <Link className="link" to="/register">
              Đăng ký ngay
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
};
