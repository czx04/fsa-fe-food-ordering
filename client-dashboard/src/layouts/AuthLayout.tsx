import { Outlet } from "react-router";
import { ChefHat, ShieldCheck, Sparkles } from "lucide-react";

export function AuthLayout() {
  return (
    <main className="auth-shell">
      <section className="auth-art" aria-label="MămMăm Dashboard">
        <div className="auth-brand"><ChefHat size={22} /><span>MămMăm</span><b>Console</b></div>
        <div className="auth-art-copy">
          <span className="eyebrow"><Sparkles size={14} /> Không gian vận hành</span>
          <h1>Một nơi để quản lý mọi nhịp vận hành.</h1>
          <p>Theo dõi đơn hàng, thực đơn và hiệu suất nhà hàng bằng dữ liệu rõ ràng, cập nhật liên tục.</p>
          <div className="auth-proof"><ShieldCheck size={18} /><span>Phân quyền riêng cho Chủ nhà hàng và Quản trị viên</span></div>
        </div>
        <div className="auth-orb auth-orb-one" />
        <div className="auth-orb auth-orb-two" />
      </section>
      <section className="auth-form-panel">
        <Outlet />
      </section>
    </main>
  );
}
