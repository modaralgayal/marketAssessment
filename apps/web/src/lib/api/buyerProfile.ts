import { authedFetch, BASE } from "./_core";
import { ApiError } from "./errors";
import type { BuyerProfileDto, BuyerProfileInput } from "@mea/shared";



// ── Buyer profile ───────────────────────────────────────────────────────

export async function fetchBuyerProfile(): Promise<BuyerProfileDto | null> {
  const res = await authedFetch(`${BASE}/api/buyer-profile`);
  // 404 = no profile created yet. That's an expected state (the buyer is about to
  // fill the form for the first time), so return null rather than throwing.
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load profile");
  }
  return res.json();
}



export async function upsertBuyerProfile(data: BuyerProfileInput): Promise<BuyerProfileDto> {
  const res = await authedFetch(`${BASE}/api/buyer-profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (body.fields) throw new ApiError(body.error ?? "Failed to save profile", body.fields);
    throw new Error(body.error ?? "Failed to save profile");
  }
  return res.json();
}



/** Upload the buyer's profile logo / image. */
export async function uploadBuyerLogo(file: File): Promise<BuyerProfileDto> {
  const form = new FormData();
  form.append("logo", file);
  const res = await authedFetch(`${BASE}/api/buyer-profile/logo`, { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to upload logo");
  }
  return res.json();
}



/** Remove the buyer's profile logo. */
export async function deleteBuyerLogo(): Promise<void> {
  const res = await authedFetch(`${BASE}/api/buyer-profile/logo`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to remove logo");
}



/** Fetch a buyer's public profile (manufacturer-visible) by account id.
 *  Returns the full buyer profile (every field the buyer can enter) plus the
 *  account id and logo URL. */
export async function fetchBuyerPublicProfile(
  accountId: string,
): Promise<BuyerProfileDto & { accountId: string; logoUrl: string | null }> {
  const res = await authedFetch(`${BASE}/api/buyer-profile/public/${encodeURIComponent(accountId)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load buyer profile");
  }
  return res.json();
}



// ── Buyer portfolio documents ────────────────────────────────────────────

export interface BuyerFileDto {
  id: string;
  buyerProfileId: string;
  storageKey: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
}



export async function fetchBuyerPortfolio(): Promise<BuyerFileDto[]> {
  const res = await authedFetch(`${BASE}/api/buyer-profile/portfolio`);
  if (res.status === 404) return [];
  if (!res.ok) throw new Error("Failed to load portfolio");
  return res.json();
}



export async function uploadBuyerPortfolio(file: File): Promise<BuyerFileDto> {
  const form = new FormData();
  form.append("portfolio", file);
  const res = await authedFetch(`${BASE}/api/buyer-profile/portfolio`, { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to upload portfolio");
  }
  return res.json();
}



export async function deleteBuyerPortfolio(fileId: string): Promise<void> {
  const res = await authedFetch(`${BASE}/api/buyer-profile/portfolio/${fileId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete portfolio file");
}



export async function fetchBuyerPortfolioUrl(fileId: string): Promise<{ url: string; originalName: string }> {
  const res = await authedFetch(`${BASE}/api/buyer-profile/portfolio/${fileId}/download`);
  if (!res.ok) throw new Error("Failed to get portfolio URL");
  return res.json();
}
