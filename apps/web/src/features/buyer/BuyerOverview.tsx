import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  fetchSourcingInquiries,
  fetchMarketOpportunityCards,
  fetchActivity,
  type SourcingInquiryDto,
} from "../../lib/api";
import ActivityList from "../dashboard/ActivityList";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-brand-bg-alt text-brand-muted",
  OPEN: "bg-brand-teal/10 text-brand-teal",
  PAUSED: "bg-amber-100 text-amber-700",
  CLOSED: "bg-brand-line text-brand-muted",
};

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-brand-line bg-white p-4">
      <p className="text-2xl font-bold text-brand-ink">{value}</p>
      <p className="mt-0.5 text-xs text-brand-muted">{label}</p>
    </div>
  );
}

export default function BuyerOverview({ onGoTo }: { onGoTo: (key: string) => void }) {
  const { data: inquiries = [] } = useQuery({
    queryKey: ["sourcing-inquiries"],
    queryFn: fetchSourcingInquiries,
  });
  const { data: market = [] } = useQuery({
    queryKey: ["market-opportunity-cards"],
    queryFn: fetchMarketOpportunityCards,
  });
  const { data: activity = [] } = useQuery({ queryKey: ["activity"], queryFn: fetchActivity });

  const open = inquiries.filter((i) => i.status === "OPEN").length;
  const saved = market.filter((c) => c.interaction?.status === "SAVED").length;
  const interested = market.filter((c) => c.interaction?.status === "INTERESTED").length;

  const recent = inquiries.slice(0, 4);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-ink">Overview</h1>
        <p className="text-sm text-brand-muted">Your sourcing at a glance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Sourcing inquiries" value={inquiries.length} />
        <Stat label="Open briefs" value={open} />
        <Stat label="Saved offers" value={saved} />
        <Stat label="Offers of interest" value={interested} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Your sourcing inquiries</CardTitle>
            <Button size="sm" variant="outline" onClick={() => onGoTo("inquiries")}>
              View all
            </Button>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-sm text-brand-muted">
                No inquiries yet. Open a buying brief to start getting matched.
              </p>
            ) : (
              <ul className="divide-y divide-brand-line">
                {recent.map((i: SourcingInquiryDto) => (
                  <li key={i.id} className="flex items-center justify-between py-3 first:pt-0">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-brand-ink">{i.title}</p>
                      <p className="truncate text-xs text-brand-muted">
                        {i.products.slice(0, 60)}
                        {i.products.length > 60 ? "…" : ""}
                      </p>
                    </div>
                    <Badge className={STATUS_STYLES[i.status]}>{i.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityList events={activity} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Needs your attention</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {inquiries.length === 0 && (
            <button
              onClick={() => onGoTo("inquiries")}
              className="flex w-full items-center justify-between rounded-lg border border-brand-line px-3 py-2.5 text-left text-sm hover:bg-brand-bg-alt"
            >
              <span className="text-brand-ink">Open your first sourcing inquiry</span>
              <span className="text-brand-teal">→</span>
            </button>
          )}
          {market.length > 0 && interested === 0 && saved === 0 && (
            <button
              onClick={() => onGoTo("market")}
              className="flex w-full items-center justify-between rounded-lg border border-brand-line px-3 py-2.5 text-left text-sm hover:bg-brand-bg-alt"
            >
              <span className="text-brand-ink">{market.length} manufacturer offers are waiting — review them</span>
              <span className="text-brand-teal">→</span>
            </button>
          )}
          <button
            onClick={() => onGoTo("profile")}
            className="flex w-full items-center justify-between rounded-lg border border-brand-line px-3 py-2.5 text-left text-sm hover:bg-brand-bg-alt"
          >
            <span className="text-brand-ink">Complete your buyer profile for better matches</span>
            <span className="text-brand-teal">→</span>
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
