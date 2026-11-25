import { authedFetch, BASE } from "./_core";
import type { SourcingInquiryDto, SourcingInquiryInput } from "@mea/shared";



// ── Sourcing inquiries (buyer buying briefs) ─────────────────────────────

export async function fetchSourcingInquiries(): Promise<SourcingInquiryDto[]> {
  const res = await authedFetch(`${BASE}/api/sourcing-inquiries`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load sourcing inquiries");
  }
  return res.json();
}



export async function createSourcingInquiry(data: SourcingInquiryInput): Promise<SourcingInquiryDto> {
  const res = await authedFetch(`${BASE}/api/sourcing-inquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to create sourcing inquiry");
  }
  return res.json();
}



export async function updateSourcingInquiry(
  id: string,
  data: SourcingInquiryInput,
): Promise<SourcingInquiryDto> {
  const res = await authedFetch(`${BASE}/api/sourcing-inquiries/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to update sourcing inquiry");
  }
  return res.json();
}



export async function deleteSourcingInquiry(id: string): Promise<void> {
  const res = await authedFetch(`${BASE}/api/sourcing-inquiries/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to delete sourcing inquiry");
  }
}



export async function uploadInquiryBrief(inquiryId: string, file: File): Promise<unknown> {
  const form = new FormData();
  form.append("brief", file);
  const res = await authedFetch(`${BASE}/api/sourcing-inquiries/${inquiryId}/briefs`, { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to upload brief");
  }
  return res.json();
}



export async function fetchInquiryBriefUrl(inquiryId: string, fileId: string): Promise<{ url: string; originalName: string }> {
  const res = await authedFetch(`${BASE}/api/sourcing-inquiries/${inquiryId}/briefs/${fileId}/download`);
  if (!res.ok) throw new Error("Failed to get brief URL");
  return res.json();
}
