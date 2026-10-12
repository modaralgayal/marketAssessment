import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAccessRequests,
  approveAccessRequest,
  rejectAccessRequest,
  type AccessRequestDto,
} from "../../lib/api";
import AdminLayout from "./AdminLayout";

/** Reconstruct the signup link for an already-sent invite (admin is on the
 *  production web origin, so using the current origin is correct here). */
function signupLink(token: string): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/signup?accountInvite=${token}`;
}

function roleLabel(role: string): string {
  return role === "BUYER" ? "Buyer" : "Manufacturer";
}

function StatusBadge({ status }: { status: AccessRequestDto["status"] }) {
  const styles =
    status === "PENDING"
      ? "bg-amber-100 text-amber-800"
      : status === "APPROVED"
        ? "bg-emerald-50 text-emerald-700"
        : "bg-red-50 text-red-700";
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles}`}>{status}</span>
  );
}

export default function AccessRequests() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["accessRequests"],
    queryFn: fetchAccessRequests,
  });

  const [roleFor, setRoleFor] = useState<Record<string, "BUYER" | "MANUFACTURER">>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [links, setLinks] = useState<Record<string, { link: string; emailSent: boolean }>>({});
  const [localError, setLocalError] = useState<string | null>(null);

  const approve = async (req: AccessRequestDto) => {
    const role = roleFor[req.id] ?? req.intendedRole;
    setBusyId(req.id);
    setLocalError(null);
    try {
      const res = await approveAccessRequest(req.id, role);
      setLinks((prev) => ({ ...prev, [req.id]: { link: res.link, emailSent: res.emailSent } }));
      await queryClient.invalidateQueries({ queryKey: ["accessRequests"] });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Failed to approve request");
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (req: AccessRequestDto) => {
    if (!confirm(`Reject the access request from ${req.name}?`)) return;
    setRejectingId(req.id);
    setLocalError(null);
    try {
      await rejectAccessRequest(req.id);
      await queryClient.invalidateQueries({ queryKey: ["accessRequests"] });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Failed to reject request");
    } finally {
      setRejectingId(null);
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard may be unavailable */
    }
  };

  const items = data?.items ?? [];
  // PENDING first, then the rest newest-first.
  const ordered = [...items].sort((a, b) => {
    if (a.status === "PENDING" && b.status !== "PENDING") return -1;
    if (a.status !== "PENDING" && b.status === "PENDING") return 1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  return (
    <AdminLayout>
      <h1 className="mb-1 text-xl font-bold text-brand-ink">Access requests</h1>
      <p className="mb-5 text-sm text-brand-muted">
        Visitors request a buyer or manufacturer workspace here. Approve to mint an invite and email
        it; reject to decline.
      </p>

      {localError && <p className="mb-4 text-sm text-red-600">{localError}</p>}

      {isLoading && <p className="text-sm text-brand-muted">Loading…</p>}
      {error && <p className="text-sm text-red-600">Failed to load access requests.</p>}

      {data && (
        <div className="overflow-hidden rounded-lg border border-brand-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-bg-alt text-xs uppercase tracking-wide text-brand-muted">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Wants</th>
                <th className="px-4 py-3">Received</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((req) => {
                const sentLink = links[req.id]?.link;
                const emailSent = links[req.id]?.emailSent;
                const resolvedRole = roleFor[req.id] ?? req.intendedRole;
                const displayLink = sentLink ?? signupLink(req.inviteToken ?? "");
                return (
                  <tr key={req.id} className="border-t border-brand-line align-top">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-brand-ink">{req.name}</div>
                      {req.message && (
                        <div className="mt-1 max-w-xs text-xs text-brand-muted">{req.message}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-brand-muted">{req.email}</td>
                    <td className="px-4 py-3 text-brand-muted">{req.company ?? "—"}</td>
                    <td className="px-4 py-3 text-brand-muted">{roleLabel(req.intendedRole)}</td>
                    <td className="px-4 py-3 text-brand-muted">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-4 py-3">
                      {req.status === "PENDING" ? (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <select
                              value={resolvedRole}
                              onChange={(e) =>
                                setRoleFor((prev) => ({
                                  ...prev,
                                  [req.id]: e.target.value as "BUYER" | "MANUFACTURER",
                                }))
                              }
                              className="h-9 rounded-full border border-brand-line bg-white px-3 text-sm text-brand-ink outline-none"
                            >
                              <option value="BUYER">Buyer</option>
                              <option value="MANUFACTURER">Manufacturer</option>
                            </select>
                            <button
                              onClick={() => approve(req)}
                              disabled={busyId === req.id}
                              className="rounded-full bg-brand-teal px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-brand-teal-dark disabled:opacity-50"
                            >
                              {busyId === req.id ? "Approving…" : "Approve"}
                            </button>
                            <button
                              onClick={() => reject(req)}
                              disabled={rejectingId === req.id}
                              className="rounded border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                            >
                              {rejectingId === req.id ? "Rejecting…" : "Reject"}
                            </button>
                          </div>
                        </div>
                      ) : req.status === "APPROVED" ? (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <a
                              href={displayLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 break-all text-[12px] text-brand-teal underline hover:text-brand-teal-dark"
                            >
                              {displayLink}
                            </a>
                            <button
                              onClick={() => copy(displayLink)}
                              className="rounded border border-brand-line px-2 py-1 text-[11px] font-semibold text-brand-teal hover:bg-white"
                            >
                              Copy
                            </button>
                          </div>
                          {sentLink ? (
                            <span className={`text-xs ${emailSent ? "text-emerald-600" : "text-red-600"}`}>
                              {emailSent ? "Invite emailed to requester." : "Email failed — copy the link above and send it manually."}
                            </span>
                          ) : (
                            <span className="text-xs text-brand-muted">Invite sent in a previous session.</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-brand-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {ordered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-brand-muted">
                    No access requests yet.
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
