import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";

const ROLE_LABEL: Record<string, string> = {
  BUYER: "Buyer workspace",
  MANUFACTURER: "Manufacturer workspace",
};

export default function DashboardLayout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const { account, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-brand-bg-alt">
      <header className="sticky top-0 z-10 border-b border-brand-line bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Tradelomacy" className="h-6 w-auto" />
            <span className="text-sm font-semibold text-brand-ink">
              {title ?? (account ? ROLE_LABEL[account.role] ?? "Workspace" : "Workspace")}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {account && <span className="text-xs text-brand-muted">{account.email}</span>}
            <button
              onClick={handleLogout}
              className="rounded-full border border-brand-line px-3 py-1.5 text-xs font-medium text-brand-ink transition-colors hover:border-brand-teal hover:text-brand-teal"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
