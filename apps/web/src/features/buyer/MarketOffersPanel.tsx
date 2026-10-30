import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import {
  fetchMarketOpportunityCards,
  fetchSourcingInquiries,
  fetchOpportunityCardSourceUrl,
  fetchOpportunityCardAssetUrl,
  setCardInteraction,
  type MarketCardDto,
  type OpportunityRef,
  type OpportunityInteractionStatus,
} from "../../lib/api";

const ACTIVITY_FILTERS = [
  { value: "", label: "All activity" },
  { value: "NONE", label: "No stated interest" },
  { value: "SAVED", label: "Saved" },
  { value: "INTERESTED", label: "Interested" },
  { value: "DECLINED", label: "Declined" },
];

const STATUS_BADGE: Record<string, string> = {
  INTERESTED: "bg-brand-teal/15 text-brand-teal-dark",
  SAVED: "bg-brand-bg-alt text-brand-ink",
  DECLINED: "bg-brand-line text-brand-muted",
  REFERRED: "bg-brand-bg-alt text-brand-ink",
  VIEWED: "bg-brand-bg-alt text-brand-muted",
  NEW: "bg-brand-bg-alt text-brand-muted",
};

/** A labelled detail row. Empty optional fields are hidden, while the core
 *  commercial terms fall back to "To be discussed" so the buyer knows the
 *  supplier simply hasn't specified that part of the deal yet. */
function Field({
  label,
  value,
  fallback = false,
}: {
  label: string;
  value?: string | null;
  fallback?: boolean;
}) {
  if (!value && !fallback) return null;
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wide text-brand-muted">{label}</dt>
      <dd className={value ? "text-sm text-brand-ink" : "text-sm italic text-brand-muted"}>
        {value || "To be discussed"}
      </dd>
    </div>
  );
}

function formatValidUntil(value?: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function AttachmentChip({
  cardId,
  item,
  kind,
}: {
  cardId: string;
  item: OpportunityRef;
  kind: "source" | "asset";
}) {
  const [busy, setBusy] = useState(false);
  const open = async () => {
    try {
      setBusy(true);
      if (item.kind === "link" && item.url) {
        window.open(item.url, "_blank", "noopener,noreferrer");
        return;
      }
      if (!item.id) return;
      const { url } =
        kind === "source"
          ? await fetchOpportunityCardSourceUrl(cardId, item.id)
          : await fetchOpportunityCardAssetUrl(cardId, item.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      /* not viewable */
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      type="button"
      onClick={open}
      disabled={busy}
      title={item.name}
      className="inline-flex max-w-[14rem] items-center gap-1.5 truncate rounded-full border border-brand-line bg-white px-2.5 py-1 text-[11px] text-brand-ink transition hover:border-brand-teal hover:text-brand-teal disabled:opacity-50"
    >
      <span aria-hidden="true">{item.kind === "link" ? "🔗" : "📄"}</span>
      <span className="truncate">{item.name}</span>
    </button>
  );
}

function OfferCard({
  card,
  onExpressInterest,
}: {
  card: MarketCardDto;
  onExpressInterest?: () => void;
}) {
  const qc = useQueryClient();
  const { data: inquiries = [] } = useQuery({
    queryKey: ["sourcing-inquiries"],
    queryFn: fetchSourcingInquiries,
  });
  const status = card.interaction?.status ?? "NEW";

  const [expanded, setExpanded] = useState(false);
  const [composing, setComposing] = useState(false);
  const [note, setNote] = useState(card.interaction?.referralNote ?? "");
  const [linkedInquiryId, setLinkedInquiryId] = useState(card.interaction?.linkedInquiryId ?? "");

  const act = useMutation({
    mutationFn: (s: OpportunityInteractionStatus) =>
      setCardInteraction(card.id, s, {
        linkedInquiryId: linkedInquiryId || undefined,
        referralNote: note.trim() || undefined,
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["market-opportunity-cards"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      if (res.conversationId) onExpressInterest?.();
    },
  });

  const startComposing = () => {
    setExpanded(true); // reveal the details so the buyer can reference them
    setComposing(true);
  };

  const highlights = [card.category, card.territory, card.partner].filter(Boolean) as string[];
  const sources = card.sources ?? [];
  const assets = card.assets ?? [];

  return (
    <Card className="flex flex-col overflow-hidden rounded-2xl border border-brand-line shadow-sm">
      <CardContent className="flex flex-1 flex-col gap-3 p-5">
        {/* Header: status + offer type */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold leading-snug text-brand-ink">{card.title}</p>
            {card.owner && (
              <p className="mt-0.5 truncate text-xs text-brand-muted">
                {card.owner.companyName}
                {card.owner.country ? ` · ${card.owner.country}` : ""}
              </p>
            )}
          </div>
          {status !== "NEW" && (
            <Badge className={STATUS_BADGE[status] ?? STATUS_BADGE.NEW}>{status}</Badge>
          )}
        </div>

        {/* At-a-glance chips */}
        {highlights.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {highlights.map((h) => (
              <span
                key={h}
                className="rounded-full bg-brand-bg-alt px-2 py-0.5 text-[11px] font-medium text-brand-muted"
              >
                {h}
              </span>
            ))}
          </div>
        )}

        {/* Summary (always visible) */}
        {card.summary && (
          <p className="text-sm leading-relaxed text-brand-muted">{card.summary}</p>
        )}

        {/* Expand / collapse details */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="flex items-center gap-1 self-start text-xs font-medium text-brand-teal hover:underline"
        >
          {expanded ? "Hide details" : "View full offer details"}
          <span aria-hidden="true" className={expanded ? "rotate-180 transition" : "transition"}>
            ⌄
          </span>
        </button>

        {expanded && (
          <div className="space-y-4 border-t border-brand-line pt-4">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
              <Field label="Commercial objective" value={card.objective} />
              <Field label="Target country / territory" value={card.territory} />
              <Field label="Partner type" value={card.partner} />
              <Field
                label="Target sales channels"
                value={card.channels?.length ? card.channels.join(", ") : null}
              />
              <Field label="Target launch / timing" value={card.timing} fallback />
              <Field label="Initial order / MOQ" value={card.moq} fallback />
              <Field label="Payment terms" value={card.payment} fallback />
              <Field label="Delivery terms / dispatch" value={card.delivery} fallback />
              <Field label="Distribution rights / exclusivity" value={card.rights} fallback />
              <Field label="Valid until" value={formatValidUntil(card.validUntil)} />
              <Field label="Marketing / launch support" value={card.support} fallback />
            </dl>

            {(sources.length > 0 || assets.length > 0) && (
              <div>
                <p className="mb-2 text-[10px] uppercase tracking-wide text-brand-muted">
                  Attachments
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {sources.map((s, i) => (
                    <AttachmentChip key={`s-${i}`} cardId={card.id} item={s} kind="source" />
                  ))}
                  {assets.map((a, i) => (
                    <AttachmentChip key={`a-${i}`} cardId={card.id} item={a} kind="asset" />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Interest composer */}
        {composing ? (
          <div className="space-y-2 rounded-xl border border-brand-line bg-brand-bg-alt/50 p-3">
            <div className="space-y-1.5">
              <Label className="text-xs">
                Your interest note (becomes the first message to the supplier)
              </Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Tell the supplier what you're interested in…"
                className="min-h-[64px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Link to a sourcing inquiry (optional)</Label>
              <select
                value={linkedInquiryId}
                onChange={(e) => setLinkedInquiryId(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-brand-line bg-white px-2 text-sm text-brand-ink outline-none focus:border-brand-teal"
              >
                <option value="">— Not linked —</option>
                {inquiries.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setComposing(false)}>
                Cancel
              </Button>
              <Button size="sm" disabled={act.isPending} onClick={() => act.mutate("INTERESTED")}>
                {act.isPending ? "Sending…" : "Send interest"}
              </Button>
            </div>
            {act.isError && (
              <p className="text-xs text-red-600">{(act.error as Error).message}</p>
            )}
          </div>
        ) : (
          <div className="mt-auto flex flex-wrap gap-2 border-t border-brand-line pt-3">
            <Button
              size="sm"
              variant="default"
              onClick={startComposing}
              disabled={act.isPending || status === "INTERESTED"}
            >
              {status === "INTERESTED" ? "Interested" : "Express interest"}
            </Button>
            <Button
              size="sm"
              variant={status === "SAVED" ? "secondary" : "outline"}
              onClick={() => act.mutate("SAVED")}
              disabled={act.isPending}
            >
              {status === "SAVED" ? "Saved" : "Save"}
            </Button>
            <div className="flex-1" />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => act.mutate("DECLINED")}
              disabled={act.isPending}
            >
              Decline
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => act.mutate("REFERRED")}
              disabled={act.isPending}
            >
              Refer
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function MarketOffersPanel({
  onExpressInterest,
}: {
  onExpressInterest?: () => void;
}) {
  const [search, setSearch] = useState("");
  const [activity, setActivity] = useState("");

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ["market-opportunity-cards"],
    queryFn: fetchMarketOpportunityCards,
  });

  const categories = Array.from(
    new Set(cards.map((c) => c.category).filter((x): x is string => Boolean(x))),
  );

  const filtered = cards.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.summary ?? "").toLowerCase().includes(search.toLowerCase());
    const st = c.interaction?.status ?? "NEW";
    const matchesActivity =
      !activity ||
      (activity === "NONE" && (st === "NEW" || st === "VIEWED")) ||
      st === activity;
    return matchesSearch && matchesActivity;
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-brand-ink">Manufacturer offers</h2>
        <p className="text-sm text-brand-muted">
          Browse what manufacturers are selling. Expand a card to see the full offer — terms,
          volumes, attachments — then save it or express interest.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search offers…"
          className="max-w-xs"
        />
        <select
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
          className="flex h-10 rounded-xl border border-brand-line bg-white px-3 text-sm text-brand-ink outline-none focus:border-brand-teal"
        >
          {ACTIVITY_FILTERS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {categories.length > 0 && (
          <span className="self-center text-xs text-brand-muted">
            {cards.length} offers · {categories.length} categories
          </span>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-brand-muted">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-brand-muted">No manufacturer offers match your filters yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((c) => (
            <OfferCard key={c.id} card={c} onExpressInterest={onExpressInterest} />
          ))}
        </div>
      )}
    </div>
  );
}
