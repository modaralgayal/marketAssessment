import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCustomers, deleteCustomer } from "../../lib/api";
import AdminLayout from "./AdminLayout";

type Cat = "CUSTOMER" | "POTENTIAL" | "OTHER";

const TABS: Array<{ key: Cat; label: string }> = [
  { key: "CUSTOMER", label: "Customers" },
  { key: "POTENTIAL", label: "Potential Customers" },
  { key: "OTHER", label: "Other" },
];

export default function CustomerList() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["customers"],
    queryFn: fetchCustomers,
  });

  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<Cat>("CUSTOMER");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await deleteCustomer(id);
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete customer");
    } finally {
      setDeletingId(null);
    }
  };

  const counts: Record<Cat, number> = {
    CUSTOMER: (data ?? []).filter((c) => c.category === "CUSTOMER").length,
    POTENTIAL: (data ?? []).filter((c) => c.category === "POTENTIAL").length,
    OTHER: (data ?? []).filter((c) => c.category === "OTHER").length,
  };

  const items = (data ?? [])
    .filter((c) => c.category === cat)
    .filter((c) => {
      const q = search.toLowerCase();
      return (
        !q ||
        c.companyName.toLowerCase().includes(q) ||
        c.contactEmail.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q)
      );
    });

  const statusBadge = (status: string) => {
    switch (status) {
      case "QUALIFYING": return "bg-amber-100 text-amber-800";
      case "ACTIVE": return "bg-green-100 text-green-800";
      case "INACTIVE": return "bg-gray-100 text-brand-muted";
      case "WON": return "bg-blue-100 text-blue-800";
      case "LOST": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const categoryBadge = (category: string) => {
    switch (category) {
      case "CUSTOMER": return "bg-brand-teal/15 text-brand-teal";
      case "POTENTIAL": return "bg-amber-100 text-amber-800";
      case "OTHER": return "bg-gray-100 text-brand-muted";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <AdminLayout>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold text-brand-ink">Manufacturers / Brands</h1>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search company, email, country…"
          className="w-64 rounded border border-brand-line bg-white px-3 py-2 text-sm outline-none focus:border-brand-teal"
        />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setCat(t.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              cat === t.key
                ? "bg-brand-teal text-white shadow-sm"
                : "border border-brand-line bg-white text-brand-muted hover:border-brand-teal hover:text-brand-teal"
            }`}
          >
            {t.label} <span className="opacity-70">({counts[t.key]})</span>
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-brand-muted">Loading…</p>}
      {error && <p className="text-sm text-red-600">Failed to load customers.</p>}

      {data && (
        <div className="overflow-hidden rounded-lg border border-brand-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-bg-alt text-xs uppercase tracking-wide text-brand-muted">
              <tr>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Onboarded</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-t border-brand-line hover:bg-[#0F7B7F]/5">
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/customers/${c.id}`}
                      className="font-semibold text-brand-teal hover:underline"
                    >
                      {c.companyName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-brand-muted">{c.country}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${statusBadge(c.customerStatus)}`}>
                      {c.customerStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${categoryBadge(c.category)}`}>
                      {c.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-brand-muted">
                    {c.contactFullName}
                    <br />
                    <span className="text-xs text-brand-muted">{c.contactEmail}</span>
                  </td>
                  <td className="px-4 py-3 text-brand-muted">
                    {new Date(c.onboardingDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(c.id, c.companyName)}
                      disabled={deletingId === c.id}
                      className="text-sm text-red-600 hover:underline disabled:opacity-50"
                    >
                      {deletingId === c.id ? "Deleting…" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-brand-muted"
                  >
                    {search ? "No customers match your search." : "No customers yet."}
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