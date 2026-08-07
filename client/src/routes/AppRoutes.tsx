import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { MainLayout } from "../layouts/MainLayout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { PublicRoute } from "../components/PublicRoute";
import { AdminDashboard } from "../pages/AdminDashboard";
import { Home } from "../pages/Home";
import { Login } from "../pages/Login";
import { Register } from "../pages/Register";
import { ForgotPassword } from "../pages/ForgotPassword";
import { OwnerDashboard } from "../pages/OwnerDashboard";
import { Restaurants } from "../pages/Restaurants";
import { RestaurantDetail } from "../pages/RestaurantDetail";
import { DishDetail } from "../pages/DishDetail";
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
          <Route element={<MainLayout />}>
            {/* Public Routes (Accessible by everyone) */}
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/restaurants" element={<Restaurants />} />
            <Route path="/restaurants/:restaurantSlug" element={<RestaurantDetail />} />
            <Route path="/restaurants/:restaurantSlug/menu-items/:itemSlug" element={<DishDetail />} />

            {/* Auth Routes (Guest Only - Redirects to /home if logged in) */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>

            {/* Protected Routes for Admin */}
            <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            {/* Protected Routes for Restaurant Owner */}
            <Route element={<ProtectedRoute allowedRoles={["restaurant_owner"]} />}>
              <Route path="/owner" element={<OwnerDashboard />} />
            </Route>

            {/* Protected Routes for Customers */}
            <Route element={<ProtectedRoute />}>
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/payment/success" element={<PaymentSuccessPage />} />
              <Route path="/payment/failed" element={<PaymentFailedPage />} />
              <Route path="/orders" element={<OrderHistoryPage />} />
              <Route path="/order/:id" element={<OrderDetailPage />} />
            </Route>

            {/* Fallback 404 */}
            <Route
              path="*"
              element={
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                  <h2 className="text-4xl font-black text-slate-800 mb-2">404</h2>
                  <p className="text-slate-500 font-medium">Trang không tồn tại</p>
                </div>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default AppRoutes;
