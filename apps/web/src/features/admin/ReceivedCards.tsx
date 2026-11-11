import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchAdminCardActivity } from "../../lib/api";
import AdminLayout from "./AdminLayout";

type CardEvent = {
  id: string;
  type: string;
  actorAccountId?: string;
  createdAt: string;
  payload?: { cardId?: string; title?: string; status?: string };
};

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  IN_REVIEW: { label: "Awaiting review", cls: "bg-amber-100 text-amber-800" },
  POSTED: { label: "Published", cls: "bg-brand-teal/15 text-brand-teal-dark" },
};

export default function ReceivedCards() {
  const { data: activity = [], isLoading } = useQuery({
    queryKey: ["admin-activity"],
    queryFn: fetchAdminCardActivity,
  });

  const cards = (activity as CardEvent[]).filter(
    (a) => a.type === "card_published" || a.type === "card_submitted_for_review",
  );

  return (
    <AdminLayout>
      <h1 className="mb-1 text-lg font-bold text-brand-ink">Received opportunity cards</h1>
      <p className="mb-5 text-sm text-brand-muted">
        Opportunity cards manufacturers have submitted for internal review or published to the marketplace.
      </p>

      {isLoading ? (
        <p className="text-sm text-brand-muted">Loading…</p>
      ) : cards.length === 0 ? (
        <p className="text-sm text-brand-muted">No opportunity cards received yet.</p>
      ) : (
        <ul className="divide-y divide-brand-line rounded-2xl border border-brand-line bg-white">
          {cards.map((c) => {
            const st = STATUS_LABEL[c.payload?.status ?? ""] ?? { label: c.payload?.status ?? "—", cls: "bg-brand-bg-alt text-brand-muted" };
            return (
              <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-brand-ink">{c.payload?.title ?? "Untitled card"}</p>
                  <p className="text-xs text-brand-muted">
                    {new Date(c.createdAt).toLocaleString()}
                    {c.type === "card_submitted_for_review" ? " · submitted for internal review" : " · published"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${st.cls}`}>{st.label}</span>
                  {c.actorAccountId && (
                    <Link
                      to={`/manufacturer/${c.actorAccountId}/profile`}
                      className="text-xs font-medium text-brand-teal hover:underline"
                    >
                      View manufacturer →
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AdminLayout>
  );
}
