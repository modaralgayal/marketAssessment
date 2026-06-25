import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../lib/auth";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      <header className="flex items-center justify-between bg-dark-blue px-8 py-4">
        <Link to="/admin" className="flex items-center gap-2.5">
          <div className="h-2.5 w-2.5 rounded-full bg-orange" />
          <span className="text-xs font-bold uppercase tracking-[3px] text-white">
            Integrate Us · Admin
          </span>
        </Link>
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
