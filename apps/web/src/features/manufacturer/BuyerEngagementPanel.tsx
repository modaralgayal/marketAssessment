import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import {
  fetchEngagement,
  fetchMyOpportunityCards,
  shareOpportunityCard,
  type EngagementRowDto,
} from "../../lib/api";

const STATUS_STYLES: Record<string, string> = {
  INTERESTED: "bg-brand-teal/10 text-brand-teal",
  REFERRED: "bg-brand-teal/10 text-brand-teal",
  SAVED: "bg-brand-bg-alt text-brand-muted",
  DECLINED: "bg-red-100 text-red-700",
  VIEWED: "bg-brand-bg-alt text-brand-muted",
  NEW: "bg-brand-bg-alt text-brand-muted",
};

const STATUS_LABEL: Record<string, string> = {
  INTERESTED: "Interested",
  REFERRED: "Referred",
  SAVED: "Saved",
  DECLINED: "Declined",
  VIEWED: "Viewed",
  NEW: "No activity",
};

function timeAgo(iso?: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function ShareDialog({
  cards,
  buyers,
  onClose,
}: {
  cards: { id: string; title: string }[];
  buyers: { id: string; name: string; email: string }[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [cardId, setCardId] = useState(cards[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [recipientIds, setRecipientIds] = useState<string[]>(buyers.map((b) => b.id));
  const [error, setError] = useState<string | null>(null);

  const share = useMutation({
    mutationFn: () => shareOpportunityCard(cardId, recipientIds, message || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activity"] });
      onClose();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Failed to share."),
  });

  const toggle = (id: string) =>
    setRecipientIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-base font-semibold text-brand-ink">Share an opportunity</h3>
        <p className="mt-1 text-xs text-brand-muted">
          Send an opportunity card to buyers. They'll see it in their activity feed.
        </p>
        <div className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label>Opportunity card</Label>
            <select
              value={cardId}
              onChange={(e) => setCardId(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-brand-line bg-white px-3 text-sm text-brand-ink outline-none focus:border-brand-teal"
            >
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Message</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Optional note for the buyers" />
          </div>
          <div className="space-y-1.5">
            <Label>Recipients</Label>
            {buyers.length === 0 ? (
              <p className="text-xs text-brand-muted">No buyers have interacted with your cards yet.</p>
            ) : (
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-brand-line p-2">
                {buyers.map((b) => (
                  <label key={b.id} className="flex cursor-pointer items-center gap-2 text-sm text-brand-ink">
                    <input type="checkbox" checked={recipientIds.includes(b.id)} onChange={() => toggle(b.id)} className="accent-brand-teal" />
                    <span className="truncate">
                      {b.name} <span className="text-brand-muted">· {b.email}</span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={onClose} disabled={share.isPending}>
              Cancel
            </Button>
            <Button onClick={() => share.mutate()} disabled={share.isPending || !cardId || recipientIds.length === 0}>
              {share.isPending ? "Sharing…" : "Share"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BuyerEngagementPanel() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sharing, setSharing] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["engagement"],
    queryFn: fetchEngagement,
  });
  const { data: myCards = [] } = useQuery({
    queryKey: ["my-opportunity-cards"],
    queryFn: () => fetchMyOpportunityCards(),
  });

  const postedCards = useMemo(
    () => myCards.filter((c) => c.status === "POSTED").map((c) => ({ id: c.id, title: c.title })),
    [myCards],
  );

  const buyers = useMemo(() => {
    const map = new Map<string, { id: string; name: string; email: string }>();
    for (const r of rows) {
      if (!map.has(r.buyerAccountId)) {
        map.set(r.buyerAccountId, { id: r.buyerAccountId, name: r.buyerName, email: r.buyerEmail });
      }
    }
    return Array.from(map.values());
  }, [rows]);

  const filtered = rows.filter((r) => !statusFilter || r.status === statusFilter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-brand-ink">Buyer engagement</h2>
          <p className="text-sm text-brand-muted">How buyers are interacting with your published opportunity cards.</p>
        </div>
        <Button size="sm" onClick={() => setSharing(true)} disabled={postedCards.length === 0}>
          Share an opportunity
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="flex h-10 rounded-xl border border-brand-line bg-white px-3 text-sm text-brand-ink outline-none focus:border-brand-teal"
        >
          <option value="">All interest</option>
          <option value="INTERESTED">Interested</option>
          <option value="REFERRED">Referred</option>
          <option value="SAVED">Saved</option>
          <option value="DECLINED">Declined</option>
          <option value="VIEWED">Viewed</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-4 text-sm text-brand-muted">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="p-4 text-sm text-brand-muted">No buyer engagement yet. Publish an opportunity card to start getting interest.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-line text-left text-xs uppercase tracking-wide text-brand-muted">
                    <th className="px-4 py-3 font-medium">Buyer</th>
                    <th className="px-4 py-3 font-medium">Opportunity</th>
                    <th className="px-4 py-3 font-medium">Stated interest</th>
                    <th className="px-4 py-3 font-medium">Latest interaction</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r: EngagementRowDto, i) => (
                    <tr key={`${r.cardId}-${r.buyerAccountId}-${i}`} className="border-b border-brand-line last:border-0">
                      <td className="px-4 py-3">
                        <span className="font-medium text-brand-ink">{r.buyerName}</span>
                        <span className="block text-xs text-brand-muted">{r.buyerEmail}</span>
                      </td>
                      <td className="px-4 py-3 text-brand-ink">{r.cardTitle}</td>
                      <td className="px-4 py-3">
                        <Badge className={STATUS_STYLES[r.status]}>{STATUS_LABEL[r.status] ?? r.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-brand-muted">{timeAgo(r.lastActivityAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {sharing && postedCards.length > 0 && (
        <ShareDialog cards={postedCards} buyers={buyers} onClose={() => setSharing(false)} />
      )}
    </div>
  );
}
