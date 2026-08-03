import { auth } from "./firebase";
import type { SubmissionDto, DistributorDto, ManufacturerMatchDto, DistributorInput } from "@mea/shared";

const BASE = import.meta.env.VITE_API_BASE_URL ?? "";

async function authHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

/** Public: submit the assessment form with attached files. */
export async function submitAssessment(payload: unknown, files: File[]): Promise<{ id: string }> {
  const form = new FormData();
  form.append("payload", JSON.stringify(payload));
  for (const file of files) form.append("files", file);

  const res = await fetch(`${BASE}/api/submissions`, { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Submission failed");
  }
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

export async function updateDistributor(id: string, data: DistributorInput): Promise<DistributorDto> {
  const res = await fetch(`${BASE}/api/distributors/${id}`, {
    method: "PUT",
    headers: { ...(await authHeader()), "Content-Type": "application/json" },
    body: JSON.stringify(data),
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