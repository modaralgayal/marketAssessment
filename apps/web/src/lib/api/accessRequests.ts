import { authedFetch, BASE } from "./_core";
import type { AccessRequestDto } from "@mea/shared";



// ── Access requests (public request → admin approval → invite email) ────────

/** Public: a visitor requests a buyer/manufacturer account. No auth. */
export async function requestAccess(payload: {
  name: string;
  email: string;
  company?: string;
  intendedRole: "BUYER" | "MANUFACTURER";
  message?: string;
}): Promise<AccessRequestDto> {
  const res = await fetch(`${BASE}/api/access-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to submit your request");
  }
  return res.json();
}



export interface AccessRequestListResponse {
  items: AccessRequestDto[];
}



/** Admin: list access requests newest-first. */
export async function fetchAccessRequests(): Promise<AccessRequestListResponse> {
  const res = await authedFetch(`${BASE}/api/access-requests`);
  if (!res.ok) throw new Error("Failed to load access requests");
  return res.json();
}



/** Admin: approve a request — mints an ACCOUNT invite, emails it, marks APPROVED.
 *  Returns the updated request plus the invite `link` and whether the email sent. */
export async function approveAccessRequest(
  id: string,
  role?: "BUYER" | "MANUFACTURER",
): Promise<AccessRequestDto & { link: string; emailSent: boolean }> {
  const res = await authedFetch(`${BASE}/api/access-requests/${id}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(role ? { role } : {}),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to approve request");
  }
  return res.json();
}



/** Admin: reject a request. */
export async function rejectAccessRequest(id: string): Promise<AccessRequestDto> {
  const res = await authedFetch(`${BASE}/api/access-requests/${id}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to reject request");
  }
  return res.json();
}
