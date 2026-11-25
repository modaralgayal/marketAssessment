import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { MarketingLayout } from "../marketing/MarketingLayout";

/**
 * Routes that are always public, even to a signed-in account holder. They don't
 * disrupt the persistent session — navigating away from them bounces back to the
 * workspace as usual via the still-guarded routes.
 */
const ALWAYS_PUBLIC = new Set(["/privacy"]);

/**
 * Guards the public marketing site. A signed-in account holder (buyer or
 * manufacturer with an active workspace) is redirected to their dashboard — they
 * must sign out to view those pages. Users still mid-onboarding (signed in to
 * Firebase but without an Account yet) are allowed through. A small allow-list
 * (e.g. the privacy policy) stays viewable while signed in.
 */
export default function PublicOnlyRoute() {
  const { account, loading, accountLoading } = useAuth();
  const { pathname } = useLocation();

  if (loading || accountLoading) {
    return <div className="p-16 text-center text-sm text-brand-muted">Loading…</div>;
  }
  if (account && !ALWAYS_PUBLIC.has(pathname)) {
    return <Navigate to={account.role === "BUYER" ? "/buyer" : "/manufacturer"} replace />;
  }
  return <MarketingLayout />;
}
