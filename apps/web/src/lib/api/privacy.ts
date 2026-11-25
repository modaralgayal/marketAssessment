import { authedFetch, BASE } from "./_core";
import type { PrivacyPolicyVersionDto } from "@mea/shared";



// ── Privacy-policy versioning (consent) ───────────────────────────────────

/** Public: the latest published privacy-policy version. */
export async function fetchPrivacyVersion(): Promise<PrivacyPolicyVersionDto> {
  const res = await authedFetch(`${BASE}/api/privacy-policy/version`);
  if (!res.ok) throw new Error("Failed to load privacy policy version");
  return res.json();
}



/** Admin: publish a new privacy-policy version (bumps the number). */
export async function publishPrivacyVersion(note?: string): Promise<PrivacyPolicyVersionDto> {
  const res = await authedFetch(`${BASE}/api/privacy-policy/version`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(note ? { note } : {}),
  });
  if (!res.ok) throw new Error("Failed to publish privacy policy version");
  return res.json();
}
