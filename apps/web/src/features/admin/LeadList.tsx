import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchLeads, type LeadListResponse } from "../../lib/api";
import type { LeadDto } from "@mea/shared";
import AdminLayout from "./AdminLayout";

type KindFilter = "ALL" | "EXPORTING" | "SOURCING" | "ORGANIZATION";

const KIND_LABEL: Record<string, string> = {
  EXPORTING: "Exporting",
  SOURCING: "Sourcing",
  ORGANIZATION: "Organization",
};

const KIND_BADGE: Record<string, string> = {
  EXPORTING: "bg-brand-teal/15 text-brand-teal",
  SOURCING: "bg-indigo-100 text-indigo-700",
  ORGANIZATION: "bg-amber-100 text-amber-800",
};

/** Primary display name for a lead row, depending on its kind. */
function leadName(l: LeadDto): string {
  return l.companyName || l.organizationName || l.fullName || "—";
}

export default function LeadList() {
  const [filter, setFilter] = useState<KindFilter>("ALL");
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useQuery<LeadListResponse>({
    queryKey: ["leads", filter],
    queryFn: () => fetchLeads(filter === "ALL" ? undefined : filter),
  });

  const items = (data?.items ?? []).filter((l) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      (l.companyName ?? "").toLowerCase().includes(q) ||
      (l.organizationName ?? "").toLowerCase().includes(q) ||
      (l.fullName ?? "").toLowerCase().includes(q) ||
      (l.email ?? "").toLowerCase().includes(q) ||
      (l.country ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-brand-ink">
          Leads{" "}
          {data ? <span className="text-brand-muted">({data.total})</span> : null}
        </h1>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, country…"
          className="w-64 rounded border border-brand-line bg-white px-3 py-2 text-sm outline-none focus:border-brand-teal"
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(["ALL", "EXPORTING", "SOURCING", "ORGANIZATION"] as KindFilter[]).map((k) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              filter === k
                ? "bg-brand-teal text-white"
                : "border border-brand-line bg-white text-brand-muted hover:border-brand-teal hover:text-brand-teal"
            }`}
          >
            {k === "ALL" ? "All" : KIND_LABEL[k]}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-brand-muted">Loading…</p>}
      {error && <p className="text-sm text-red-600">Failed to load leads.</p>}

      {data && (
        <div className="overflow-hidden rounded-lg border border-brand-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-bg-alt text-xs uppercase tracking-wide text-brand-muted">
              <tr>
                <th className="px-4 py-3">Kind</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Received</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((l) => (
                <tr key={l.id} className="border-t border-brand-line hover:bg-[#0F7B7F]/5">
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                        KIND_BADGE[l.kind] ?? "bg-gray-100 text-brand-ink"
                      }`}
                    >
                      {l.kind}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/leads/${l.id}`}
                      className="font-semibold text-brand-teal hover:underline"
                    >
                      {leadName(l)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-brand-muted">{l.country ?? "—"}</td>
                  <td className="px-4 py-3 text-brand-muted">{l.email ?? "—"}</td>
                  <td className="px-4 py-3 text-brand-muted">{l.sourcePage ?? "—"}</td>
                  <td className="px-4 py-3 text-brand-muted">
                    {new Date(l.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/leads/${l.id}`}
                      className="text-sm text-brand-muted hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-brand-muted">
                    No leads yet.
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
