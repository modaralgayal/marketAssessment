import { authedFetch, BASE } from "./_core";



// ── Activity feed ─────────────────────────────────────────────────────────

export interface ActivityEventDto {
  id: string;
  type: string;
  payload: unknown;
  actorAccountId?: string;
  createdAt: string;
}



export async function fetchActivity(): Promise<ActivityEventDto[]> {
  const res = await authedFetch(`${BASE}/api/activity`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load activity");
  }
  return res.json();
}



/** Admin: every card-published / submitted-for-review event across all
 *  manufacturers, for the "Received cards" review queue. */
export async function fetchAdminCardActivity(): Promise<ActivityEventDto[]> {
  const res = await authedFetch(`${BASE}/api/activity/admin`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load received cards");
  }
  return res.json();
}
