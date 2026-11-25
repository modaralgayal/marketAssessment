import { authedFetch, BASE } from "./_core";
import type { CatalogueExtractedData, ManufacturerMatchDto, SubmissionDto } from "@mea/shared";



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



export interface SubmissionListResponse {
  total: number;
  items: SubmissionDto[];
}



/** Admin: list submissions. */
export async function fetchSubmissions(): Promise<SubmissionListResponse> {
  const res = await authedFetch(`${BASE}/api/submissions`);
  if (!res.ok) throw new Error("Failed to load submissions");
  return res.json();
}



/** Admin: single submission. */
export async function fetchSubmission(id: string): Promise<SubmissionDto> {
  const res = await authedFetch(`${BASE}/api/submissions/${id}`);
  if (!res.ok) throw new Error("Failed to load submission");
  return res.json();
}



/** Admin: delete a submission. */
export async function deleteSubmission(id: string): Promise<void> {
  const res = await authedFetch(`${BASE}/api/submissions/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete submission");
}



/** Admin: get a signed download URL for a file. */
export async function fetchFileUrl(fileId: string): Promise<{ url: string; originalName: string }> {
  const res = await authedFetch(`${BASE}/api/files/${fileId}/download`);
  if (!res.ok) throw new Error("Failed to get download link");
  return res.json();
}



/** Admin: get a signed download URL for a customer's file. */
export async function fetchCustomerFileUrl(fileId: string): Promise<{ url: string; originalName: string }> {
  const res = await authedFetch(`${BASE}/api/files/customer/${fileId}/download`);
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
  const res = await authedFetch(`${BASE}/api/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ submissionId }),
  });

  if (!res.ok) {
    throw new Error("Failed to evaluate submission");
  }

  return res.json();
}



// ── Matching ───────────────────────────────────────────────────────────

export async function findMatches(submissionId: string): Promise<ManufacturerMatchDto[]> {
  const res = await authedFetch(`${BASE}/api/submissions/${submissionId}/match`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to find matches");
  return res.json();
}



export async function fetchMatches(submissionId: string): Promise<ManufacturerMatchDto[]> {
  const res = await authedFetch(`${BASE}/api/submissions/${submissionId}/matches`);
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
  const res = await authedFetch(`${BASE}/api/submissions/${submissionId}/extract-catalogue`, { method: "POST" });
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
  const res = await authedFetch(`${BASE}/api/submissions/${submissionId}/apply-catalogue-mapping`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ additionalFields }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to apply catalogue mapping");
  }
}
