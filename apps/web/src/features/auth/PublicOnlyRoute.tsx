import { Navigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { MarketingLayout } from "../marketing/MarketingLayout";

/**
 * Guards the public marketing site. A signed-in account holder (buyer or
 * manufacturer with an active workspace) is redirected to their dashboard — they
 * must sign out to view the public pages. Users still mid-onboarding (signed in
 * to Firebase but without an Account yet) are allowed through.
 */
export default function PublicOnlyRoute() {
  const { account, loading, accountLoading } = useAuth();

  if (loading || accountLoading) {
    return <div className="p-16 text-center text-sm text-brand-muted">Loading…</div>;
  }
  if (account) {
    return <Navigate to={account.role === "BUYER" ? "/buyer" : "/manufacturer"} replace />;
  }
  return <MarketingLayout />;
}
