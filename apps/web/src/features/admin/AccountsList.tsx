import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAccounts, type AccountListDto } from "../../lib/api";
import AdminLayout from "./AdminLayout";

function roleLabel(role: string): string {
  return role === "BUYER" ? "Buyer" : role === "MANUFACTURER" ? "Manufacturer" : role;
}

function StatusBadge({ status }: { status: AccountListDto["status"] }) {
  const styles =
    status === "ACTIVE"
      ? "bg-emerald-50 text-emerald-700"
      : status === "DISABLED"
        ? "bg-red-50 text-red-700"
        : "bg-amber-100 text-amber-800";
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles}`}>{status}</span>
  );
}

const FILTERS = ["ALL", "BUYER", "MANUFACTURER"] as const;
type Filter = (typeof FILTERS)[number];

export default function AccountsList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
  });
  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");

  const all = data?.items ?? [];
  const filtered = all.filter((a) => {
    if (filter !== "ALL" && a.role !== filter) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      (a.companyName ?? "").toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-brand-ink">
          Manufacturers &amp; Buyers{" "}
          {data ? <span className="text-brand-muted">({all.length})</span> : null}
        </h1>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search company or email…"
          className="w-64 rounded border border-brand-line bg-white px-3 py-2 text-sm outline-none focus:border-brand-teal"
        />
      </div>

      <div className="mb-4 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              filter === f
                ? "bg-brand-teal text-white shadow-sm"
                : "border border-brand-line bg-white text-brand-muted hover:border-brand-teal"
            }`}
          >
            {f === "ALL" ? "All" : roleLabel(f)}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-brand-muted">Loading…</p>}
      {error && <p className="text-sm text-red-600">Failed to load accounts.</p>}

      {data && (
        <div className="overflow-hidden rounded-lg border border-brand-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-bg-alt text-xs uppercase tracking-wide text-brand-muted">
              <tr>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Signed up</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-t border-brand-line">
                  <td className="px-4 py-3 font-semibold text-brand-ink">{a.companyName ?? "—"}</td>
                  <td className="px-4 py-3 text-brand-muted">{a.email}</td>
                  <td className="px-4 py-3 text-brand-muted">{roleLabel(a.role)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="px-4 py-3 text-brand-muted">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-brand-muted">
                    No signed-up accounts yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
