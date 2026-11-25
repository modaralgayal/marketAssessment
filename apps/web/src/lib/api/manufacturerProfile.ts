import { authedFetch, BASE } from "./_core";
import { ApiError } from "./errors";
import type { ManufacturerFileInfo, ManufacturerProfileDto, ManufacturerProfileInput, OpportunityCardDto } from "@mea/shared";



// ── Manufacturer profile ────────────────────────────────────────────────

export async function fetchManufacturerProfile(): Promise<ManufacturerProfileDto> {
  const res = await authedFetch(`${BASE}/api/manufacturer-profile`);
  if (res.status === 404) throw new Error("NO_PROFILE");
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load profile");
  }
  return res.json();
}



export async function upsertManufacturerProfile(
  data: ManufacturerProfileInput,
): Promise<ManufacturerProfileDto> {
  const res = await authedFetch(`${BASE}/api/manufacturer-profile`, {
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



// ── Manufacturer catalogue / price-list ─────────────────────────────────

export type ManufacturerFileDto = ManufacturerFileInfo;



/** Upload a catalogue / price-list PDF (kind "pdf"). */
export async function uploadManufacturerCatalogue(file: File): Promise<ManufacturerFileInfo> {
  const form = new FormData();
  form.append("catalogue", file);
  const res = await authedFetch(`${BASE}/api/manufacturer-profile/catalogue`, { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to upload catalogue");
  }
  return res.json();
}



/** Add a catalogue / price-list link (kind "link"). */
export async function addManufacturerCatalogueLink(url: string, name?: string): Promise<ManufacturerFileInfo> {
  const res = await authedFetch(`${BASE}/api/manufacturer-profile/catalogue/link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, name }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to add catalogue link");
  }
  return res.json();
}



/** Download a specific catalogue file (signed URL). */
export async function fetchManufacturerCatalogueFileUrl(
  fileId: string,
): Promise<{ url: string; originalName: string }> {
  const res = await authedFetch(`${BASE}/api/manufacturer-profile/catalogue/${fileId}/download`);
  if (!res.ok) throw new Error("Failed to get catalogue link");
  return res.json();
}



/** Remove a specific catalogue file. */
export async function deleteManufacturerCatalogueFile(fileId: string): Promise<void> {
  const res = await authedFetch(`${BASE}/api/manufacturer-profile/catalogue/${fileId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to remove catalogue");
}



/** Upload the manufacturer's profile logo / image (kind "logo"). */
export async function uploadManufacturerLogo(file: File): Promise<ManufacturerProfileDto> {
  const form = new FormData();
  form.append("logo", file);
  const res = await authedFetch(`${BASE}/api/manufacturer-profile/logo`, { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to upload logo");
  }
  return res.json();
}



/** Remove the manufacturer's profile logo. */
export async function deleteManufacturerLogo(): Promise<void> {
  const res = await authedFetch(`${BASE}/api/manufacturer-profile/logo`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to remove logo");
}



/** Fetch a manufacturer's public profile (buyer-visible) by account id.
 *  Returns the full company profile (every field the manufacturer can enter)
 *  plus the account id, logo URL and posted cards. */
export async function fetchManufacturerPublicProfile(
  accountId: string,
): Promise<
  ManufacturerProfileDto & {
    accountId: string;
    logoUrl: string | null;
    postedCards: OpportunityCardDto[];
  }
> {
  const res = await authedFetch(`${BASE}/api/manufacturer-profile/public/${encodeURIComponent(accountId)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load manufacturer profile");
  }
  return res.json();
}
