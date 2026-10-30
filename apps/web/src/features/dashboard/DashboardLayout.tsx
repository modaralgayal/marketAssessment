import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { useQuery } from "@tanstack/react-query";
import { fetchPrivacyVersion, acceptPrivacy } from "../../lib/api";

export interface NavItem {
  key: string;
  label: string;
  count?: number;
}

const ROLE_LABEL: Record<string, string> = {
  BUYER: "Buyer workspace",
  MANUFACTURER: "Manufacturer workspace",
};

interface Props {
  role: "BUYER" | "MANUFACTURER";
  navItems: NavItem[];
  active: string;
  onSelect: (key: string) => void;
  /** 0–100 profile completion shown as the sidebar progress bar. */
  completion?: number;
  children: ReactNode;
}

export default function DashboardLayout({ role, navItems, active, onSelect, completion = 0, children }: Props) {
  const { account, logout } = useAuth();
  const navigate = useNavigate();

  const { data: privacy } = useQuery({
    queryKey: ["privacyVersion"],
    queryFn: fetchPrivacyVersion,
  });
  const accepted = account?.privacyAcceptedVersion ?? 0;
  const latest = privacy?.version ?? 0;
  const needsAccept = latest > 0 && accepted < latest;

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };
  const handleAccept = async () => {
    try {
      await acceptPrivacy();
    } catch {
      /* surfaced by settings */
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg-alt">
      <div className="flex w-full gap-0">
        {/* ── Sidebar ── */}
        <aside className="sticky top-0 hidden h-screen w-[246px] shrink-0 flex-col border-r border-brand-line bg-white px-4 py-5 md:flex">
          <div className="flex items-center gap-2 px-1">
            <Link to={role === "BUYER" ? "/buyer" : "/manufacturer"} aria-label="Back to overview">
              <img src="/logo.svg" alt="Tradelomacy" className="h-6 w-auto" />
            </Link>
          </div>

          <div className="mt-6 px-1">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-muted">
              {role === "BUYER" ? "Buyer" : "Manufacturer"}
            </p>
            <p className="truncate text-sm font-semibold text-brand-ink">workspace</p>
          </div>

          {completion > 0 && (
            <div className="mt-4 px-1">
              <div className="flex items-center justify-between text-xs text-brand-muted">
                <span>Profile completion</span>
                <span>{completion}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-brand-bg-alt">
                <div
                  className="h-full rounded-full bg-brand-teal transition-all"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>
          )}

          <nav className="mt-5 flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = item.key === active;
              return (
                <button
                  key={item.key}
                  onClick={() => onSelect(item.key)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brand-teal/10 text-brand-teal"
                      : "text-brand-ink hover:bg-brand-bg-alt"
                  }`}
                >
                  <span>{item.label}</span>
                  {typeof item.count === "number" && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        isActive ? "bg-brand-teal text-white" : "bg-brand-bg-alt text-brand-muted"
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="space-y-2 border-t border-brand-line pt-3">
            <Link
              to="/settings"
              className="block rounded-lg px-3 py-2 text-sm font-medium text-brand-ink hover:bg-brand-bg-alt"
            >
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-brand-ink hover:bg-brand-bg-alt"
            >
              Sign out
            </button>
          </div>
        </aside>

        {/* ── Main column ── */}
        <div className="min-w-0 flex-1">
          {/* Topbar */}
          <header className="sticky top-0 z-10 border-b border-brand-line bg-white/95 backdrop-blur">
            <div className="flex h-14 items-center justify-between px-4 md:px-6">
              <div className="flex items-center gap-2 md:hidden">
                <Link to={role === "BUYER" ? "/buyer" : "/manufacturer"} aria-label="Back to overview">
                  <img src="/logo.svg" alt="Tradelomacy" className="h-5 w-auto" />
                </Link>
              </div>
              <span className="hidden text-sm font-semibold text-brand-ink md:block">
                {ROLE_LABEL[role] ?? "Workspace"}
              </span>
              <div className="flex items-center gap-3">
                {/* Mobile nav */}
                <select
                  value={active}
                  onChange={(e) => onSelect(e.target.value)}
                  className="rounded-lg border border-brand-line bg-white px-2 py-1.5 text-sm text-brand-ink md:hidden"
                >
                  {navItems.map((i) => (
                    <option key={i.key} value={i.key}>
                      {i.label}
                    </option>
                  ))}
                </select>
                {account && <span className="hidden text-xs text-brand-muted sm:block">{account.email}</span>}
              </div>
            </div>
          </header>

          {needsAccept && (
            <div className="border-b border-amber-200 bg-amber-50">
              <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-2 px-4 py-2.5 md:px-6">
                <p className="text-sm text-amber-800">
                  A new privacy policy (v{latest}) is available — please review and accept it.
                </p>
                <div className="flex items-center gap-3">
                  <Link
                    to="/privacy"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-amber-900 underline"
                  >
                    View policy
                  </Link>
                  <button
                    onClick={handleAccept}
                    className="rounded-full bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Accept
                  </button>
                </div>
              </div>
            </div>
          )}

          <main className="px-4 py-6 md:px-6 md:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
