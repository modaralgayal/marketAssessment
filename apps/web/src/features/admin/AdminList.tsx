import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchSubmissions,
  evaluateSubmission,
  findMatches,
} from "../../lib/api";
import AdminLayout from "./AdminLayout";

export default function AdminList() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["submissions"],
    queryFn: fetchSubmissions,
  });

  const [search, setSearch] = useState("");

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [matchingId, setMatchingId] = useState<string | null>(null);

  const evaluateSubmissionForRow = async (id: string) => {
    try {
      setLoadingId(id);

      // Send just the submission ID to scoring API
      await evaluateSubmission(id);

      // Refetch to get updated scores from database
      await queryClient.invalidateQueries({ queryKey: ["submissions"] });
    } catch (err) {
      console.log(err);
      alert("Failed to evaluate submission.");
    } finally {
      setLoadingId(null);
    }
  };

  const findMatchesForRow = async (id: string) => {
    try {
      setMatchingId(id);
      await findMatches(id);
      await queryClient.invalidateQueries({ queryKey: ["submissions"] });
    } catch (err) {
      console.log(err);
      alert("Failed to find matches.");
    } finally {
      setMatchingId(null);
    }
  };

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
        <h1 className="text-xl font-bold text-brand-ink">
          Submissions{" "}
          {data ? (
            <span className="text-brand-muted">({data.total})</span>
          ) : null}
        </h1>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search company, email, country…"
          className="w-64 rounded border border-brand-line bg-white px-3 py-2 text-sm outline-none focus:border-brand-teal"
        />
      </div>

      {isLoading && (
        <p className="text-sm text-brand-muted">Loading…</p>
      )}

      {error && (
        <p className="text-sm text-red-600">
          Failed to load submissions.
        </p>
      )}

      {data && (
        <div className="overflow-hidden rounded-lg border border-brand-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-bg-alt text-xs uppercase tracking-wide text-brand-muted">
              <tr>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Files</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Matches</th>
                <th className="px-4 py-3">Received</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {items.map((s) => (
                <tr
                  key={s.id}
                  className="border-t border-brand-line hover:bg-[#0F7B7F]/5"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/submissions/${s.id}`}
                      className="font-semibold text-brand-teal hover:underline"
                    >
                      {s.companyName}
                    </Link>
                  </td>

                  <td className="px-4 py-3 text-brand-muted">
                    {s.country}
                  </td>

                  <td className="px-4 py-3 text-brand-muted">
                    {s.contactFullName}
                    <br />
                    <span className="text-xs text-brand-muted">
                      {s.contactEmail}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-brand-muted">
                    {s.files.length}
                  </td>

                  <td className="px-4 py-3">
                    {s.score != null ? (
                      <div>
                        <div className="font-semibold text-brand-ink">
                          {s.score.toFixed(1)}
                        </div>

                        {s.decision && (
                          <div className="text-xs text-brand-muted">
                            {s.decision}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-brand-muted">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    {s.matchCount != null && s.matchCount > 0 ? (
                      <span className="font-semibold text-brand-ink">
                        {s.matchCount} match{s.matchCount !== 1 ? "es" : ""}
                      </span>
                    ) : (
                      <span className="text-brand-muted">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-brand-muted">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => evaluateSubmissionForRow(s.id)}
                        disabled={loadingId === s.id}
                        className="text-sm text-brand-teal hover:underline disabled:opacity-50"
                      >
                        {loadingId === s.id
                          ? "Evaluating..."
                          : s.score != null
                          ? "Re-evaluate"
                          : "Evaluate"}
                      </button>
                      <button
                        onClick={() => findMatchesForRow(s.id)}
                        disabled={matchingId === s.id}
                        className="text-sm text-brand-teal hover:underline disabled:opacity-50"
                      >
                        {matchingId === s.id ? "Matching…" : "Find Matches"}
                      </button>
                      <Link
                        to={`/admin/submissions/${s.id}`}
                        className="text-sm text-brand-muted hover:underline"
                      >
                        View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-brand-muted"
                  >
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