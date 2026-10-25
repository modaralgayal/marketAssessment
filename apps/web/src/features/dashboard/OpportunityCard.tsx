import { useState, type ReactNode } from "react";
import { Badge } from "../../components/ui/badge";
import {
  fetchOpportunityCardSourceUrl,
  fetchOpportunityCardAssetUrl,
  type OpportunityCardDto,
  type OpportunityRef,
  type OpportunityStatus,
} from "../../lib/api";

const STATUS_LABEL: Record<OpportunityStatus, string> = {
  DRAFT: "Draft",
  POSTED: "Open for buyer engagement",
  ARCHIVED: "Closed",
};

const STATUS_STYLES: Record<OpportunityStatus, string> = {
  DRAFT: "bg-brand-bg-alt text-brand-muted",
  POSTED: "bg-brand-teal/10 text-brand-teal",
  ARCHIVED: "bg-brand-line text-brand-muted",
};

export interface CardEngagement {
  recipients: number;
  engaged: number;
  pending: number;
}

function Stat({ label, value }: { label: string; value?: ReactNode }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wide text-brand-muted">{label}</dt>
      <dd className="text-sm text-brand-ink">{value}</dd>
    </div>
  );
}

function Fallback({ value }: { value?: string | null }) {
  return value && value.trim() ? value : "To be discussed";
}

export default function OpportunityCard({
  card,
  onEdit,
  onViewEngagement,
  onPublish,
  onUnpublish,
  engagement,
}: {
  card: OpportunityCardDto;
  onEdit: () => void;
  onViewEngagement?: () => void;
  onPublish?: () => void;
  onUnpublish?: () => void;
  engagement?: CardEngagement;
}) {
  const [shared, setShared] = useState(false);
  const meta = [card.territory, card.partner].filter(Boolean).join(" · ");
  const sourceCount = (card.sources ?? []).length;
  const assetCount = (card.assets ?? []).length;

  const share = async () => {
    const text = `${card.title}${meta ? ` — ${meta}` : ""}\n${card.objective ?? ""}`.trim();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard unavailable — still confirm the action to the user */
    }
    setShared(true);
    setTimeout(() => setShared(false), 1800);
  };

  const openRef = async (ref: OpportunityRef, type: "source" | "asset") => {
    try {
      if (ref.kind === "link" && ref.url) {
        window.open(ref.url, "_blank", "noopener,noreferrer");
        return;
      }
      if (!ref.id) return;
      const { url } =
        type === "source"
          ? await fetchOpportunityCardSourceUrl(card.id, ref.id)
          : await fetchOpportunityCardAssetUrl(card.id, ref.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      /* not viewable */
    }
  };

  return (
    <article className="rounded-2xl border border-brand-line border-t-[3px] border-t-brand-teal bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <Badge className={STATUS_STYLES[card.status] ?? STATUS_STYLES.DRAFT}>
          {STATUS_LABEL[card.status] ?? card.status}
        </Badge>
        <span className="text-[11px] uppercase tracking-wide text-brand-muted">
          v{card.version ?? 1}
        </span>
      </div>

      <h3 className="mt-3 text-lg font-semibold leading-snug text-brand-ink">{card.title}</h3>
      {meta && <p className="mt-0.5 text-sm text-brand-muted">{meta}</p>}

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        <Stat label="Channels" value={card.channels?.length ? card.channels.join(", ") : null} />
        <Stat label="Timing" value={<Fallback value={card.timing} />} />
      </dl>

      {engagement && (
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-brand-line bg-brand-bg-alt/50 p-3 text-center">
          <div>
            <b className="block text-base text-brand-ink">{engagement.recipients}</b>
            <span className="text-[10px] uppercase tracking-wide text-brand-muted">Recipients</span>
          </div>
          <div>
            <b className="block text-base text-brand-ink">{engagement.engaged}</b>
            <span className="text-[10px] uppercase tracking-wide text-brand-muted">Engaged</span>
          </div>
          <div>
            <b className="block text-base text-brand-ink">{engagement.pending}</b>
            <span className="text-[10px] uppercase tracking-wide text-brand-muted">Awaiting reply</span>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-brand-line pt-3">
        <div className="flex flex-wrap items-center gap-3">
          {onViewEngagement ? (
            <button
              className="text-xs font-medium text-brand-teal hover:underline"
              onClick={onViewEngagement}
            >
              View buyer engagement →
            </button>
          ) : null}
          {onPublish && card.status !== "POSTED" ? (
            <button
              className="text-xs font-medium text-brand-teal hover:underline"
              onClick={onPublish}
            >
              Publish
            </button>
          ) : null}
          {onUnpublish && card.status === "POSTED" ? (
            <button
              className="text-xs font-medium text-brand-ink hover:underline"
              onClick={onUnpublish}
            >
              Unpublish
            </button>
          ) : null}
        </div>
        <button className="text-xs font-medium text-brand-ink hover:underline" onClick={onEdit}>
          Edit card
        </button>
      </div>

      {(sourceCount > 0 || assetCount > 0) && (
        <div className="mt-3 space-y-2 border-t border-brand-line pt-3">
          <div className="flex flex-wrap gap-1.5">
            {card.sources?.map((s, i) => (
              <button
                key={`s-${i}`}
                onClick={() => openRef(s, "source")}
                className="rounded-full border border-brand-line bg-white px-2.5 py-1 text-[11px] text-brand-ink hover:border-brand-teal hover:text-brand-teal"
                title={s.name}
              >
                {s.kind === "link" ? "🔗 " : "📄 "}
                {s.name}
              </button>
            ))}
            {card.assets?.map((a, i) => (
              <button
                key={`a-${i}`}
                onClick={() => openRef(a, "asset")}
                className="rounded-full border border-brand-line bg-white px-2.5 py-1 text-[11px] text-brand-ink hover:border-brand-teal hover:text-brand-teal"
                title={a.name}
              >
                {a.kind === "link" ? "🔗 " : "📄 "}
                {a.name}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-brand-muted">
              {sourceCount > 0 && `${sourceCount} catalogue reference${sourceCount !== 1 ? "s" : ""}`}
              {assetCount > 0 && ` · ${assetCount} attachment${assetCount !== 1 ? "s" : ""}`}
            </span>
            <button
              className="text-xs font-medium text-brand-ink hover:underline disabled:opacity-50"
              onClick={share}
              disabled={shared}
            >
              {shared ? "Link copied" : "Share card ↗"}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
