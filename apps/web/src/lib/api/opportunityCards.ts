import { authedFetch, BASE } from "./_core";
import type { EngagementRowDto, MarketCardDto, OpportunityCardDto, OpportunityCardInput, OpportunityInteractionStatus } from "@mea/shared";



// ── Opportunity-card attachments (catalogue refs + price list / terms) ──

/** A saved attachment descriptor for an opportunity card's `sources` / `assets`. */
export interface OpportunityAsset {
  id?: string;
  name: string;
  kind?: "pdf" | "link";
  url?: string;
  contentType?: string;
  sizeBytes?: number;
}



/** Upload an opportunity-specific price list / terms PDF. Returns the descriptor
 *  to store in the card's `assets`. */
export async function uploadOpportunityCardAsset(cardId: string, file: File): Promise<OpportunityAsset> {
  const form = new FormData();
  form.append("asset", file);
  const res = await authedFetch(`${BASE}/api/opportunity-cards/${cardId}/assets`, { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to upload price list");
  }
  return res.json();
}



/** Add an opportunity-specific price list / terms link. Returns the descriptor
 *  to store in the card's `assets`. */
export async function addOpportunityCardAssetLink(
  cardId: string,
  url: string,
  name?: string,
): Promise<OpportunityAsset> {
  const res = await authedFetch(`${BASE}/api/opportunity-cards/${cardId}/assets/link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, name }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to add price list link");
  }
  return res.json();
}



/** Best-effort delete of an uploaded asset's storage object. */
export async function deleteOpportunityCardAsset(cardId: string, assetId: string): Promise<void> {
  const res = await authedFetch(`${BASE}/api/opportunity-cards/${cardId}/assets/${assetId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to remove attachment");
}



/** Download an opportunity-specific asset (price list / terms PDF). */
export async function fetchOpportunityCardAssetUrl(
  cardId: string,
  assetId: string,
): Promise<{ url: string; originalName: string }> {
  const res = await authedFetch(`${BASE}/api/opportunity-cards/${cardId}/assets/${assetId}/download`);
  if (!res.ok) throw new Error("Failed to get attachment");
  return res.json();
}



/** Download a catalogue reference attached to the manufacturer's profile. */
export async function fetchOpportunityCardSourceUrl(
  cardId: string,
  sourceId: string,
): Promise<{ url: string; originalName: string }> {
  const res = await authedFetch(`${BASE}/api/opportunity-cards/${cardId}/sources/${sourceId}/download`);
  if (!res.ok) throw new Error("Failed to get catalogue reference");
  return res.json();
}



// ── Opportunity cards ────────────────────────────────────────────────────

/** Admin: fetch the full detail of a single opportunity card (by id) for the
 *  "Received cards" review queue. */
export async function fetchAdminOpportunityCard(cardId: string): Promise<OpportunityCardDto> {
  const res = await authedFetch(
    `${BASE}/api/opportunity-cards/admin/${encodeURIComponent(cardId)}`,
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load card");
  }
  return res.json();
}



export async function fetchMyOpportunityCards(status?: "DRAFT" | "POSTED" | "ARCHIVED"): Promise<OpportunityCardDto[]> {
  const qs = status ? `?status=${status}` : "";
  const res = await authedFetch(`${BASE}/api/opportunity-cards${qs}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load opportunity cards");
  }
  return res.json();
}



/** Marketplace browse: posted cards on the opposite side from the viewer,
 *  each enriched with the caller's own interaction state + the owner name. */
export async function fetchMarketOpportunityCards(): Promise<MarketCardDto[]> {
  const res = await authedFetch(`${BASE}/api/opportunity-cards/market`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load marketplace");
  }
  return res.json();
}



export async function createOpportunityCard(data: OpportunityCardInput): Promise<OpportunityCardDto> {
  const res = await authedFetch(`${BASE}/api/opportunity-cards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to create opportunity card");
  }
  return res.json();
}



export async function updateOpportunityCard(
  id: string,
  data: OpportunityCardInput,
): Promise<OpportunityCardDto> {
  const res = await authedFetch(`${BASE}/api/opportunity-cards/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to update opportunity card");
  }
  return res.json();
}



export async function deleteOpportunityCard(id: string): Promise<void> {
  const res = await authedFetch(`${BASE}/api/opportunity-cards/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to delete opportunity card");
  }
}



export async function publishOpportunityCard(id: string): Promise<OpportunityCardDto> {
  const res = await authedFetch(`${BASE}/api/opportunity-cards/${id}/publish`, { method: "POST" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to publish opportunity card");
  }
  return res.json();
}



export async function unpublishOpportunityCard(id: string): Promise<OpportunityCardDto> {
  const res = await authedFetch(`${BASE}/api/opportunity-cards/${id}/unpublish`, { method: "POST" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to unpublish opportunity card");
  }
  return res.json();
}



// ── Card interactions + engagement ───────────────────────────────────────

export interface CardInteractionResult {
  cardId: string;
  accountId: string;
  status: OpportunityInteractionStatus;
  linkedInquiryId?: string | null;
  referralNote?: string | null;
  conversationId?: string | null;
  lastActivityAt?: string | null;
}



export async function setCardInteraction(
  cardId: string,
  status: OpportunityInteractionStatus,
  extra?: { linkedInquiryId?: string; referralNote?: string },
): Promise<CardInteractionResult> {
  const res = await authedFetch(`${BASE}/api/opportunity-cards/${cardId}/interactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, ...extra }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to record interaction");
  }
  return res.json();
}



export async function fetchEngagement(): Promise<EngagementRowDto[]> {
  const res = await authedFetch(`${BASE}/api/opportunity-cards/engagement`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load engagement");
  }
  return res.json();
}



export async function shareOpportunityCard(cardId: string, recipientIds: string[], message?: string): Promise<{ shared: number }> {
  const res = await authedFetch(`${BASE}/api/opportunity-cards/${cardId}/share`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipientIds, message }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to share card");
  }
  return res.json();
}
