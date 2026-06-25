import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchSubmissions } from "../../lib/api";
import AdminLayout from "./AdminLayout";

export default function AdminList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["submissions"],
    queryFn: fetchSubmissions,
  });
  const [search, setSearch] = useState("");

  const items = (data?.items ?? []).filter((s) => {
    const q = search.toLowerCase();
    return (
      !q ||
      s.companyName.toLowerCase().includes(q) ||
      s.contactEmail.toLowerCase().includes(q) ||
      s.country.toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold text-dark-blue">
          Submissions {data ? <span className="text-gray-400">({data.total})</span> : null}
        </h1>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search company, email, country…"
          className="w-64 rounded border border-border bg-white px-3 py-2 text-sm outline-none focus:border-mid-blue"
        />
      </div>

      {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">Failed to load submissions.</p>}

      {data && (
        <div className="overflow-hidden rounded-lg border border-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-light-gray text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Files</th>
                <th className="px-4 py-3">Received</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id} className="border-t border-border hover:bg-pale-blue/40">
                  <td className="px-4 py-3">
                    <Link to={`/admin/submissions/${s.id}`} className="font-semibold text-mid-blue hover:underline">
                      {s.companyName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.country}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {s.contactFullName}
                    <br />
                    <span className="text-xs text-gray-400">{s.contactEmail}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.files.length}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No submissions yet.
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
