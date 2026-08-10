import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../lib/auth";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-brand-bg-alt">
      <header className="flex items-center justify-between bg-brand-teal px-8 py-4">
        <Link to="/admin" className="flex items-center gap-2.5">
          <div className="h-2.5 w-2.5 rounded-full bg-white" />
          <span className="text-xs font-bold uppercase tracking-[3px] text-white">
            [Platform Name] · Admin
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-xs text-white/70">
          <Link to="/admin" className="hover:text-white">Submissions</Link>
          <Link to="/admin/distributors" className="hover:text-white">Distributors</Link>
          <Link to="/admin/customers" className="hover:text-white">Customers</Link>
        </nav>
        <div className="flex items-center gap-4 text-xs text-white/70">
          <span>{user?.email}</span>
          <button onClick={() => logout()} className="rounded bg-white/10 px-3 py-1.5 hover:bg-white/20">
            Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-[1000px] px-6 py-8">{children}</main>
    </div>
  );
}
