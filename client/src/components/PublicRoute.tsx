import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export const PublicRoute = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    if (user?.role === "admin") return <Navigate to="/admin" replace />;
    if (user?.role === "restaurant_owner")
      return <Navigate to="/owner" replace />;
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
};
