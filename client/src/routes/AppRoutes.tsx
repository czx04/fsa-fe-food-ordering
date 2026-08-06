import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { ProtectedLayout } from "../layouts/ProtectedLayout";
import { PublicLayout } from "../layouts/PublicLayout";
import { AdminDashboard } from "../pages/AdminDashboard";
import { Home } from "../pages/Home";
import { Login } from "../pages/Login";
import { OwnerDashboard } from "../pages/OwnerDashboard";
import { Restaurants } from "../pages/Restaurants";
import CartPage from "../pages/CartPage";
import CheckoutPage from "../pages/CheckoutPage";
import PaymentSuccessPage from "../pages/PaymentSuccessPage";
import PaymentFailedPage from "../pages/PaymentFailedPage";
import OrderHistoryPage from "../pages/OrderHistoryPage";
import OrderDetailPage from "../pages/OrderDetailPage";

function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Navigate to="/home" />} />
            <Route path="/login" element={<Login />} />
          </Route>

          {/* Protected Routes for Everyone */}
          <Route element={<ProtectedLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/restaurants" element={<Restaurants />} />
          </Route>

          {/* Protected Routes for Admin */}
          <Route element={<ProtectedLayout allowedRoles={["admin"]} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          {/* Protected Routes for Restaurant Owner */}
          <Route
            element={<ProtectedLayout allowedRoles={["restaurant_owner"]} />}
          >
            <Route path="/owner" element={<OwnerDashboard />} />
          </Route>

          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/payment/failed" element={<PaymentFailedPage />} />
          <Route path="/orders" element={<OrderHistoryPage />} />
          <Route path="/order/:id" element={<OrderDetailPage />} />

          {/* Fallback 404 */}
          <Route
            path="*"
            element={
              <div style={{ padding: 50, textAlign: "center" }}>
                <h2>404 - Not Found</h2>
              </div>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default AppRoutes;
