import { auth } from "./firebase";
import type { SubmissionDto } from "@mea/shared";

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
  submission: unknown,
): Promise<ScoreResult> {
  console.log(`Fetching score from ${BASE}/api/score`)
  const res = await fetch(`${BASE}/api/score`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(submission),
  });
  console.log(res)

  if (!res.ok) {
    throw new Error("Failed to evaluate submission");
  }

  return res.json();
}