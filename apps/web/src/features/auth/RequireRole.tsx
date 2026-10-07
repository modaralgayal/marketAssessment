import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../../lib/auth";
import type { AccountRole } from "@mea/shared";

/**
 * Gates a self-service dashboard to signed-in users who have completed
 * invite-based sign-up with one of the allowed roles. Users without an Account
 * are sent to sign-up (carrying any invite they arrived with); users with the
 * wrong role land on their own dashboard.
 */
export default function RequireRole({
  roles,
  children,
}: {
  roles: AccountRole[];
  children: ReactNode;
}) {
  const { user, loading, account, accountLoading } = useAuth();

  if (loading || (user && accountLoading)) {
    return <div className="p-16 text-center text-sm text-brand-muted">Loading…</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!account) {
    return <Navigate to="/signup" replace />;
  }
  if (!roles.includes(account.role)) {
    return <Navigate to={account.role === "BUYER" ? "/buyer" : "/manufacturer"} replace />;
  }
  return <>{children}</>;
}
