import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { fetchMarketOpportunityCards } from "../../lib/api";

/**
 * Shows posted opportunity cards on the OPPOSITE side of the viewer (buyers see
 * what manufacturers are selling; manufacturers see what buyers are sourcing).
 * Read-only browse view — the matchmaking agent handles pairing.
 */
export default function MarketBrowser({
  oppositeNoun,
  emptyHint,
}: {
  oppositeNoun: string;
  emptyHint: string;
}) {
  const { data: cards = [], isLoading } = useQuery({
    queryKey: ["market-opportunity-cards"],
    queryFn: () => fetchMarketOpportunityCards(),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{oppositeNoun}s in the marketplace</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-brand-muted">Loading…</p>
        ) : cards.length === 0 ? (
          <p className="text-sm text-brand-muted">{emptyHint}</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {cards.map((card) => (
              <li
                key={card.id}
                className="rounded-xl border border-brand-line bg-white p-4"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-brand-ink">{card.title}</span>
                  <Badge className="bg-brand-teal/10 text-brand-teal">{card.side}</Badge>
                </div>
                {card.summary && (
                  <p className="mt-1 line-clamp-3 text-sm text-brand-muted">{card.summary}</p>
                )}
                {card.category && (
                  <p className="mt-1 text-xs text-brand-muted">Category: {card.category}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
