import { auth } from "../firebase";

// Re-export shared types so feature components can import DTOs / input types
// from this module instead of reaching into @mea/shared directly.
export type {
  AccountDto,
  AccountRole,
  ManufacturerProfileDto,
  ManufacturerProfileInput,
  ManufacturerFileInfo,
  BuyerProfileDto,
  BuyerProfileInput,
  OpportunityCardDto,
  OpportunityCardInput,
  OpportunityStatus,
  OpportunityRef,
  MarketCardDto,
  EngagementRowDto,
  SourcingInquiryDto,
  SourcingInquiryInput,
  SourcingInquiryStatus,
  OpportunityInteractionStatus,
  MatchSuggestionDto,
  MatchSuggestionStatus,
  AccessRequestDto,
  AccountListDto,
  PrivacyPolicyVersionDto,
  ConversationDto,
  MessageDto,
} from "@mea/shared";

export const BASE = import.meta.env.VITE_API_BASE_URL ?? "";

// ── Auth header + global session-expiry handling ──────────────────────────

async function authHeader(): Promise<Record<string, string>> {
  // Wait until Firebase has finished initializing its auth state. Reading
  // `currentUser` synchronously during a cold start (e.g. right after signing
  // in, or on a fresh tab) can return null even though the session is valid,
  // which would omit the Authorization header and yield "Missing bearer token".
  if (typeof auth.authStateReady === "function") {
    try {
      await auth.authStateReady();
    } catch {
      /* if it ever rejects, fall through to the currentUser check below */
    }
  }
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

// Fired once when an authenticated request returns 401 (expired / invalid
// token), so the app can sign the user out app-wide instead of surfacing raw
// "Missing bearer token" / "Invalid or expired token" errors.
let unauthorizedHandler: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
  unauthorizedHandler = fn;
}

/** Like `fetch`, but attaches the Firebase ID token and treats a 401 on an
 *  authenticated request as a session expiry (invoking the handler above). */
export async function authedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = await authHeader();
  const hadToken = "Authorization" in headers;
  // Callers always pass plain-object headers; merge them over the auth header.
  const mergedHeaders: Record<string, string> = {
    ...headers,
    ...(init.headers as Record<string, string> | undefined),
  };
  const res = await fetch(input, { ...init, headers: mergedHeaders });
  if (res.status === 401 && hadToken) unauthorizedHandler?.();
  return res;
}
