import { authedFetch, BASE } from "./_core";
import type { MatchSuggestionDto, MatchSuggestionStatus } from "@mea/shared";



// ── Match suggestions (dashboard read; agent writes) ─────────────────────

export async function fetchMatchSuggestions(): Promise<MatchSuggestionDto[]> {
  const res = await authedFetch(`${BASE}/api/match-suggestions`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load match suggestions");
  }
  return res.json();
}



export async function updateMatchSuggestionStatus(
  id: string,
  status: MatchSuggestionStatus,
): Promise<MatchSuggestionDto> {
  const res = await authedFetch(`${BASE}/api/match-suggestions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to update match suggestion");
  }
  return res.json();
}
