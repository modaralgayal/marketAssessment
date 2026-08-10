import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchCustomers } from "../../lib/api";
import AdminLayout from "./AdminLayout";

export default function CustomerList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["customers"],
    queryFn: fetchCustomers,
  });

  const [search, setSearch] = useState("");

  const items = (data ?? []).filter((c) => {
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

  return (
    <AdminLayout>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold text-brand-ink">
          Customers{" "}
          {data ? (
            <span className="text-brand-muted">({data.length})</span>
          ) : null}
        </h1>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search company, email, country…"
          className="w-64 rounded border border-brand-line bg-white px-3 py-2 text-sm outline-none focus:border-brand-teal"
        />
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
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Onboarded</th>
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
                  <td className="px-4 py-3 text-brand-muted">
                    {c.contactFullName}
                    <br />
                    <span className="text-xs text-brand-muted">{c.contactEmail}</span>
                  </td>
                  <td className="px-4 py-3 text-brand-muted">
                    {new Date(c.onboardingDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
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