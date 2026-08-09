import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "./AuthContext";
import { PageLoader } from "../components/ui";
import type { UserRole } from "../types";

export function AuthenticatedRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

export function RoleRoute({ role }: { role: UserRole }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to="/forbidden" replace />;
  return <Outlet />;
}
