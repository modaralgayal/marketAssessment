import { authedFetch, BASE } from "./_core";
import type { CustomerDto, CustomerInput, CustomerProfileInput } from "@mea/shared";



// ── Customer CRUD ───────────────────────────────────────────────────────

export async function fetchCustomers(): Promise<CustomerDto[]> {
  const res = await authedFetch(`${BASE}/api/customers`);
  if (!res.ok) throw new Error("Failed to load customers");
  return res.json();
}



export async function fetchCustomer(id: string): Promise<CustomerDto> {
  const res = await authedFetch(`${BASE}/api/customers/${id}`);
  if (!res.ok) throw new Error("Failed to load customer");
  return res.json();
}



/** Admin: fetch the customer created from a submission (404 if none yet). */
export async function fetchCustomerBySubmission(submissionId: string): Promise<CustomerDto> {
  const res = await authedFetch(`${BASE}/api/customers/from-submission/${submissionId}`);
  if (res.status === 404) throw new Error("NO_CUSTOMER");
  if (!res.ok) throw new Error("Failed to load customer");
  return res.json();
}



export async function createCustomer(data: CustomerInput): Promise<CustomerDto> {
  const res = await authedFetch(`${BASE}/api/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create customer");
  return res.json();
}



export async function updateCustomer(id: string, data: CustomerInput): Promise<CustomerDto> {
  const res = await authedFetch(`${BASE}/api/customers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update customer");
  return res.json();
}



export async function deleteCustomer(id: string): Promise<void> {
  const res = await authedFetch(`${BASE}/api/customers/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete customer");
}



/** Admin: convert a submission into a customer. */
export async function convertSubmissionToCustomer(submissionId: string): Promise<CustomerDto> {
  const res = await authedFetch(`${BASE}/api/customers/from-submission/${submissionId}`, { method: "POST" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to convert submission to customer");
  }
  return res.json();
}



/** Admin: create a customer profile directly from the dashboard. */
export async function createCustomerProfile(data: CustomerProfileInput): Promise<CustomerDto> {
  const res = await authedFetch(`${BASE}/api/customers/profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  const res = await authedFetch(`${BASE}/api/customers/${id}/logo`, { method: "POST", body: form });
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
  const res = await authedFetch(`${BASE}/api/customers/${id}/category`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to update category");
  }
  return res.json();
}
