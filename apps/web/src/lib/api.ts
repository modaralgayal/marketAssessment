import { auth } from "./firebase";
import type {
  SubmissionDto,
  DistributorDto,
  ManufacturerMatchDto,
  DistributorInput,
  DataTierTemplate,
  CatalogueExtractedData,
  CustomerDto,
  CustomerInput,
  CustomerProfileInput,
  AccountDto,
  ManufacturerProfileDto,
  ManufacturerProfileInput,
  ManufacturerFileInfo,
  BuyerProfileDto,
  BuyerProfileInput,
  OpportunityCardDto,
  OpportunityCardInput,
  MarketCardDto,
  EngagementRowDto,
  SourcingInquiryDto,
  SourcingInquiryInput,
  OpportunityInteractionStatus,
  MatchSuggestionDto,
  MatchSuggestionStatus,
  AccessRequestDto,
  AccountListDto,
  PrivacyPolicyVersionDto,
  ConversationDto,
  MessageDto,
} from "@mea/shared";

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

const BASE = import.meta.env.VITE_API_BASE_URL ?? "";

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

/** Public: submit the assessment form with attached files. */
export async function submitAssessment(
  payload: unknown,
  files: File[],
  invite?: string,
): Promise<{ id: string }> {
  const form = new FormData();
  form.append("payload", JSON.stringify(payload));
  for (const file of files) form.append("files", file);
  if (invite) form.append("invite", invite);

  const res = await fetch(`${BASE}/api/submissions`, { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Submission failed");
  }
  return res.json();
}

// ── Invites (assessment access gating) ────────────────────────────────────

/** Public: check whether an invite token is valid (used to gate /assessment). */
export async function validateInvite(token: string): Promise<{ valid: boolean; reason?: string; purpose?: string; role?: string }> {
  const res = await fetch(`${BASE}/api/invites/validate?token=${encodeURIComponent(token)}`);
  if (res.ok) return res.json();
  try {
    const body = await res.json();
    return { valid: false, reason: body.reason };
  } catch {
    return { valid: false };
  }
}

/** Public: submit a "Request a Report" form. */
export async function requestReport(payload: {
  subject: string;
  message: string;
  email: string;
}): Promise<{ id: string; emailSent: boolean }> {
  const res = await fetch(`${BASE}/api/report-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, consent: true }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to send your request");
  }
  return res.json();
}

/** Admin: list invites (with their public links). */
export async function fetchInvites(): Promise<{
  items: Array<{
    id: string;
    token: string;
    email: string | null;
    status: string;
    purpose: string;
    role?: string | null;
    createdAt: string;
    usedAt: string | null;
    link: string;
  }>;
}> {
  const res = await fetch(`${BASE}/api/invites`, { headers: await authHeader() });
  if (!res.ok) throw new Error("Failed to load invites");
  return res.json();
}

/** Admin: create a single-use invite and return its link. */
export async function createInvite(
  email?: string,
  purpose?: "OPPORTUNITY" | "ONBOARDING" | "ACCOUNT",
  role?: "BUYER" | "MANUFACTURER",
): Promise<{
  id: string;
  token: string;
  status: string;
  purpose: string;
  role?: string | null;
  link: string;
}> {
  const res = await fetch(`${BASE}/api/invites`, {
    method: "POST",
    headers: { ...(await authHeader()), "Content-Type": "application/json" },
    body: JSON.stringify(email ? { email, purpose, role } : { purpose, role }),
  });
  if (!res.ok) throw new Error("Failed to create invite");
  return res.json();
}

/** Admin: delete an invite by id. */
export async function deleteInvite(id: string): Promise<void> {
  const res = await fetch(`${BASE}/api/invites/${id}`, {
    method: "DELETE",
    headers: await authHeader(),
  });
  if (!res.ok) throw new Error("Failed to delete invite");
}

export interface SubmissionListResponse {
  total: number;
  items: SubmissionDto[];
}

/** Admin: list submissions. */
export async function fetchSubmissions(): Promise<SubmissionListResponse> {
  const res = await fetch(`${BASE}/api/submissions`, { headers: await authHeader() });
  if (!res.ok) throw new Error("Failed to load submissions");
  return res.json();
}

/** Admin: single submission. */
export async function fetchSubmission(id: string): Promise<SubmissionDto> {
  const res = await fetch(`${BASE}/api/submissions/${id}`, { headers: await authHeader() });
  if (!res.ok) throw new Error("Failed to load submission");
  return res.json();
}

/** Admin: delete a submission. */
export async function deleteSubmission(id: string): Promise<void> {
  const res = await fetch(`${BASE}/api/submissions/${id}`, {
    method: "DELETE",
    headers: await authHeader(),
  });
  if (!res.ok) throw new Error("Failed to delete submission");
}

/** Admin: get a signed download URL for a file. */
export async function fetchFileUrl(fileId: string): Promise<{ url: string; originalName: string }> {
  const res = await fetch(`${BASE}/api/files/${fileId}/download`, { headers: await authHeader() });
  if (!res.ok) throw new Error("Failed to get download link");
  return res.json();
}

/** Admin: get a signed download URL for a customer's file. */
export async function fetchCustomerFileUrl(fileId: string): Promise<{ url: string; originalName: string }> {
  const res = await fetch(`${BASE}/api/files/customer/${fileId}/download`, { headers: await authHeader() });
  if (!res.ok) throw new Error("Failed to get download link");
  return res.json();
}

export interface ScoreResult {
  score: number;
  explanation: string;
  decision?: string;
}

export async function evaluateSubmission(
  submissionId: string,
): Promise<ScoreResult> {
  const res = await fetch(`${BASE}/api/score`, {
    method: "POST",
    headers: {
      ...(await authHeader()),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ submissionId }),
  });

  if (!res.ok) {
    throw new Error("Failed to evaluate submission");
  }

  return res.json();
}

// ── Distributor CRUD ───────────────────────────────────────────────────

export async function fetchDistributors(): Promise<DistributorDto[]> {
  const res = await fetch(`${BASE}/api/distributors`, { headers: await authHeader() });
  if (!res.ok) throw new Error("Failed to load distributors");
  return res.json();
}

export async function fetchDistributor(id: string): Promise<DistributorDto> {
  const res = await fetch(`${BASE}/api/distributors/${id}`, { headers: await authHeader() });
  if (!res.ok) throw new Error("Failed to load distributor");
  return res.json();
}

export async function createDistributor(data: DistributorInput): Promise<DistributorDto> {
  const res = await fetch(`${BASE}/api/distributors`, {
    method: "POST",
    headers: { ...(await authHeader()), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create distributor");
  return res.json();
}

export async function updateDistributor(id: string, data: DistributorInput, googleAccessToken?: string): Promise<DistributorDto> {
  const payload = googleAccessToken ? { ...data, googleAccessToken } : data;
  const res = await fetch(`${BASE}/api/distributors/${id}`, {
    method: "PUT",
    headers: { ...(await authHeader()), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update distributor");
  return res.json();
}

export async function deleteDistributor(id: string): Promise<void> {
  const res = await fetch(`${BASE}/api/distributors/${id}`, {
    method: "DELETE",
    headers: await authHeader(),
  });
  if (!res.ok) throw new Error("Failed to delete distributor");
}

export async function importDistributors(data: DistributorInput[]): Promise<{ imported: number }> {
  const res = await fetch(`${BASE}/api/distributors/import`, {
    method: "POST",
    headers: { ...(await authHeader()), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to import distributors");
  return res.json();
}

export interface SyncResult {
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export async function syncDistributorsFromSheet(accessToken: string): Promise<SyncResult> {
  const res = await fetch(`${BASE}/api/distributors/sync`, {
    method: "POST",
    headers: { ...(await authHeader()), "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to sync from Google Sheets");
  }
  return res.json();
}

export async function syncSingleDistributorFromSheet(id: string, accessToken: string): Promise<DistributorDto> {
  const res = await fetch(`${BASE}/api/distributors/${id}/sync-from-sheet`, {
    method: "POST",
    headers: { ...(await authHeader()), "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to sync distributor from Google Sheets");
  }
  return res.json();
}

// ── Data Tier ──────────────────────────────────────────────────────────

export async function fetchDataTierTemplate(): Promise<DataTierTemplate> {
  const res = await fetch(`${BASE}/api/distributors/data-tier/template`, { headers: await authHeader() });
  if (!res.ok) throw new Error("Failed to load data tier template");
  return res.json();
}

export async function recalcDataTiers(): Promise<{ updated: number }> {
  const res = await fetch(`${BASE}/api/distributors/data-tier/recalc`, {
    method: "POST",
    headers: await authHeader(),
  });
  if (!res.ok) throw new Error("Failed to recalculate data tiers");
  return res.json();
}

export async function recalcDistributorTier(id: string): Promise<{ dataTier: number }> {
  const res = await fetch(`${BASE}/api/distributors/${id}/recalc-tier`, {
    method: "POST",
    headers: await authHeader(),
  });
  if (!res.ok) throw new Error("Failed to recalculate tier");
  return res.json();
}

// ── Matching ───────────────────────────────────────────────────────────

export async function findMatches(submissionId: string): Promise<ManufacturerMatchDto[]> {
  const res = await fetch(`${BASE}/api/submissions/${submissionId}/match`, {
    method: "POST",
    headers: await authHeader(),
  });
  if (!res.ok) throw new Error("Failed to find matches");
  return res.json();
}

export async function fetchMatches(submissionId: string): Promise<ManufacturerMatchDto[]> {
  const res = await fetch(`${BASE}/api/submissions/${submissionId}/matches`, {
    headers: await authHeader(),
  });
  if (!res.ok) throw new Error("Failed to fetch matches");
  return res.json();
}

// ── Catalogue Extraction ────────────────────────────────────────────────

export interface ExtractCatalogueResponse {
  catalogueData: CatalogueExtractedData;
  catalogueExtractedAt: string;
  fieldMapping: {
    matched: Array<{ key: string; label: string; value: any; mapsTo: string[] }>;
    additional: Array<{ key: string; label: string; value: string }>;
  };
}

export async function extractCatalogue(submissionId: string): Promise<ExtractCatalogueResponse> {
  const res = await fetch(`${BASE}/api/submissions/${submissionId}/extract-catalogue`, {
    method: "POST",
    headers: await authHeader(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to extract catalogue data");
  }
  return res.json();
}

export async function applyCatalogueMapping(
  submissionId: string,
  additionalFields: Array<{ key: string; value: string }>,
): Promise<void> {
  const res = await fetch(`${BASE}/api/submissions/${submissionId}/apply-catalogue-mapping`, {
    method: "POST",
    headers: { ...(await authHeader()), "Content-Type": "application/json" },
    body: JSON.stringify({ additionalFields }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to apply catalogue mapping");
  }
}

// ── Customer CRUD ───────────────────────────────────────────────────────

export async function fetchCustomers(): Promise<CustomerDto[]> {
  const res = await fetch(`${BASE}/api/customers`, { headers: await authHeader() });
  if (!res.ok) throw new Error("Failed to load customers");
  return res.json();
}

export async function fetchCustomer(id: string): Promise<CustomerDto> {
  const res = await fetch(`${BASE}/api/customers/${id}`, { headers: await authHeader() });
  if (!res.ok) throw new Error("Failed to load customer");
  return res.json();
}

/** Admin: fetch the customer created from a submission (404 if none yet). */
export async function fetchCustomerBySubmission(submissionId: string): Promise<CustomerDto> {
  const res = await fetch(`${BASE}/api/customers/from-submission/${submissionId}`, {
    headers: await authHeader(),
  });
  if (res.status === 404) throw new Error("NO_CUSTOMER");
  if (!res.ok) throw new Error("Failed to load customer");
  return res.json();
}

export async function createCustomer(data: CustomerInput): Promise<CustomerDto> {
  const res = await fetch(`${BASE}/api/customers`, {
    method: "POST",
    headers: { ...(await authHeader()), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create customer");
  return res.json();
}

export async function updateCustomer(id: string, data: CustomerInput): Promise<CustomerDto> {
  const res = await fetch(`${BASE}/api/customers/${id}`, {
    method: "PUT",
    headers: { ...(await authHeader()), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update customer");
  return res.json();
}

export async function deleteCustomer(id: string): Promise<void> {
  const res = await fetch(`${BASE}/api/customers/${id}`, {
    method: "DELETE",
    headers: await authHeader(),
  });
  if (!res.ok) throw new Error("Failed to delete customer");
}

/** Admin: convert a submission into a customer. */
export async function convertSubmissionToCustomer(submissionId: string): Promise<CustomerDto> {
  const res = await fetch(`${BASE}/api/customers/from-submission/${submissionId}`, {
    method: "POST",
    headers: await authHeader(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to convert submission to customer");
  }
  return res.json();
}

/** Admin: create a customer profile directly from the dashboard. */
export async function createCustomerProfile(data: CustomerProfileInput): Promise<CustomerDto> {
  const res = await fetch(`${BASE}/api/customers/profile`, {
    method: "POST",
    headers: { ...(await authHeader()), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to create customer profile");
  }
  return res.json();
}

/** Admin: upload a customer's logo. */
export async function uploadCustomerLogo(id: string, file: File): Promise<CustomerDto> {
  const form = new FormData();
  form.append("logo", file);
  const res = await fetch(`${BASE}/api/customers/${id}/logo`, {
    method: "POST",
    headers: await authHeader(),
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to upload logo");
  }
  return res.json();
}

/** Admin: move a customer between the 3 category buckets (Customers / Potential / Other). */
export async function setCustomerCategory(
  id: string,
  category: "CUSTOMER" | "POTENTIAL" | "OTHER",
): Promise<CustomerDto> {
  const res = await fetch(`${BASE}/api/customers/${id}/category`, {
    method: "PATCH",
    headers: { ...(await authHeader()), "Content-Type": "application/json" },
    body: JSON.stringify({ category }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to update category");
  }
  return res.json();
}

// ── Self-service accounts (buyer / manufacturer) ─────────────────────────

/** Self-service bootstrap: after Firebase sign-in, create or fetch the Account
 *  from the invite token. Idempotent — returns the existing Account if present.
 *  `acceptPrivacy` records acceptance of the current privacy-policy version. */
export async function bootstrapAccount(
  inviteToken?: string,
  acceptPrivacy?: boolean,
): Promise<AccountDto> {
  const res = await fetch(`${BASE}/api/accounts/bootstrap`, {
    method: "POST",
    headers: { ...(await authHeader()), "Content-Type": "application/json" },
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
  const res = await fetch(`${BASE}/api/accounts/me`, { headers: await authHeader() });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load account");
  }
  return res.json();
}

/** Admin: list all self-service buyer/manufacturer accounts. */
export async function fetchAccounts(): Promise<{ items: AccountListDto[] }> {
  const res = await fetch(`${BASE}/api/accounts`, { headers: await authHeader() });
  if (!res.ok) throw new Error("Failed to load accounts");
  return res.json();
}

// ── Privacy-policy versioning (consent) ───────────────────────────────────

/** Public: the latest published privacy-policy version. */
export async function fetchPrivacyVersion(): Promise<PrivacyPolicyVersionDto> {
  const res = await fetch(`${BASE}/api/privacy-policy/version`);
  if (!res.ok) throw new Error("Failed to load privacy policy version");
  return res.json();
}

/** Admin: publish a new privacy-policy version (bumps the number). */
export async function publishPrivacyVersion(note?: string): Promise<PrivacyPolicyVersionDto> {
  const res = await fetch(`${BASE}/api/privacy-policy/version`, {
    method: "POST",
    headers: { ...(await authHeader()), "Content-Type": "application/json" },
    body: JSON.stringify(note ? { note } : {}),
  });
  if (!res.ok) throw new Error("Failed to publish privacy policy version");
  return res.json();
}

/** Self-service: accept the latest privacy-policy version. */
export async function acceptPrivacy(): Promise<AccountDto> {
  const res = await fetch(`${BASE}/api/accounts/me/privacy`, {
    method: "POST",
    headers: { ...(await authHeader()), "Content-Type": "application/json" },
    body: JSON.stringify({ accept: true }),
  });
  if (!res.ok) throw new Error("Failed to accept privacy policy");
  return res.json();
}

// ── Admin account actions ─────────────────────────────────────────────────

/** Admin: disable an account (rejected at sign-in). */
export async function disableAccount(id: string): Promise<AccountDto> {
  const res = await fetch(`${BASE}/api/accounts/${id}/disable`, {
    method: "POST",
    headers: await authHeader(),
  });
  if (!res.ok) throw new Error("Failed to disable account");
  return res.json();
}

/** Admin: re-enable a disabled account. */
export async function enableAccount(id: string): Promise<AccountDto> {
  const res = await fetch(`${BASE}/api/accounts/${id}/enable`, {
    method: "POST",
    headers: await authHeader(),
  });
  if (!res.ok) throw new Error("Failed to enable account");
  return res.json();
}

/** Admin: email the user a Firebase password-reset link. */
export async function adminResetPassword(id: string): Promise<{ emailSent: boolean }> {
  const res = await fetch(`${BASE}/api/accounts/${id}/reset-password`, {
    method: "POST",
    headers: await authHeader(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to send password reset");
  }
  return res.json();
}

/** Admin: email the user a Firebase email-verification link. */
export async function adminResendVerification(id: string): Promise<{ emailSent: boolean }> {
  const res = await fetch(`${BASE}/api/accounts/${id}/resend-verification`, {
    method: "POST",
    headers: await authHeader(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to resend verification");
  }
  return res.json();
}

// ── Self-service account data ─────────────────────────────────────────────

/** Self-service: export the user's own data (JSON). */
export async function exportMyData(): Promise<unknown> {
  const res = await fetch(`${BASE}/api/accounts/me/export`, { headers: await authHeader() });
  if (!res.ok) throw new Error("Failed to export your data");
  return res.json();
}

/** Self-service: delete the user's own account (irreversible). */
export async function deleteMyAccount(): Promise<{ ok: true }> {
  const res = await fetch(`${BASE}/api/accounts/me`, {
    method: "DELETE",
    headers: await authHeader(),
  });
  if (!res.ok) throw new Error("Failed to delete your account");
  return res.json();
}

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
  const res = await fetch(`${BASE}/api/access-requests`, { headers: await authHeader() });
  if (!res.ok) throw new Error("Failed to load access requests");
  return res.json();
}

/** Admin: approve a request — mints an ACCOUNT invite, emails it, marks APPROVED.
 *  Returns the updated request plus the invite `link` and whether the email sent. */
export async function approveAccessRequest(
  id: string,
  role?: "BUYER" | "MANUFACTURER",
): Promise<AccessRequestDto & { link: string; emailSent: boolean }> {
  const res = await fetch(`${BASE}/api/access-requests/${id}/approve`, {
    method: "POST",
    headers: { ...(await authHeader()), "Content-Type": "application/json" },
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
  const res = await fetch(`${BASE}/api/access-requests/${id}/reject`, {
    method: "POST",
    headers: { ...(await authHeader()), "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to reject request");
  }
  return res.json();
}

// Carries field-level validation errors (`{ field: string[] }`) from the API so
// forms can highlight the exact missing/invalid fields instead of a generic message.
export class ApiError extends Error {
  fields?: Record<string, string[]>;
  constructor(message: string, fields?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.fields = fields;
  }
}

// ── Manufacturer profile ────────────────────────────────────────────────

export async function fetchManufacturerProfile(): Promise<ManufacturerProfileDto> {
  const res = await fetch(`${BASE}/api/manufacturer-profile`, { headers: await authHeader() });
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
  const res = await fetch(`${BASE}/api/manufacturer-profile`, {
    method: "PUT",
    headers: { ...(await authHeader()), "Content-Type": "application/json" },
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
  const res = await fetch(`${BASE}/api/manufacturer-profile/catalogue`, {
    method: "POST",
    headers: await authHeader(),
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to upload catalogue");
  }
  return res.json();
}

/** Add a catalogue / price-list link (kind "link"). */
export async function addManufacturerCatalogueLink(url: string, name?: string): Promise<ManufacturerFileInfo> {
  const res = await fetch(`${BASE}/api/manufacturer-profile/catalogue/link`, {
    method: "POST",
    headers: { ...(await authHeader()), "Content-Type": "application/json" },
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
  const res = await fetch(`${BASE}/api/manufacturer-profile/catalogue/${fileId}/download`, {
    headers: await authHeader(),
  });
  if (!res.ok) throw new Error("Failed to get catalogue link");
  return res.json();
}

/** Remove a specific catalogue file. */
export async function deleteManufacturerCatalogueFile(fileId: string): Promise<void> {
  const res = await fetch(`${BASE}/api/manufacturer-profile/catalogue/${fileId}`, {
    method: "DELETE",
    headers: await authHeader(),
  });
  if (!res.ok) throw new Error("Failed to remove catalogue");
}

// ── Opportunity-card attachments (catalogue refs + price list / terms) ──

/** A saved attachment descriptor for an opportunity card's `sources` / `assets`. */
export interface OpportunityAsset {
  id?: string;
  name: string;
  kind?: "pdf" | "link";
  url?: string;
  contentType?: string;
  sizeBytes?: number;
}

/** Upload an opportunity-specific price list / terms PDF. Returns the descriptor
 *  to store in the card's `assets`. */
export async function uploadOpportunityCardAsset(cardId: string, file: File): Promise<OpportunityAsset> {
  const form = new FormData();
  form.append("asset", file);
  const res = await fetch(`${BASE}/api/opportunity-cards/${cardId}/assets`, {
    method: "POST",
    headers: await authHeader(),
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to upload price list");
  }
  return res.json();
}

/** Add an opportunity-specific price list / terms link. Returns the descriptor
 *  to store in the card's `assets`. */
export async function addOpportunityCardAssetLink(
  cardId: string,
  url: string,
  name?: string,
): Promise<OpportunityAsset> {
  const res = await fetch(`${BASE}/api/opportunity-cards/${cardId}/assets/link`, {
    method: "POST",
    headers: { ...(await authHeader()), "Content-Type": "application/json" },
    body: JSON.stringify({ url, name }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to add price list link");
  }
  return res.json();
}

/** Best-effort delete of an uploaded asset's storage object. */
export async function deleteOpportunityCardAsset(cardId: string, assetId: string): Promise<void> {
  const res = await fetch(`${BASE}/api/opportunity-cards/${cardId}/assets/${assetId}`, {
    method: "DELETE",
    headers: await authHeader(),
  });
  if (!res.ok) throw new Error("Failed to remove attachment");
}

/** Download an opportunity-specific asset (price list / terms PDF). */
export async function fetchOpportunityCardAssetUrl(
  cardId: string,
  assetId: string,
): Promise<{ url: string; originalName: string }> {
  const res = await fetch(`${BASE}/api/opportunity-cards/${cardId}/assets/${assetId}/download`, {
    headers: await authHeader(),
  });
  if (!res.ok) throw new Error("Failed to get attachment");
  return res.json();
}

/** Download a catalogue reference attached to the manufacturer's profile. */
export async function fetchOpportunityCardSourceUrl(
  cardId: string,
  sourceId: string,
): Promise<{ url: string; originalName: string }> {
  const res = await fetch(`${BASE}/api/opportunity-cards/${cardId}/sources/${sourceId}/download`, {
    headers: await authHeader(),
  });
  if (!res.ok) throw new Error("Failed to get catalogue reference");
  return res.json();
}

// ── Buyer profile ───────────────────────────────────────────────────────

export async function fetchBuyerProfile(): Promise<BuyerProfileDto | null> {
  const res = await fetch(`${BASE}/api/buyer-profile`, { headers: await authHeader() });
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
  const res = await fetch(`${BASE}/api/buyer-profile`, {
    method: "PUT",
    headers: { ...(await authHeader()), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (body.fields) throw new ApiError(body.error ?? "Failed to save profile", body.fields);
    throw new Error(body.error ?? "Failed to save profile");
  }
  return res.json();
}

// ── Opportunity cards ────────────────────────────────────────────────────

export async function fetchMyOpportunityCards(status?: "DRAFT" | "POSTED" | "ARCHIVED"): Promise<OpportunityCardDto[]> {
  const qs = status ? `?status=${status}` : "";
  const res = await fetch(`${BASE}/api/opportunity-cards${qs}`, { headers: await authHeader() });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load opportunity cards");
  }
  return res.json();
}

/** Marketplace browse: posted cards on the opposite side from the viewer,
 *  each enriched with the caller's own interaction state + the owner name. */
export async function fetchMarketOpportunityCards(): Promise<MarketCardDto[]> {
  const res = await fetch(`${BASE}/api/opportunity-cards/market`, { headers: await authHeader() });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load marketplace");
  }
  return res.json();
}

export async function createOpportunityCard(data: OpportunityCardInput): Promise<OpportunityCardDto> {
  const res = await fetch(`${BASE}/api/opportunity-cards`, {
    method: "POST",
    headers: { ...(await authHeader()), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to create opportunity card");
  }
  return res.json();
}

export async function updateOpportunityCard(
  id: string,
  data: OpportunityCardInput,
): Promise<OpportunityCardDto> {
  const res = await fetch(`${BASE}/api/opportunity-cards/${id}`, {
    method: "PUT",
    headers: { ...(await authHeader()), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to update opportunity card");
  }
  return res.json();
}

export async function deleteOpportunityCard(id: string): Promise<void> {
  const res = await fetch(`${BASE}/api/opportunity-cards/${id}`, {
    method: "DELETE",
    headers: await authHeader(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to delete opportunity card");
  }
}

export async function publishOpportunityCard(id: string): Promise<OpportunityCardDto> {
  const res = await fetch(`${BASE}/api/opportunity-cards/${id}/publish`, {
    method: "POST",
    headers: await authHeader(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to publish opportunity card");
  }
  return res.json();
}

export async function unpublishOpportunityCard(id: string): Promise<OpportunityCardDto> {
  const res = await fetch(`${BASE}/api/opportunity-cards/${id}/unpublish`, {
    method: "POST",
    headers: await authHeader(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to unpublish opportunity card");
  }
  return res.json();
}

// ── Match suggestions (dashboard read; agent writes) ─────────────────────

export async function fetchMatchSuggestions(): Promise<MatchSuggestionDto[]> {
  const res = await fetch(`${BASE}/api/match-suggestions`, { headers: await authHeader() });
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
  const res = await fetch(`${BASE}/api/match-suggestions/${id}`, {
    method: "PATCH",
    headers: { ...(await authHeader()), "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to update match suggestion");
  }
  return res.json();
}

// ── Sourcing inquiries (buyer buying briefs) ─────────────────────────────

export async function fetchSourcingInquiries(): Promise<SourcingInquiryDto[]> {
  const res = await fetch(`${BASE}/api/sourcing-inquiries`, { headers: await authHeader() });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load sourcing inquiries");
  }
  return res.json();
}

export async function createSourcingInquiry(data: SourcingInquiryInput): Promise<SourcingInquiryDto> {
  const res = await fetch(`${BASE}/api/sourcing-inquiries`, {
    method: "POST",
    headers: { ...(await authHeader()), "Content-Type": "application/json" },
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
  const res = await fetch(`${BASE}/api/sourcing-inquiries/${id}`, {
    method: "PUT",
    headers: { ...(await authHeader()), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to update sourcing inquiry");
  }
  return res.json();
}

export async function deleteSourcingInquiry(id: string): Promise<void> {
  const res = await fetch(`${BASE}/api/sourcing-inquiries/${id}`, {
    method: "DELETE",
    headers: await authHeader(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to delete sourcing inquiry");
  }
}

export async function uploadInquiryBrief(inquiryId: string, file: File): Promise<unknown> {
  const form = new FormData();
  form.append("brief", file);
  const res = await fetch(`${BASE}/api/sourcing-inquiries/${inquiryId}/briefs`, {
    method: "POST",
    headers: await authHeader(),
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to upload brief");
  }
  return res.json();
}

export async function fetchInquiryBriefUrl(inquiryId: string, fileId: string): Promise<{ url: string; originalName: string }> {
  const res = await fetch(`${BASE}/api/sourcing-inquiries/${inquiryId}/briefs/${fileId}/download`, {
    headers: await authHeader(),
  });
  if (!res.ok) throw new Error("Failed to get brief URL");
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
  const res = await fetch(`${BASE}/api/buyer-profile/portfolio`, { headers: await authHeader() });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error("Failed to load portfolio");
  return res.json();
}

export async function uploadBuyerPortfolio(file: File): Promise<BuyerFileDto> {
  const form = new FormData();
  form.append("portfolio", file);
  const res = await fetch(`${BASE}/api/buyer-profile/portfolio`, {
    method: "POST",
    headers: await authHeader(),
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to upload portfolio");
  }
  return res.json();
}

export async function deleteBuyerPortfolio(fileId: string): Promise<void> {
  const res = await fetch(`${BASE}/api/buyer-profile/portfolio/${fileId}`, {
    method: "DELETE",
    headers: await authHeader(),
  });
  if (!res.ok) throw new Error("Failed to delete portfolio file");
}

export async function fetchBuyerPortfolioUrl(fileId: string): Promise<{ url: string; originalName: string }> {
  const res = await fetch(`${BASE}/api/buyer-profile/portfolio/${fileId}/download`, {
    headers: await authHeader(),
  });
  if (!res.ok) throw new Error("Failed to get portfolio URL");
  return res.json();
}

// ── Card interactions + engagement ───────────────────────────────────────

export interface CardInteractionResult {
  cardId: string;
  accountId: string;
  status: OpportunityInteractionStatus;
  linkedInquiryId?: string | null;
  referralNote?: string | null;
  conversationId?: string | null;
  lastActivityAt?: string | null;
}

export async function setCardInteraction(
  cardId: string,
  status: OpportunityInteractionStatus,
  extra?: { linkedInquiryId?: string; referralNote?: string },
): Promise<CardInteractionResult> {
  const res = await fetch(`${BASE}/api/opportunity-cards/${cardId}/interactions`, {
    method: "POST",
    headers: { ...(await authHeader()), "Content-Type": "application/json" },
    body: JSON.stringify({ status, ...extra }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to record interaction");
  }
  return res.json();
}

export async function fetchEngagement(): Promise<EngagementRowDto[]> {
  const res = await fetch(`${BASE}/api/opportunity-cards/engagement`, { headers: await authHeader() });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load engagement");
  }
  return res.json();
}

export async function shareOpportunityCard(cardId: string, recipientIds: string[], message?: string): Promise<{ shared: number }> {
  const res = await fetch(`${BASE}/api/opportunity-cards/${cardId}/share`, {
    method: "POST",
    headers: { ...(await authHeader()), "Content-Type": "application/json" },
    body: JSON.stringify({ recipientIds, message }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to share card");
  }
  return res.json();
}

// ── Activity feed ─────────────────────────────────────────────────────────

export interface ActivityEventDto {
  id: string;
  type: string;
  payload: unknown;
  actorAccountId?: string;
  createdAt: string;
}

export async function fetchActivity(): Promise<ActivityEventDto[]> {
  const res = await fetch(`${BASE}/api/activity`, { headers: await authHeader() });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load activity");
  }
  return res.json();
}

// ── Conversations (buyer ⇄ manufacturer messaging) ───────────────────────────

export async function fetchConversations(): Promise<ConversationDto[]> {
  const res = await fetch(`${BASE}/api/conversations`, { headers: await authHeader() });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load conversations");
  }
  return res.json();
}

export interface ConversationThread {
  conversation: ConversationDto;
  messages: MessageDto[];
}

export async function fetchConversation(id: string): Promise<ConversationThread> {
  const res = await fetch(`${BASE}/api/conversations/${id}`, { headers: await authHeader() });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load conversation");
  }
  return res.json();
}

/** Post a message (with optional inline attachments) to a conversation. */
export async function sendConversationMessage(
  conversationId: string,
  body: string,
  files?: File[],
): Promise<MessageDto> {
  const form = new FormData();
  form.append("body", body);
  for (const f of files ?? []) form.append("attachments", f);
  const res = await fetch(`${BASE}/api/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: await authHeader(),
    body: form,
  });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error(b.error ?? "Failed to send message");
  }
  return res.json();
}

/** Get a short-lived signed download URL for a message attachment. */
export async function fetchConversationAttachmentUrl(
  fileId: string,
): Promise<{ url: string; originalName: string }> {
  const res = await fetch(`${BASE}/api/conversations/attachments/${fileId}/download`, {
    headers: await authHeader(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to get attachment");
  }
  return res.json();
}
