import { authedFetch, BASE } from "./_core";



/** A single invite as returned by the admin list endpoint. */
export interface InviteDto {
  id: string;
  token: string;
  email: string | null;
  status: string;
  purpose: string;
  role?: string | null;
  createdAt: string;
  usedAt: string | null;
  link: string;
}



/** The result of creating an invite (subset of {@link InviteDto}). */
export interface CreateInviteResult {
  id: string;
  token: string;
  status: string;
  purpose: string;
  role?: string | null;
  link: string;
}



/** Admin: list invites (with their public links). */
export async function fetchInvites(): Promise<{ items: InviteDto[] }> {
  const res = await authedFetch(`${BASE}/api/invites`);
  if (!res.ok) throw new Error("Failed to load invites");
  return res.json();
}



/** Admin: create a single-use invite and return its link. */
export async function createInvite(
  email?: string,
  purpose?: "OPPORTUNITY" | "ONBOARDING" | "ACCOUNT",
  role?: "BUYER" | "MANUFACTURER",
): Promise<CreateInviteResult> {
  const res = await authedFetch(`${BASE}/api/invites`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(email ? { email, purpose, role } : { purpose, role }),
  });
  if (!res.ok) throw new Error("Failed to create invite");
  return res.json();
}



/** Admin: delete an invite by id. */
export async function deleteInvite(id: string): Promise<void> {
  const res = await authedFetch(`${BASE}/api/invites/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete invite");
}
