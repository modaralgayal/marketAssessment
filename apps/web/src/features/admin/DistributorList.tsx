import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchDistributors, deleteDistributor, syncDistributorsFromSheet } from "../../lib/api";
import { getSheetsToken } from "../../lib/googleSheets";
import AdminLayout from "./AdminLayout";
import CsvImport from "./CsvImport";

export default function DistributorList() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["distributors"],
    queryFn: fetchDistributors,
  });

  const [search, setSearch] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    try {
      setSyncing(true);
      const token = await getSheetsToken();
      const result = await syncDistributorsFromSheet(token);
      alert(`Sync complete: ${result.imported} imported, ${result.skipped} skipped.${result.errors.length ? `\n\nErrors:\n${result.errors.slice(0, 5).join("\n")}${result.errors.length > 5 ? `\n…and ${result.errors.length - 5} more` : ""}` : ""}`);
      await queryClient.invalidateQueries({ queryKey: ["distributors"] });
    } catch (err: any) {
      alert(err.message ?? "Failed to sync from Google Sheets.");
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      setDeletingId(id);
      await deleteDistributor(id);
      await queryClient.invalidateQueries({ queryKey: ["distributors"] });
    } catch (err) {
      alert("Failed to delete distributor.");
    } finally {
      setDeletingId(null);
    }
  };

  const items = (data ?? []).filter((d) => {
    const q = search.toLowerCase();
    return (
      !q ||
      d.companyName.toLowerCase().includes(q) ||
      d.cityRegion.toLowerCase().includes(q) ||
      d.channelType.toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold text-dark-blue">
          Distributors{" "}
          {data ? <span className="text-gray-400">({data.length})</span> : null}
        </h1>

        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, region, channel…"
            className="w-56 rounded border border-border bg-white px-3 py-2 text-sm outline-none focus:border-mid-blue"
          />
          <button
            onClick={() => setShowImport(!showImport)}
            className="rounded border border-mid-blue bg-white px-3 py-2 text-sm text-mid-blue hover:bg-pale-blue"
          >
            {showImport ? "Cancel Import" : "Import CSV"}
          </button>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="rounded border border-orange bg-white px-3 py-2 text-sm text-orange hover:bg-orange/10 disabled:opacity-50"
          >
            {syncing ? "Syncing…" : "Sync from Google Sheets"}
          </button>
          <Link
            to="/admin/distributors/new"
            className="rounded bg-mid-blue px-3 py-2 text-sm font-semibold text-white hover:bg-dark-blue"
          >
            + Add Distributor
          </Link>
        </div>
      </div>

      {showImport && (
        <div className="mb-6">
          <CsvImport onDone={() => { setShowImport(false); queryClient.invalidateQueries({ queryKey: ["distributors"] }); }} />
        </div>
      )}

      {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">Failed to load distributors.</p>}

      {data && (
        <div className="overflow-hidden rounded-lg border border-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-light-gray text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">City / Region</th>
                <th className="px-4 py-3">Channel / Type</th>
                <th className="px-4 py-3">Size / Scale</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Matches</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr key={d.id} className="border-t border-border hover:bg-pale-blue/40">
                  <td className="px-4 py-3 font-semibold">
                    <Link
                      to={`/admin/distributors/${d.id}`}
                      className="text-dark-blue hover:text-mid-blue hover:underline"
                    >
                      {d.companyName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{d.cityRegion}</td>
                  <td className="px-4 py-3 text-gray-600">{d.channelType}</td>
                  <td className="px-4 py-3 text-gray-600">{d.sizeScale ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {d.contactPerson && <div className="text-xs">{d.contactPerson}</div>}
                    {d.email && <div className="text-xs text-gray-400">{d.email}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {d.matchCount != null ? d.matchCount : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/admin/distributors/${d.id}/edit`}
                        className="text-xs text-mid-blue hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(d.id, d.companyName)}
                        disabled={deletingId === d.id}
                        className="text-xs text-red-500 hover:underline disabled:opacity-50"
                      >
                        {deletingId === d.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    {search ? "No distributors match your search." : "No distributors yet. Import or add one."}
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