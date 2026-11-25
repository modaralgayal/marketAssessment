import { authedFetch, BASE } from "./_core";
import type { AccountDto, AccountListDto } from "@mea/shared";



// ── Self-service accounts (buyer / manufacturer) ─────────────────────────

/** Self-service bootstrap: after Firebase sign-in, create or fetch the Account
 *  from the invite token. Idempotent — returns the existing Account if present.
 *  `acceptPrivacy` records acceptance of the current privacy-policy version. */
export async function bootstrapAccount(
  inviteToken?: string,
  acceptPrivacy?: boolean,
): Promise<AccountDto> {
  const res = await authedFetch(`${BASE}/api/accounts/bootstrap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...(inviteToken ? { inviteToken } : {}), ...(acceptPrivacy ? { acceptPrivacy } : {}) }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to create your account");
  }
  return res.json();
}



/** Self-service: fetch the signed-in account (403 if no Account yet). */
export async function fetchAccountMe(): Promise<AccountDto> {
  const res = await authedFetch(`${BASE}/api/accounts/me`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load account");
  }
  return res.json();
}



/** Admin: list all self-service buyer/manufacturer accounts. */
export async function fetchAccounts(): Promise<{ items: AccountListDto[] }> {
  const res = await authedFetch(`${BASE}/api/accounts`);
  if (!res.ok) throw new Error("Failed to load accounts");
  return res.json();
}



/** Self-service: accept the latest privacy-policy version. */
export async function acceptPrivacy(): Promise<AccountDto> {
  const res = await authedFetch(`${BASE}/api/accounts/me/privacy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accept: true }),
  });
  if (!res.ok) throw new Error("Failed to accept privacy policy");
  return res.json();
}



// ── Admin account actions ─────────────────────────────────────────────────

/** Admin: disable an account (rejected at sign-in). */
export async function disableAccount(id: string): Promise<AccountDto> {
  const res = await authedFetch(`${BASE}/api/accounts/${id}/disable`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to disable account");
  return res.json();
}



/** Admin: re-enable a disabled account. */
export async function enableAccount(id: string): Promise<AccountDto> {
  const res = await authedFetch(`${BASE}/api/accounts/${id}/enable`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to enable account");
  return res.json();
}



/** Admin: email the user a Firebase password-reset link. */
export async function adminResetPassword(id: string): Promise<{ emailSent: boolean }> {
  const res = await authedFetch(`${BASE}/api/accounts/${id}/reset-password`, { method: "POST" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to send password reset");
  }
  return res.json();
}



/** Admin: email the user a Firebase email-verification link. */
export async function adminResendVerification(id: string): Promise<{ emailSent: boolean }> {
  const res = await authedFetch(`${BASE}/api/accounts/${id}/resend-verification`, { method: "POST" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to resend verification");
  }
  return res.json();
}



/** Admin: permanently delete an account (irreversible — erases the Firebase
 *  user and cascades to the profile and related records). */
export async function deleteAccount(id: string): Promise<{ ok: true }> {
  const res = await authedFetch(`${BASE}/api/accounts/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to delete account");
  }
  return res.json();
}



// ── Self-service account data ─────────────────────────────────────────────

/** Self-service: export the user's own data (JSON). */
export async function exportMyData(): Promise<unknown> {
  const res = await authedFetch(`${BASE}/api/accounts/me/export`);
  if (!res.ok) throw new Error("Failed to export your data");
  return res.json();
}



/** Self-service: delete the user's own account (irreversible). */
export async function deleteMyAccount(): Promise<{ ok: true }> {
  const res = await authedFetch(`${BASE}/api/accounts/me`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete your account");
  return res.json();
}
