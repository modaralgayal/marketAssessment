import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAccounts,
  disableAccount,
  enableAccount,
  adminResetPassword,
  adminResendVerification,
  deleteAccount,
  type AccountListDto,
} from "../../lib/api";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import AdminLayout from "./AdminLayout";

type PendingConfirm = { type: "delete" | "disable"; id: string; email: string } | null;

function roleLabel(role: string): string {
  return role === "BUYER" ? "Buyer" : role === "MANUFACTURER" ? "Manufacturer" : role;
}

function StatusBadge({ status }: { status: AccountListDto["status"] }) {
  const styles =
    status === "ACTIVE"
      ? "bg-emerald-50 text-emerald-700"
      : status === "DISABLED"
        ? "bg-red-50 text-red-700"
        : "bg-amber-100 text-amber-800";
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles}`}>{status}</span>
  );
}

const FILTERS = ["ALL", "BUYER", "MANUFACTURER"] as const;
type Filter = (typeof FILTERS)[number];

export default function AccountsList() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
  });
  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<PendingConfirm>(null);

  const setMsg = (id: string, msg: string) =>
    setFeedback((f) => ({ ...f, [id]: msg }));

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["accounts"] });

  const disableMut = useMutation({
    mutationFn: (id: string) => disableAccount(id),
    onSuccess: () => invalidate(),
    onSettled: () => setConfirm(null),
    onError: (e: Error, id) => setMsg(id, e.message),
  });
  const enableMut = useMutation({
    mutationFn: (id: string) => enableAccount(id),
    onSuccess: () => invalidate(),
    onError: (e: Error, id) => setMsg(id, e.message),
  });
  const resetMut = useMutation({
    mutationFn: (id: string) => adminResetPassword(id),
    onSuccess: (r, id) =>
      setMsg(id, r.emailSent ? "Password-reset email sent." : "Reset email not sent (SMTP not configured)."),
    onError: (e: Error, id) => setMsg(id, e.message),
  });
  const verifyMut = useMutation({
    mutationFn: (id: string) => adminResendVerification(id),
    onSuccess: (r, id) =>
      setMsg(id, r.emailSent ? "Verification email sent." : "Verification email not sent (SMTP not configured)."),
    onError: (e: Error, id) => setMsg(id, e.message),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteAccount(id),
    onSuccess: () => invalidate(),
    onSettled: () => setConfirm(null),
    onError: (e: Error, id) => setMsg(id, e.message),
  });

  const all = data?.items ?? [];
  const filtered = all.filter((a) => {
    if (filter !== "ALL" && a.role !== filter) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      (a.companyName ?? "").toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-brand-ink">
          Manufacturers &amp; Buyers{" "}
          {data ? <span className="text-brand-muted">({all.length})</span> : null}
        </h1>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search company or email…"
          className="w-64 rounded border border-brand-line bg-white px-3 py-2 text-sm outline-none focus:border-brand-teal"
        />
      </div>

      <div className="mb-4 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              filter === f
                ? "bg-brand-teal text-white shadow-sm"
                : "border border-brand-line bg-white text-brand-muted hover:border-brand-teal"
            }`}
          >
            {f === "ALL" ? "All" : roleLabel(f)}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-brand-muted">Loading…</p>}
      {error && <p className="text-sm text-red-600">Failed to load accounts.</p>}

      {data && (
        <div className="overflow-x-auto rounded-lg border border-brand-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-bg-alt text-xs uppercase tracking-wide text-brand-muted">
              <tr>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Signed up</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-t border-brand-line align-top">
                  <td className="px-4 py-3 font-semibold text-brand-ink">{a.companyName ?? "—"}</td>
                  <td className="px-4 py-3 text-brand-muted">{a.email}</td>
                  <td className="px-4 py-3 text-brand-muted">{roleLabel(a.role)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="px-4 py-3 text-brand-muted">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {a.status === "ACTIVE" ? (
                        <button
                          onClick={() => setConfirm({ type: "disable", id: a.id, email: a.email })}
                          disabled={disableMut.isPending}
                          className="rounded border border-brand-line px-2.5 py-1 text-xs font-medium text-brand-muted hover:border-red-400 hover:text-red-600"
                        >
                          Disable
                        </button>
                      ) : (
                        <button
                          onClick={() => enableMut.mutate(a.id)}
                          disabled={enableMut.isPending}
                          className="rounded border border-emerald-300 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                        >
                          Enable
                        </button>
                      )}
                      <button
                        onClick={() => resetMut.mutate(a.id)}
                        disabled={resetMut.isPending}
                        className="rounded border border-brand-line px-2.5 py-1 text-xs font-medium text-brand-muted hover:border-brand-teal hover:text-brand-teal"
                      >
                        Reset PW
                      </button>
                      <button
                        onClick={() => verifyMut.mutate(a.id)}
                        disabled={verifyMut.isPending}
                        className="rounded border border-brand-line px-2.5 py-1 text-xs font-medium text-brand-muted hover:border-brand-teal hover:text-brand-teal"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => setConfirm({ type: "delete", id: a.id, email: a.email })}
                        disabled={deleteMut.isPending}
                        className="rounded border border-red-300 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                    {feedback[a.id] && (
                      <p className="mt-1.5 text-xs text-brand-muted">{feedback[a.id]}</p>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-brand-muted">
                    No signed-up accounts yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.type === "delete" ? "Delete account" : "Disable account"}
        description={
          confirm?.type === "delete" ? (
            <>
              Permanently delete <span className="font-semibold text-brand-ink">{confirm?.email}</span>?
              This erases the account, its profile, and all related data, and cannot be undone.
            </>
          ) : (
            <>
              Disable <span className="font-semibold text-brand-ink">{confirm?.email}</span>? They
              won&apos;t be able to sign in until you re-enable them.
            </>
          )
        }
        confirmLabel={confirm?.type === "delete" ? "Delete" : "Disable"}
        destructive={confirm?.type === "delete"}
        pending={confirm?.type === "delete" ? deleteMut.isPending : disableMut.isPending}
        onConfirm={() => {
          if (!confirm) return;
          if (confirm.type === "delete") deleteMut.mutate(confirm.id);
          else disableMut.mutate(confirm.id);
        }}
        onClose={() => setConfirm(null)}
      />
    </AdminLayout>
  );
}
