import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchSubmissions,
  evaluateSubmission,
  findMatches,
  deleteSubmission,
  fetchInvites,
  createInvite,
  deleteInvite,
} from "../../lib/api";
import AdminLayout from "./AdminLayout";

/**
 * In dev the server builds invite links from WEB_ORIGIN (prod). When we're
 * running the local app we swap the origin for the current one so the link
 * opens the form we're actually editing instead of prod.
 */
function localInviteLink(link: string): string {
  if (typeof window === "undefined") return link;
  if (!/^localhost$|^127\.0\.0\.1$|^\[::1\]$/.test(window.location.hostname)) return link;
  try {
    const u = new URL(link);
    return `${window.location.origin}${u.pathname}${u.search}${u.hash}`;
  } catch {
    return link;
  }
}

export default function AdminList() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["submissions"],
    queryFn: fetchSubmissions,
  });

  const [search, setSearch] = useState("");

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [matchingId, setMatchingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [onboardingLink, setOnboardingLink] = useState<string | null>(null);
  const [generatingOnboarding, setGeneratingOnboarding] = useState(false);

  const { data: invitesData } = useQuery({
    queryKey: ["invites"],
    queryFn: fetchInvites,
  });

  const generateInvite = async () => {
    try {
      setGenerating(true);
      const inv = await createInvite();
      setCreatedLink(inv.link);
      await queryClient.invalidateQueries({ queryKey: ["invites"] });
    } catch {
      alert("Failed to generate invite.");
    } finally {
      setGenerating(false);
    }
  };

  const generateOnboardingInvite = async () => {
    try {
      setGeneratingOnboarding(true);
      const inv = await createInvite(undefined, "ONBOARDING");
      setOnboardingLink(inv.link);
      await queryClient.invalidateQueries({ queryKey: ["invites"] });
    } catch {
      alert("Failed to generate onboarding invite.");
    } finally {
      setGeneratingOnboarding(false);
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard may be unavailable */
    }
  };

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

  const deleteSubmissionForRow = async (id: string, name: string) => {
    if (!confirm(`Delete submission "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await deleteSubmission(id);
      await queryClient.invalidateQueries({ queryKey: ["submissions"] });
    } catch (err) {
      console.log(err);
      alert("Failed to delete submission.");
    } finally {
      setDeletingId(null);
    }
  };

  const [deletingInviteId, setDeletingInviteId] = useState<string | null>(null);

  const deleteInviteForRow = async (id: string) => {
    if (!confirm("Delete this invite link? This cannot be undone.")) return;
    setDeletingInviteId(id);
    try {
      await deleteInvite(id);
      await queryClient.invalidateQueries({ queryKey: ["invites"] });
    } catch (err) {
      console.log(err);
      alert("Failed to delete invite.");
    } finally {
      setDeletingInviteId(null);
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
                      <button
                        onClick={() => deleteSubmissionForRow(s.id, s.companyName)}
                        disabled={deletingId === s.id}
                        className="text-sm text-red-600 hover:underline disabled:opacity-50"
                      >
                        {deletingId === s.id ? "Deleting…" : "Delete"}
                      </button>
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

      {/* Invites panel — generate and copy single-use assessment / onboarding links */}
      <div className="mt-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-brand-ink">Invite links</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={generateInvite}
              disabled={generating}
              className="rounded-full bg-brand-teal px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-teal-dark disabled:opacity-50"
            >
              {generating ? "Generating…" : "Generate assessment invite"}
            </button>
            <button
              onClick={generateOnboardingInvite}
              disabled={generatingOnboarding}
              className="rounded-full border border-brand-teal bg-white px-5 py-2.5 text-sm font-bold text-brand-teal shadow-sm transition hover:bg-brand-teal/5 disabled:opacity-50"
            >
              {generatingOnboarding ? "Generating…" : "Generate onboarding invite"}
            </button>
          </div>
        </div>

        {createdLink && (
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-brand-teal/30 bg-brand-teal/5 px-4 py-3">
            <span className="shrink-0 rounded bg-brand-teal/15 px-2 py-0.5 text-[10px] font-bold text-brand-teal">ASSESSMENT</span>
            <code className="flex-1 break-all text-[12.5px] text-brand-ink">{localInviteLink(createdLink)}</code>
            <button
              onClick={() => copy(localInviteLink(createdLink))}
              className="shrink-0 rounded border border-brand-line px-3 py-1.5 text-xs font-semibold text-brand-teal hover:bg-white"
            >
              Copy
            </button>
          </div>
        )}

        {onboardingLink && (
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-brand-teal/30 bg-brand-teal/5 px-4 py-3">
            <span className="shrink-0 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">ONBOARDING</span>
            <code className="flex-1 break-all text-[12.5px] text-brand-ink">{localInviteLink(onboardingLink)}</code>
            <button
              onClick={() => copy(localInviteLink(onboardingLink))}
              className="shrink-0 rounded border border-brand-line px-3 py-1.5 text-xs font-semibold text-brand-teal hover:bg-white"
            >
              Copy
            </button>
          </div>
        )}

        <div className="overflow-hidden rounded-lg border border-brand-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-bg-alt text-xs uppercase tracking-wide text-brand-muted">
              <tr>
                <th className="px-4 py-3">Link</th>
                <th className="px-4 py-3">Purpose</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {(invitesData?.items ?? []).map((inv) => (
                <tr key={inv.id} className="border-t border-brand-line">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <a
                        href={localInviteLink(inv.link)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[12px] text-brand-teal hover:underline"
                        title={localInviteLink(inv.link)}
                      >
                        {inv.token.slice(0, 12)}…
                      </a>
                      <button
                        onClick={() => copy(localInviteLink(inv.link))}
                        className="rounded border border-brand-line px-2 py-0.5 text-[11px] font-semibold text-brand-muted hover:border-brand-teal hover:text-brand-teal"
                        title="Copy link"
                      >
                        Copy
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        inv.purpose === "ONBOARDING"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-brand-teal/15 text-brand-teal"
                      }`}
                    >
                      {inv.purpose === "ONBOARDING" ? "Onboarding" : "Assessment"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-brand-muted">{inv.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        inv.status === "PENDING"
                          ? "bg-emerald-50 text-emerald-700"
                          : inv.status === "USED"
                            ? "bg-brand-bg-alt text-brand-muted"
                            : "bg-red-50 text-red-700"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-brand-muted">
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => deleteInviteForRow(inv.id)}
                      disabled={deletingInviteId === inv.id}
                      className="rounded border border-red-200 px-2.5 py-1 text-[11px] font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingInviteId === inv.id ? "Deleting…" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
              {(!invitesData || invitesData.items.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-brand-muted">
                    No invites yet. Generate one to send an assessment link.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}