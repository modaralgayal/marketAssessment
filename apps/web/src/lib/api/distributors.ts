import { authedFetch, BASE } from "./_core";
import type { DataTierTemplate, DistributorDto, DistributorInput } from "@mea/shared";



// ── Distributor CRUD ───────────────────────────────────────────────────

export async function fetchDistributors(): Promise<DistributorDto[]> {
  const res = await authedFetch(`${BASE}/api/distributors`);
  if (!res.ok) throw new Error("Failed to load distributors");
  return res.json();
}



export async function fetchDistributor(id: string): Promise<DistributorDto> {
  const res = await authedFetch(`${BASE}/api/distributors/${id}`);
  if (!res.ok) throw new Error("Failed to load distributor");
  return res.json();
}



export async function createDistributor(data: DistributorInput): Promise<DistributorDto> {
  const res = await authedFetch(`${BASE}/api/distributors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create distributor");
  return res.json();
}



export async function updateDistributor(id: string, data: DistributorInput, googleAccessToken?: string): Promise<DistributorDto> {
  const payload = googleAccessToken ? { ...data, googleAccessToken } : data;
  const res = await authedFetch(`${BASE}/api/distributors/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update distributor");
  return res.json();
}



export async function deleteDistributor(id: string): Promise<void> {
  const res = await authedFetch(`${BASE}/api/distributors/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete distributor");
}



export async function importDistributors(data: DistributorInput[]): Promise<{ imported: number }> {
  const res = await authedFetch(`${BASE}/api/distributors/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  const res = await authedFetch(`${BASE}/api/distributors/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to sync from Google Sheets");
  }
  return res.json();
}



export async function syncSingleDistributorFromSheet(id: string, accessToken: string): Promise<DistributorDto> {
  const res = await authedFetch(`${BASE}/api/distributors/${id}/sync-from-sheet`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  const res = await authedFetch(`${BASE}/api/distributors/data-tier/template`);
  if (!res.ok) throw new Error("Failed to load data tier template");
  return res.json();
}



export async function recalcDataTiers(): Promise<{ updated: number }> {
  const res = await authedFetch(`${BASE}/api/distributors/data-tier/recalc`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to recalculate data tiers");
  return res.json();
}



export async function recalcDistributorTier(id: string): Promise<{ dataTier: number }> {
  const res = await authedFetch(`${BASE}/api/distributors/${id}/recalc-tier`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to recalculate tier");
  return res.json();
}
