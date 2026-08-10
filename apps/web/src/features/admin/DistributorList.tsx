import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchDistributors, syncDistributorsFromSheet, recalcDataTiers } from "../../lib/api";
import { getSheetsToken, preloadGis } from "../../lib/googleSheets";
import AdminLayout from "./AdminLayout";

export default function DistributorList() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["distributors"],
    queryFn: fetchDistributors,
  });

  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [recalcTiers, setRecalcTiers] = useState(false);
  const [showActions, setShowActions] = useState(false);

  // Pre-load GIS library so the OAuth popup opens immediately on user click
  useEffect(() => { preloadGis(); }, []);

  const handleRecalcTiers = async () => {
    try {
      setRecalcTiers(true);
      const result = await recalcDataTiers();
      alert(`Recalculated tiers for ${result.updated} distributors.`);
      await queryClient.invalidateQueries({ queryKey: ["distributors"] });
    } catch (err: any) {
      alert(err.message ?? "Failed to recalculate tiers.");
    } finally {
      setRecalcTiers(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);

      // Race the OAuth token against a 30s timeout so the UI never hangs forever
      const token = await Promise.race([
        getSheetsToken(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("OAuth timed out. Check your popup blocker and try again.")), 30_000)
        ),
      ]);

      const result = await syncDistributorsFromSheet(token);
      alert(`Sync complete: ${result.imported} imported, ${result.updated} updated, ${result.skipped} skipped.${result.errors.length ? `\n\nErrors:\n${result.errors.slice(0, 5).join("\n")}${result.errors.length > 5 ? `\n…and ${result.errors.length - 5} more` : ""}` : ""}`);
      await queryClient.invalidateQueries({ queryKey: ["distributors"] });
    } catch (err: any) {
      alert(err.message ?? "Failed to sync from Google Sheets.");
    } finally {
      setSyncing(false);
    }
  };

  const items = (data ?? []).filter((d) => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      d.companyName.toLowerCase().includes(q) ||
      d.cityRegion.toLowerCase().includes(q) ||
      d.channelType.toLowerCase().includes(q);
    const matchesTier = tierFilter === null || d.dataTier === tierFilter;
    return matchesSearch && matchesTier;
  });

  return (
    <AdminLayout>
      <div className="mb-5 grid grid-cols-3 items-center">
        <h1 className="text-xl font-bold text-brand-ink">
          Distributors{" "}
          {data ? <span className="text-brand-muted">({data.length})</span> : null}
        </h1>

        <div className="flex items-center justify-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, region, channel…"
            className="w-64 rounded border border-brand-line bg-white px-3 py-2 text-sm outline-none focus:border-brand-teal"
          />
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTierFilter(null)}
              className={`rounded px-2 py-1 text-xs font-semibold ${tierFilter === null ? "bg-brand-teal text-white" : "bg-gray-100 text-brand-muted hover:bg-[#0F7B7F]/5"}`}
            >
              All
            </button>
            {[1, 2, 3].map((t) => (
              <button
                key={t}
                onClick={() => setTierFilter(tierFilter === t ? null : t)}
                className={`rounded px-2 py-1 text-xs font-semibold ${
                  tierFilter === t
                    ? t === 1 ? "bg-green-700 text-white" : t === 2 ? "bg-amber-600 text-white" : "bg-gray-400 text-white"
                    : "bg-gray-100 text-brand-muted hover:bg-[#0F7B7F]/5"
                }`}
              >
                T{t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Link
            to="/admin/distributors/new"
            className="rounded bg-brand-teal px-3 py-2 text-sm font-semibold text-white hover:bg-brand-teal-dark"
          >
            + Add
          </Link>
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="rounded border border-brand-line px-3 py-2 text-sm text-brand-muted hover:bg-brand-bg-alt"
            >
              ⋮
            </button>
            {showActions && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-lg border border-brand-line bg-white py-1 shadow-lg">
                  <button
                    onClick={() => { setShowActions(false); handleSync(); }}
                    disabled={syncing}
                    className="flex w-full items-center px-4 py-2 text-sm text-brand-ink hover:bg-brand-bg-alt disabled:opacity-50"
                  >
                    {syncing ? "Syncing…" : "Sync from Google Sheets"}
                  </button>
                  <button
                    onClick={() => { setShowActions(false); handleRecalcTiers(); }}
                    disabled={recalcTiers}
                    className="flex w-full items-center px-4 py-2 text-sm text-brand-ink hover:bg-brand-bg-alt disabled:opacity-50"
                  >
                    {recalcTiers ? "Recalculating…" : "Recalc Tiers"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {isLoading && <p className="text-sm text-brand-muted">Loading…</p>}
      {error && <p className="text-sm text-red-600">Failed to load distributors.</p>}

      {data && (
        <div className="overflow-hidden rounded-lg border border-brand-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-bg-alt text-xs uppercase tracking-wide text-brand-muted">
              <tr>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">City / Region</th>
                <th className="px-4 py-3">Channel / Type</th>
                <th className="px-4 py-3">Size / Scale</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Matches</th>
              </tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr key={d.id} className="border-t border-brand-line hover:bg-[#0F7B7F]/5">
                  <td className="px-4 py-3 font-semibold">
                    <Link
                      to={`/admin/distributors/${d.id}`}
                      className="text-brand-ink hover:text-brand-teal hover:underline"
                    >
                      {d.companyName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      d.dataTier === 1 ? "bg-green-100 text-green-800" : d.dataTier === 2 ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-brand-muted"
                    }`}>
                      T{d.dataTier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-brand-muted">{d.cityRegion}</td>
                  <td className="px-4 py-3 text-brand-muted">{d.channelType}</td>
                  <td className="px-4 py-3 text-brand-muted">{d.sizeScale ?? "—"}</td>
                  <td className="px-4 py-3 text-brand-muted">
                    {d.contactPerson && <div className="text-xs">{d.contactPerson}</div>}
                    {d.email && <div className="text-xs text-brand-muted">{d.email}</div>}
                  </td>
                  <td className="px-4 py-3 text-brand-muted">
                    {d.matchCount != null ? d.matchCount : "—"}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-brand-muted">
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