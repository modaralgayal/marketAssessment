import { BASE } from "./_core";



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
