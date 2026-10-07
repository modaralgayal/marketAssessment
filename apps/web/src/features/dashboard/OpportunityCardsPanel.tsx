import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import {
  deleteOpportunityCard,
  fetchMyOpportunityCards,
  publishOpportunityCard,
  unpublishOpportunityCard,
  type OpportunityCardDto,
} from "../../lib/api";
import OpportunityCardEditor from "./OpportunityCardEditor";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-brand-bg-alt text-brand-muted",
  POSTED: "bg-brand-teal/10 text-brand-teal",
  ARCHIVED: "bg-brand-line text-brand-muted",
};

export default function OpportunityCardsPanel({
  noun,
  emptyHint,
}: {
  noun: string;
  emptyHint: string;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<OpportunityCardDto | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ["my-opportunity-cards"],
    queryFn: () => fetchMyOpportunityCards(),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["my-opportunity-cards"] });

  const publish = useMutation({
    mutationFn: (id: string) => publishOpportunityCard(id),
    onSuccess: invalidate,
  });
  const unpublish = useMutation({
    mutationFn: (id: string) => unpublishOpportunityCard(id),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteOpportunityCard(id),
    onSuccess: invalidate,
  });

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
          Create {noun}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-brand-muted">Loading…</p>
        ) : cards.length === 0 ? (
          <p className="text-sm text-brand-muted">{emptyHint}</p>
        ) : (
          <ul className="divide-y divide-brand-line">
            {cards.map((card) => (
              <li key={card.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold text-brand-ink">{card.title}</span>
                      <Badge className={STATUS_STYLES[card.status]}>{card.status}</Badge>
                    </div>
                    {card.summary && (
                      <p className="mt-1 line-clamp-2 text-sm text-brand-muted">{card.summary}</p>
                    )}
                    {card.category && (
                      <p className="mt-1 text-xs text-brand-muted">Category: {card.category}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {card.status === "POSTED" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => unpublish.mutate(card.id)}
                        disabled={unpublish.isPending}
                      >
                        Unpublish
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => publish.mutate(card.id)}
                        disabled={publish.isPending}
                      >
                        Publish
                      </Button>
                    )}
                    <div className="flex gap-1">
                      <button
                        className="text-xs font-medium text-brand-teal hover:underline"
                        onClick={() => setEditing(card)}
                      >
                        Edit
                      </button>
                      <Separator orientation="vertical" className="h-3" />
                      <button
                        className="text-xs font-medium text-red-600 hover:underline"
                        onClick={() => remove.mutate(card.id)}
                        disabled={remove.isPending}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
