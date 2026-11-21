import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchInvites,
  createInvite,
  deleteInvite,
  type InviteDto,
  type CreateInviteResult,
} from "../../lib/api";
import AdminLayout from "./AdminLayout";

type WorkspaceRole = "BUYER" | "MANUFACTURER";

function roleLabel(role?: string | null): string {
  if (role === "BUYER") return "Buyer";
  if (role === "MANUFACTURER") return "Manufacturer";
  return "—";
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "PENDING"
      ? "bg-amber-100 text-amber-800"
      : status === "USED"
        ? "bg-emerald-50 text-emerald-700"
        : "bg-red-50 text-red-700";
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles}`}>{status}</span>
  );
}

export default function Invites() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["invites"],
    queryFn: fetchInvites,
  });

  const [role, setRole] = useState<WorkspaceRole>("BUYER");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<CreateInviteResult | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const create = async () => {
    setBusy(true);
    setLocalError(null);
    setCreated(null);
    try {
      const trimmed = email.trim();
      const invite = await createInvite(
        trimmed ? trimmed : undefined,
        "ACCOUNT",
        role,
      );
      setCreated(invite as InviteDto);
      setEmail("");
      await queryClient.invalidateQueries({ queryKey: ["invites"] });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Failed to create invite");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this invite link? It can no longer be used.")) return;
    setDeletingId(id);
    setLocalError(null);
    try {
      await deleteInvite(id);
      await queryClient.invalidateQueries({ queryKey: ["invites"] });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Failed to delete invite");
    } finally {
      setDeletingId(null);
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be unavailable */
    }
  };

  const items = data?.items ?? [];

  return (
    <AdminLayout>
      <h1 className="mb-1 text-xl font-bold text-brand-ink">Invites</h1>
      <p className="mb-5 text-sm text-brand-muted">
        Create a single-use sign-up link for a buyer or manufacturer workspace. Share the link
        directly — the visitor opens it and creates their account without requesting access first.
      </p>

      {localError && <p className="mb-4 text-sm text-red-600">{localError}</p>}

      {/* Create form */}
      <div className="mb-8 rounded-lg border border-brand-line bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-muted">
          New invite link
        </h2>
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-brand-ink">
            Workspace
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as WorkspaceRole)}
              className="h-10 rounded-full border border-brand-line bg-white px-3 text-sm text-brand-ink outline-none"
            >
              <option value="BUYER">Buyer</option>
              <option value="MANUFACTURER">Manufacturer</option>
            </select>
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-brand-ink">
            Email <span className="font-normal text-brand-muted">(optional)</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="requester@example.com"
              className="h-10 rounded-full border border-brand-line bg-white px-4 text-sm text-brand-ink outline-none focus:border-brand-teal"
            />
          </label>
          <button
            onClick={create}
            disabled={busy}
            className="h-10 rounded-full bg-brand-teal px-5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-teal-dark disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create invite link"}
          </button>
        </div>

        {created && (
          <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-xs font-semibold text-emerald-700">
              {roleLabel(created.role)} invite created — single-use:
            </p>
            <div className="mt-2 flex items-center gap-2">
              <a
                href={created.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 break-all text-[12px] text-brand-teal underline hover:text-brand-teal-dark"
              >
                {created.link}
              </a>
              <button
                onClick={() => copy(created.link)}
                className="rounded border border-brand-line px-2 py-1 text-[11px] font-semibold text-brand-teal hover:bg-white"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Existing invites */}
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-muted">
        Existing invites
      </h2>

      {isLoading && <p className="text-sm text-brand-muted">Loading…</p>}
      {error && <p className="text-sm text-red-600">Failed to load invites.</p>}

      {data && (
        <div className="overflow-hidden rounded-lg border border-brand-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-bg-alt text-xs uppercase tracking-wide text-brand-muted">
              <tr>
                <th className="px-4 py-3">Workspace</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Link</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((inv) => (
                <tr key={inv.id} className="border-t border-brand-line align-top">
                  <td className="px-4 py-3 font-semibold text-brand-ink">{roleLabel(inv.role)}</td>
                  <td className="px-4 py-3 text-brand-muted">{inv.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="px-4 py-3 text-brand-muted">
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <a
                        href={inv.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 break-all text-[12px] text-brand-teal underline hover:text-brand-teal-dark"
                      >
                        {inv.link}
                      </a>
                      <button
                        onClick={() => copy(inv.link)}
                        className="rounded border border-brand-line px-2 py-1 text-[11px] font-semibold text-brand-teal hover:bg-white"
                      >
                        Copy
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => remove(inv.id)}
                      disabled={deletingId === inv.id}
                      className="rounded border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingId === inv.id ? "Deleting…" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-brand-muted">
                    No invites yet. Create one above.
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
