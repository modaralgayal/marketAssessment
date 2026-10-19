import type { ActivityEventDto } from "../../lib/api";

const LABELS: Record<string, string> = {
  inquiry_created: "Created a sourcing inquiry",
  card_published: "Published an opportunity card",
  interest_expressed: "Expressed interest in your card",
  referral_made: "Referred your card to a colleague",
  shared: "Shared an opportunity with you",
  viewed: "Viewed your card",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function ActivityList({ events }: { events: ActivityEventDto[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-brand-muted">No recent activity yet.</p>;
  }
  return (
    <ul className="space-y-3">
      {events.map((e) => {
        const payload = (e.payload ?? {}) as { title?: string; cardId?: string; message?: string };
        const isShared = e.type === "shared";
        return (
          <li key={e.id} className="flex items-start gap-3">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-teal" />
            <div className="min-w-0">
              <p className="text-sm text-brand-ink">
                {LABELS[e.type] ?? e.type}
                {payload.title ? <>: <span className="font-medium">{payload.title}</span></> : null}
              </p>
              {isShared && payload.message ? (
                <p className="mt-0.5 text-xs italic text-brand-muted">“{payload.message}”</p>
              ) : null}
              <p className="text-xs text-brand-muted">{timeAgo(e.createdAt)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
