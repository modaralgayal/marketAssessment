import { useState } from "react";
import type { ReactNode } from "react";
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
  IN_REVIEW: "Internal review",
  PAUSED: "Paused",
  ARCHIVED: "Closed",
};

const STATUS_STYLES: Record<OpportunityStatus, string> = {
  DRAFT: "bg-brand-bg-alt text-brand-muted",
  POSTED: "bg-brand-teal/10 text-brand-teal",
  IN_REVIEW: "bg-brand-orange/15 text-brand-ink",
  PAUSED: "bg-brand-line text-brand-muted",
  ARCHIVED: "bg-brand-line text-brand-muted",
};

function Field({ label, value }: { label: string; value?: string | string[] | null }) {
  if (value == null || (Array.isArray(value) && value.length === 0) || value === "") return null;
  const text = Array.isArray(value) ? value.join(", ") : value;
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-brand-muted">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-wrap text-sm text-brand-ink">{text}</dd>
    </div>
  );
}

/** A boxed section that mirrors the grouping used in the card editor/creator. */
function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-3 rounded-2xl border border-brand-line bg-brand-bg-alt/40 p-4">
      <div>
        <p className="text-sm font-semibold text-brand-ink">{title}</p>
        {hint && <p className="text-xs text-brand-muted">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

export default function OpportunityCardDetail({
  card,
  onEdit,
  onClose,
  onViewEngagement,
  interactiveAssets = true,
}: {
  card: OpportunityCardDto;
  onEdit?: () => void;
  onClose?: () => void;
  onViewEngagement?: () => void;
  /** When false (e.g. the admin queue), catalogue/attachment links are shown but
   *  not clickable — the admin may not own the card, so opening them would 401. */
  interactiveAssets?: boolean;
}) {
  const [shared, setShared] = useState(false);
  const meta = [card.territory, card.partner].filter(Boolean).join(" · ");
  const objective = card.objective || card.summary;
  const sourceCount = (card.sources ?? []).length;
  const assetCount = (card.assets ?? []).length;

  const share = async () => {
    const text = `${card.title}${meta ? ` — ${meta}` : ""}\n${objective ?? ""}`.trim();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard unavailable — still confirm the action to the user */
    }
    setShared(true);
    setTimeout(() => setShared(false), 1800);
  };

  const openRef = async (ref: OpportunityRef, type: "source" | "asset") => {
    if (!interactiveAssets) return;
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

  const sourceChips = (card.sources ?? []).map((s, i) => (
    <button
      key={`s-${i}`}
      onClick={() => openRef(s, "source")}
      disabled={!interactiveAssets}
      className="rounded-full border border-brand-line bg-white px-2.5 py-1 text-[11px] text-brand-ink enabled:hover:border-brand-teal enabled:hover:text-brand-teal disabled:cursor-default"
      title={s.name}
    >
      {s.kind === "link" ? "🔗 " : "📄 "}
      {s.name}
    </button>
  ));

  const assetChips = (card.assets ?? []).map((a, i) => (
    <button
      key={`a-${i}`}
      onClick={() => openRef(a, "asset")}
      disabled={!interactiveAssets}
      className="rounded-full border border-brand-line bg-white px-2.5 py-1 text-[11px] text-brand-ink enabled:hover:border-brand-teal enabled:hover:text-brand-teal disabled:cursor-default"
      title={a.name}
    >
      {a.kind === "link" ? "🔗 " : "📄 "}
      {a.name}
    </button>
  ));

  return (
    <article className="rounded-2xl border border-brand-line border-t-[3px] border-t-brand-teal bg-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <Badge className={STATUS_STYLES[card.status] ?? STATUS_STYLES.DRAFT}>
          {STATUS_LABEL[card.status] ?? card.status}
        </Badge>
        <span className="text-[11px] uppercase tracking-wide text-brand-muted">v{card.version ?? 1}</span>
      </div>
      <h3 className="mt-3 text-xl font-semibold leading-snug text-brand-ink">{card.title}</h3>
      {meta && <p className="mt-0.5 text-sm text-brand-muted">{meta}</p>}

      <div className="mt-5 space-y-4">
        {/* Opportunity details — mirrors the editor's top field group */}
        <Section title="Opportunity details">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <Field label="Target country / territory" value={card.territory} />
            <Field label="Partner type" value={card.partner} />
            <Field
              label="Target sales channels"
              value={card.channels?.length ? card.channels : undefined}
            />
            <Field label="Target launch / timing" value={card.timing} />
          </dl>
          {objective && (
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-brand-muted">
                Commercial objective
              </dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-sm text-brand-ink">{objective}</dd>
            </div>
          )}
        </Section>

        {/* Catalogue / product reference */}
        {sourceCount > 0 && (
          <Section
            title="Catalogue / product reference"
            hint="Catalogue references attached to this opportunity."
          >
            <div className="flex flex-wrap gap-1.5">{sourceChips}</div>
          </Section>
        )}

        {/* Proposed commercial terms — mirrors the editor's terms + price-list group */}
        <Section
          title="Proposed commercial terms"
          hint="These terms apply to this opportunity. They do not replace the company's general operating information."
        >
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <Field label="Initial order / MOQ" value={card.moq} />
            <Field label="Payment terms" value={card.payment} />
            <Field label="Delivery terms / dispatch location" value={card.delivery} />
            <Field label="Distribution rights / exclusivity" value={card.rights} />
            <Field label="Proposed terms valid until" value={card.validUntil} />
            <Field label="Marketing / launch support" value={card.support} />
          </dl>

          {assetCount > 0 && (
            <div className="space-y-2 border-t border-brand-line pt-4">
              <p className="text-xs font-medium text-brand-ink">
                Opportunity-specific price list / terms{" "}
                <span className="font-normal text-brand-muted">(PDF or link)</span>
              </p>
              <div className="flex flex-wrap gap-1.5">{assetChips}</div>
            </div>
          )}
        </Section>
      </div>

      <div className="mt-6 flex items-center justify-between gap-2 border-t border-brand-line pt-4">
        <div className="flex flex-wrap items-center gap-3">
          {onViewEngagement ? (
            <button
              className="text-xs font-medium text-brand-teal hover:underline"
              onClick={onViewEngagement}
            >
              View buyer engagement →
            </button>
          ) : null}
          {onEdit ? (
            <button className="text-xs font-medium text-brand-teal hover:underline" onClick={onEdit}>
              Edit card
            </button>
          ) : null}
          <button
            className="text-xs font-medium text-brand-ink hover:underline disabled:opacity-50"
            onClick={share}
            disabled={shared}
          >
            {shared ? "Link copied" : "Share card ↗"}
          </button>
        </div>
        {onClose ? (
          <button className="text-xs font-medium text-brand-ink hover:underline" onClick={onClose}>
            Close
          </button>
        ) : null}
      </div>
    </article>
  );
}
