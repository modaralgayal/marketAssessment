import { auth } from "./firebase";
import type { SubmissionDto, DistributorDto, ManufacturerMatchDto, DistributorInput, DataTierTemplate, CatalogueExtractedData, CustomerDto, CustomerInput } from "@mea/shared";

const BASE = import.meta.env.VITE_API_BASE_URL ?? "";

async function authHeader(): Promise<Record<string, string>> {
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
export async function validateInvite(token: string): Promise<{ valid: boolean; reason?: string }> {
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
    body: JSON.stringify(payload),
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
export async function createInvite(email?: string): Promise<{
  id: string;
  token: string;
  status: string;
  link: string;
}> {
  const res = await fetch(`${BASE}/api/invites`, {
    method: "POST",
    headers: { ...(await authHeader()), "Content-Type": "application/json" },
    body: JSON.stringify(email ? { email } : {}),
  });
  if (!res.ok) throw new Error("Failed to create invite");
  return res.json();
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

/** Admin: get a signed download URL for a file. */
export async function fetchFileUrl(fileId: string): Promise<{ url: string; originalName: string }> {
  const res = await fetch(`${BASE}/api/files/${fileId}/download`, { headers: await authHeader() });
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