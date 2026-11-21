import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  fetchMyOpportunityCards,
  publishOpportunityCard,
  unpublishOpportunityCard,
  type OpportunityCardDto,
} from "../../lib/api";
import OpportunityCardEditor from "./OpportunityCardEditor";
import OpportunityCard from "./OpportunityCard";
import OpportunityCardDetail from "./OpportunityCardDetail";

export default function OpportunityCardsPanel({
  noun,
  emptyHint,
  onGoToCatalogue,
}: {
  noun: string;
  emptyHint: string;
  onGoToCatalogue?: () => void;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<OpportunityCardDto | null>(null);
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<OpportunityCardDto | null>(null);

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ["my-opportunity-cards"],
    queryFn: () => fetchMyOpportunityCards(),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["my-opportunity-cards"] });
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

  if (viewing) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setViewing(null)}
          className="text-xs font-medium text-brand-teal hover:underline"
        >
          ← Back to {noun}s
        </button>
        <OpportunityCardDetail
          card={viewing}
          onEdit={() => {
            setEditing(viewing);
            setViewing(null);
          }}
        />
      </div>
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
                onEdit={() => setEditing(card)}
                onView={() => setViewing(card)}
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
