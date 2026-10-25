import { useMemo } from "react";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  fetchEngagement,
  fetchMyOpportunityCards,
  publishOpportunityCard,
  unpublishOpportunityCard,
  type EngagementRowDto,
  type OpportunityCardDto,
} from "../../lib/api";
import OpportunityCardEditor from "./OpportunityCardEditor";
import OpportunityCard, { type CardEngagement } from "./OpportunityCard";

export default function OpportunityCardsPanel({
  noun,
  emptyHint,
  onViewEngagement,
  onGoToCatalogue,
}: {
  noun: string;
  emptyHint: string;
  onViewEngagement?: (cardId: string) => void;
  onGoToCatalogue?: () => void;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<OpportunityCardDto | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ["my-opportunity-cards"],
    queryFn: () => fetchMyOpportunityCards(),
  });
  const { data: engagement = [] } = useQuery({
    queryKey: ["engagement"],
    queryFn: fetchEngagement,
  });

  const engagementByCard = useMemo(() => {
    const map = new Map<string, CardEngagement>();
    for (const row of engagement as EngagementRowDto[]) {
      const e = map.get(row.cardId) ?? { recipients: 0, engaged: 0, pending: 0 };
      e.recipients += 1;
      if (row.status === "INTERESTED" || row.status === "REFERRED") e.engaged += 1;
      else if (row.status === "VIEWED" || row.status === "SAVED") e.pending += 1;
      map.set(row.cardId, e);
    }
    return map;
  }, [engagement]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["my-opportunity-cards"] });
    qc.invalidateQueries({ queryKey: ["engagement"] });
  };

  const publishCard = useMutation({ mutationFn: (id: string) => publishOpportunityCard(id), onSuccess: invalidate });
  const unpublishCard = useMutation({ mutationFn: (id: string) => unpublishOpportunityCard(id), onSuccess: invalidate });

  useEffect(() => {
    if (editing || creating) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [editing, creating]);

  if (creating || editing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{editing ? `Edit ${noun}` : `Create ${noun}`}</CardTitle>
        </CardHeader>
        <CardContent>
          <OpportunityCardEditor
            initial={editing ?? undefined}
            noun={noun}
            onGoToCatalogue={onGoToCatalogue}
            onSaved={() => {
              setEditing(null);
              setCreating(false);
              invalidate();
            }}
            onCancel={() => {
              setEditing(null);
              setCreating(false);
            }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Your {noun}s</CardTitle>
        <Button size="sm" onClick={() => setCreating(true)}>
          + New {noun}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-brand-muted">Loading…</p>
        ) : cards.length === 0 ? (
          <p className="text-sm text-brand-muted">{emptyHint}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {cards.map((card) => (
              <OpportunityCard
                key={card.id}
                card={card}
                engagement={engagementByCard.get(card.id)}
                onEdit={() => setEditing(card)}
                onViewEngagement={
                  onViewEngagement ? () => onViewEngagement(card.id) : undefined
                }
                onPublish={() => publishCard.mutate(card.id)}
                onUnpublish={() => unpublishCard.mutate(card.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
