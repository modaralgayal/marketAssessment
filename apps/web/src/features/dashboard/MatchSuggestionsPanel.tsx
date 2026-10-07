import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  fetchMatchSuggestions,
  fetchMyOpportunityCards,
  fetchMarketOpportunityCards,
  updateMatchSuggestionStatus,
} from "../../lib/api";

const STATUS_STYLES: Record<string, string> = {
  NEW: "bg-brand-bg-alt text-brand-muted",
  REVIEWED: "bg-brand-teal/10 text-brand-teal",
  ACCEPTED: "bg-green-100 text-green-700",
  DISMISSED: "bg-brand-line text-brand-muted",
};

export default function MatchSuggestionsPanel({ oppositeNoun }: { oppositeNoun: string }) {
  const qc = useQueryClient();

  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ["match-suggestions"],
    queryFn: () => fetchMatchSuggestions(),
  });
  const { data: myCards = [] } = useQuery({
    queryKey: ["my-opportunity-cards"],
    queryFn: () => fetchMyOpportunityCards(),
  });
  const { data: marketCards = [] } = useQuery({
    queryKey: ["market-opportunity-cards"],
    queryFn: () => fetchMarketOpportunityCards(),
  });

  const myIds = useMemo(() => new Set(myCards.map((c) => c.id)), [myCards]);

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACCEPTED" | "DISMISSED" | "REVIEWED" }) =>
      updateMatchSuggestionStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["match-suggestions"] }),
  });

  const counterpartTitle = (cardAId: string, cardBId: string): string => {
    const otherId = myIds.has(cardAId) ? cardBId : cardAId;
    const found = marketCards.find((c) => c.id === otherId);
    return found?.title ?? `${oppositeNoun} (${otherId.slice(0, 8)})`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Match suggestions</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-brand-muted">Loading…</p>
        ) : suggestions.length === 0 ? (
          <p className="text-sm text-brand-muted">
            No match suggestions yet. Publish your opportunity cards so the matchmaking agent can pair you.
          </p>
        ) : (
          <ul className="divide-y divide-brand-line">
            {suggestions.map((s) => (
              <li key={s.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-brand-ink">
                        {counterpartTitle(s.cardAId, s.cardBId)}
                      </span>
                      <Badge className={STATUS_STYLES[s.status]}>{s.status}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-brand-muted">Match score: {Math.round(s.score * 100)}%</p>
                    {s.rationale && (
                      <p className="mt-1 text-sm text-brand-ink">{s.rationale}</p>
                    )}
                  </div>
                  {s.status !== "ACCEPTED" && s.status !== "DISMISSED" && (
                    <div className="flex shrink-0 gap-1">
                      <Button
                        size="sm"
                        onClick={() => setStatus.mutate({ id: s.id, status: "ACCEPTED" })}
                        disabled={setStatus.isPending}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setStatus.mutate({ id: s.id, status: "DISMISSED" })}
                        disabled={setStatus.isPending}
                      >
                        Dismiss
                      </Button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
