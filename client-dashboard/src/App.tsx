import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router";
import { AuthenticatedRoute, RoleRoute } from "./app/route-guards";
import { PageLoader } from "./components/ui";
import { AuthLayout } from "./layouts/AuthLayout";
import { DashboardLayout } from "./layouts/DashboardLayout";

const LoginPage = lazy(() => import("./pages/auth").then((module) => ({ default: module.LoginPage })));
const ForgotPasswordPage = lazy(() => import("./pages/auth").then((module) => ({ default: module.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import("./pages/auth").then((module) => ({ default: module.ResetPasswordPage })));
const VerifyEmailPage = lazy(() => import("./pages/auth").then((module) => ({ default: module.VerifyEmailPage })));
const AccountPage = lazy(() => import("./pages/common").then((module) => ({ default: module.AccountPage })));
const ForbiddenPage = lazy(() => import("./pages/common").then((module) => ({ default: module.ForbiddenPage })));
const NotFoundPage = lazy(() => import("./pages/common").then((module) => ({ default: module.NotFoundPage })));
const RoleHomeRedirect = lazy(() => import("./pages/common").then((module) => ({ default: module.RoleHomeRedirect })));
const OwnerHomePage = lazy(() => import("./pages/owner").then((module) => ({ default: module.OwnerHomePage })));
const OwnerMenuItemEditorPage = lazy(() => import("./pages/owner").then((module) => ({ default: module.OwnerMenuItemEditorPage })));
const OwnerMenuPage = lazy(() => import("./pages/owner").then((module) => ({ default: module.OwnerMenuPage })));
const OwnerOnboardingPage = lazy(() => import("./pages/owner").then((module) => ({ default: module.OwnerOnboardingPage })));
const OwnerOrderDetailPage = lazy(() => import("./pages/owner").then((module) => ({ default: module.OwnerOrderDetailPage })));
const OwnerOrdersPage = lazy(() => import("./pages/owner").then((module) => ({ default: module.OwnerOrdersPage })));
const OwnerOverviewPage = lazy(() => import("./pages/owner").then((module) => ({ default: module.OwnerOverviewPage })));
const OwnerRestaurantsPage = lazy(() => import("./pages/owner").then((module) => ({ default: module.OwnerRestaurantsPage })));
const OwnerReviewsPage = lazy(() => import("./pages/owner").then((module) => ({ default: module.OwnerReviewsPage })));
const OwnerSettingsPage = lazy(() => import("./pages/owner").then((module) => ({ default: module.OwnerSettingsPage })));
const AdminAnalyticsPage = lazy(() => import("./pages/admin").then((module) => ({ default: module.AdminAnalyticsPage })));
const AdminAuditLogsPage = lazy(() => import("./pages/admin").then((module) => ({ default: module.AdminAuditLogsPage })));
const AdminCouponsPage = lazy(() => import("./pages/admin").then((module) => ({ default: module.AdminCouponsPage })));
const AdminCuisinesPage = lazy(() => import("./pages/admin").then((module) => ({ default: module.AdminCuisinesPage })));
const AdminOrderDetailPage = lazy(() => import("./pages/admin").then((module) => ({ default: module.AdminOrderDetailPage })));
const AdminOrdersPage = lazy(() => import("./pages/admin").then((module) => ({ default: module.AdminOrdersPage })));
const AdminOverviewPage = lazy(() => import("./pages/admin").then((module) => ({ default: module.AdminOverviewPage })));
const AdminRestaurantDetailPage = lazy(() => import("./pages/admin").then((module) => ({ default: module.AdminRestaurantDetailPage })));
const AdminRestaurantsPage = lazy(() => import("./pages/admin").then((module) => ({ default: module.AdminRestaurantsPage })));
const AdminReviewsPage = lazy(() => import("./pages/admin").then((module) => ({ default: module.AdminReviewsPage })));
const AdminUserDetailPage = lazy(() => import("./pages/admin").then((module) => ({ default: module.AdminUserDetailPage })));
const AdminUsersPage = lazy(() => import("./pages/admin").then((module) => ({ default: module.AdminUsersPage })));

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}><Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
      </Route>
      <Route element={<AuthenticatedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<RoleHomeRedirect />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/forbidden" element={<ForbiddenPage />} />
          <Route element={<RoleRoute role="restaurant_owner" />}>
            <Route path="/owner" element={<OwnerHomePage />} />
            <Route path="/owner/onboarding" element={<OwnerOnboardingPage />} />
            <Route path="/owner/restaurants" element={<OwnerRestaurantsPage />} />
            <Route path="/owner/restaurants/:restaurantId/overview" element={<OwnerOverviewPage />} />
            <Route path="/owner/restaurants/:restaurantId/orders" element={<OwnerOrdersPage />} />
            <Route path="/owner/restaurants/:restaurantId/orders/:orderId" element={<OwnerOrderDetailPage />} />
            <Route path="/owner/restaurants/:restaurantId/menu" element={<OwnerMenuPage />} />
            <Route path="/owner/restaurants/:restaurantId/menu/items/new" element={<OwnerMenuItemEditorPage />} />
            <Route path="/owner/restaurants/:restaurantId/menu/items/:itemId/edit" element={<OwnerMenuItemEditorPage />} />
            <Route path="/owner/restaurants/:restaurantId/reviews" element={<OwnerReviewsPage />} />
            <Route path="/owner/restaurants/:restaurantId/settings" element={<OwnerSettingsPage />} />
          </Route>
          <Route element={<RoleRoute role="admin" />}>
            <Route path="/admin/overview" element={<AdminOverviewPage />} />
            <Route path="/admin/restaurants" element={<AdminRestaurantsPage />} />
            <Route path="/admin/restaurants/:restaurantId" element={<AdminRestaurantDetailPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/users/:userId" element={<AdminUserDetailPage />} />
            <Route path="/admin/orders" element={<AdminOrdersPage />} />
            <Route path="/admin/orders/:orderId" element={<AdminOrderDetailPage />} />
            <Route path="/admin/cuisines" element={<AdminCuisinesPage />} />
            <Route path="/admin/coupons" element={<AdminCouponsPage />} />
            <Route path="/admin/reviews" element={<AdminReviewsPage />} />
            <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
            <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes></Suspense>
  );
}
