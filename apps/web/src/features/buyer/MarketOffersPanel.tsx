import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import {
  fetchMarketOpportunityCards,
  fetchSourcingInquiries,
  setCardInteraction,
  type MarketCardDto,
  type OpportunityInteractionStatus,
} from "../../lib/api";

const ACTIVITY_FILTERS = [
  { value: "", label: "All activity" },
  { value: "NONE", label: "No stated interest" },
  { value: "SAVED", label: "Saved" },
  { value: "INTERESTED", label: "Interested" },
  { value: "DECLINED", label: "Declined" },
];

function OfferCard({ card }: { card: MarketCardDto }) {
  const qc = useQueryClient();
  const { data: inquiries = [] } = useQuery({
    queryKey: ["sourcing-inquiries"],
    queryFn: fetchSourcingInquiries,
  });
  const status = card.interaction?.status ?? "NEW";

  const act = useMutation({
    mutationFn: (s: OpportunityInteractionStatus) => setCardInteraction(card.id, s),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["market-opportunity-cards"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
  });

  const isStrong = status === "INTERESTED" || status === "SAVED";

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-brand-ink">{card.title}</p>
            {card.owner && (
              <p className="text-xs text-brand-muted">
                {card.owner.companyName}
                {card.owner.country ? ` · ${card.owner.country}` : ""}
              </p>
            )}
          </div>
          {status !== "NEW" && (
            <Badge
              className={
                status === "INTERESTED"
                  ? "bg-brand-teal/10 text-brand-teal"
                  : status === "DECLINED"
                    ? "bg-brand-line text-brand-muted"
                    : "bg-brand-bg-alt text-brand-muted"
              }
            >
              {status}
            </Badge>
          )}
        </div>
        {card.summary && <p className="line-clamp-3 text-sm text-brand-muted">{card.summary}</p>}
        {card.category && <p className="text-xs text-brand-muted">Category: {card.category}</p>}

        {isStrong && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-brand-muted">Link to a sourcing inquiry</label>
            <select
              defaultValue={card.interaction?.linkedInquiryId ?? ""}
              onChange={(e) =>
                act.mutateAsync(e.target.value ? "INTERESTED" : "INTERESTED")
              }
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
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            size="sm"
            variant={status === "SAVED" ? "default" : "outline"}
            onClick={() => act.mutate("SAVED")}
            disabled={act.isPending}
          >
            {status === "SAVED" ? "Saved" : "Save"}
          </Button>
          <Button
            size="sm"
            variant={status === "INTERESTED" ? "default" : "outline"}
            onClick={() => act.mutate("INTERESTED")}
            disabled={act.isPending}
          >
            {status === "INTERESTED" ? "Interested" : "Express interest"}
          </Button>
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
      </CardContent>
    </Card>
  );
}

export default function MarketOffersPanel() {
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
        <p className="text-sm text-brand-muted">Browse what manufacturers are selling. Save, express interest, or decline.</p>
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
            <OfferCard key={c.id} card={c} />
          ))}
        </div>
      )}
    </div>
  );
}
