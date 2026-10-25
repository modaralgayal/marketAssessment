import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  fetchMyOpportunityCards,
  fetchEngagement,
  fetchActivity,
  publishOpportunityCard,
  type EngagementRowDto,
} from "../../lib/api";
import ActivityList from "../dashboard/ActivityList";

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-brand-line bg-white p-4">
      <p className="text-2xl font-bold text-brand-ink">{value}</p>
      <p className="mt-0.5 text-xs text-brand-muted">{label}</p>
    </div>
  );
}

export default function ManufacturerOverview({ onGoTo }: { onGoTo: (key: string) => void }) {
  const { data: cards = [] } = useQuery({
    queryKey: ["my-opportunity-cards"],
    queryFn: () => fetchMyOpportunityCards(),
  });
  const { data: engagement = [] } = useQuery({
    queryKey: ["engagement"],
    queryFn: fetchEngagement,
  });
  const { data: activity = [] } = useQuery({ queryKey: ["activity"], queryFn: fetchActivity });

  const qc = useQueryClient();
  const publishCard = useMutation({
    mutationFn: (id: string) => publishOpportunityCard(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-opportunity-cards"] });
      qc.invalidateQueries({ queryKey: ["engagement"] });
    },
  });

  const published = cards.filter((c) => c.status === "POSTED").length;

  const byCard = useMemo(() => {
    const map = new Map<string, EngagementRowDto[]>();
    for (const row of engagement) {
      const arr = map.get(row.cardId) ?? [];
      arr.push(row);
      map.set(row.cardId, arr);
    }
    return map;
  }, [engagement]);

  const engaged = engagement.length;
  const interested = engagement.filter(
    (r) => r.status === "INTERESTED" || r.status === "REFERRED",
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-ink">Overview</h1>
        <p className="text-sm text-brand-muted">Your marketplace performance at a glance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Opportunity cards" value={cards.length} />
        <Stat label="Published" value={published} />
        <Stat label="Buyers engaged" value={engaged} />
        <Stat label="Expressed interest" value={interested} />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Opportunities</CardTitle>
          <Button size="sm" variant="outline" onClick={() => onGoTo("cards")}>
            Manage cards
          </Button>
        </CardHeader>
        <CardContent>
          {cards.length === 0 ? (
            <p className="text-sm text-brand-muted">No opportunity cards yet. Create one to reach buyers.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-line text-left text-xs uppercase tracking-wide text-brand-muted">
                    <th className="py-2 pr-4 font-medium">Opportunity</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 pr-4 font-medium">Engaged</th>
                    <th className="py-2 pr-4 font-medium">Buyer interest</th>
                    <th className="py-2 font-medium">Next action</th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map((c) => {
                    const rows = byCard.get(c.id) ?? [];
                    const interest = rows.filter(
                      (r) => r.status === "INTERESTED" || r.status === "REFERRED",
                    ).length;
                    return (
                      <tr key={c.id} className="border-b border-brand-line last:border-0">
                        <td className="py-3 pr-4">
                          <span className="font-medium text-brand-ink">{c.title}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge
                            className={
                              c.status === "POSTED"
                                ? "bg-brand-teal/10 text-brand-teal"
                                : "bg-brand-bg-alt text-brand-muted"
                            }
                          >
                            {c.status}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-brand-muted">{rows.length}</td>
                        <td className="py-3 pr-4 text-brand-muted">{interest}</td>
                        <td className="py-3">
                          {c.status === "POSTED" ? (
                            <Button size="sm" variant="outline" onClick={() => onGoTo("engagement")}>
                              Engage
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={publishCard.isPending}
                              onClick={() => publishCard.mutate(c.id)}
                            >
                              {publishCard.isPending ? "Publishing…" : "Publish"}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Needs your attention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {cards.some((c) => c.status !== "POSTED") && (
              <button
                onClick={() => onGoTo("cards")}
                className="flex w-full items-center justify-between rounded-lg border border-brand-line px-3 py-2.5 text-left text-sm hover:bg-brand-bg-alt"
              >
                <span className="text-brand-ink">You have unpublished cards — publish to reach buyers</span>
                <span className="text-brand-teal">→</span>
              </button>
            )}
            {engaged === 0 && published > 0 && (
              <p className="text-sm text-brand-muted">No buyers have interacted yet. Share your cards to drive engagement.</p>
            )}
            <button
              onClick={() => onGoTo("profile")}
              className="flex w-full items-center justify-between rounded-lg border border-brand-line px-3 py-2.5 text-left text-sm hover:bg-brand-bg-alt"
            >
              <span className="text-brand-ink">Complete your company profile + catalogue</span>
              <span className="text-brand-teal">→</span>
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent buyer activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityList events={activity} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
