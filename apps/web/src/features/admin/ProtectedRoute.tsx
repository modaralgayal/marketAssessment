import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../../lib/auth";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="p-16 text-center text-sm text-gray-500">Loading…</div>;
  }
  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
}
