import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Test strategy — and why it is safe.
 *
 * `api.ts` attaches the admin bearer token through its internal `authHeader()`
 * helper, which reads Firebase's `auth.currentUser` + `auth.authStateReady()`.
 * We do NOT mock `authHeader()` itself (doing so would sever the auth contract
 * and could hide a regression where credentials stop being sent). Instead we
 * mock the module *beneath* it — `./firebase`'s `auth` object — with a
 * controllable `currentUser`. The real `authHeader()` then runs unmodified, so
 * the tests assert the genuine behaviour:
 *   - signed in  -> admin requests carry `Authorization: Bearer <token>`
 *   - signed out -> admin requests carry NO auth header (the live backend would
 *                   reject them; we never inject a fake token to make them pass)
 *   - public endpoints never send an auth header
 *
 * The base URL (`BASE`) is empty in tests (no VITE_API_BASE_URL), so calls hit
 * relative `/api/...` paths.
 */

const mockAuth = vi.hoisted(() => ({
  auth: {
    authStateReady: vi.fn().mockResolvedValue(undefined),
    currentUser: null as null | { getIdToken: () => Promise<string> },
  },
}));

vi.mock("./firebase", () => ({ auth: mockAuth.auth }));

// Imported AFTER the mock is registered.
import * as api from "./api";

// ── Auth state helpers ──────────────────────────────────────────────────────

function setSignedIn(token = "test-admin-token") {
  mockAuth.auth.currentUser = { getIdToken: vi.fn().mockResolvedValue(token) };
}

function setSignedOut() {
  mockAuth.auth.currentUser = null;
}

// ── fetch stubbing ──────────────────────────────────────────────────────────

interface StubOptions {
  ok?: boolean;
  status?: number;
  errorBody?: unknown;
}

function stubFetch(body: unknown, opts: StubOptions = {}) {
  const ok = opts.ok ?? true;
  const status = opts.status ?? (ok ? 200 : 400);
  const payload = opts.errorBody ?? body;
  const res = {
    ok,
    status,
    json: vi.fn().mockResolvedValue(payload),
  };
  (globalThis as unknown as { fetch: ReturnType<typeof vi.fn> }).fetch =
    vi.fn().mockResolvedValue(res);
  return res;
}

function lastCall() {
  const fetchMock = (globalThis as unknown as { fetch: ReturnType<typeof vi.fn> }).fetch;
  const calls = fetchMock.mock.calls;
  const [url, options] = calls[calls.length - 1] as [string, RequestInit?];
  return { url, options: options ?? {} };
}

function authHeaderOf(options: RequestInit): string | undefined {
  const headers = options.headers as Record<string, string> | undefined;
  return headers?.Authorization;
}

beforeEach(() => {
  setSignedOut();
  vi.clearAllMocks();
  mockAuth.auth.authStateReady.mockResolvedValue(undefined);
  // $Fetch is reassigned per test via stubFetch().
});

// ── Fetching (GET) functions ─────────────────────────────────────────────────

describe("fetching (GET)", () => {
  it("fetchInvites returns items and sends the admin bearer token", async () => {
    setSignedIn();
    stubFetch({
      items: [{ id: "i1", token: "t", email: null, status: "ACTIVE", purpose: "ONBOARDING", createdAt: "", usedAt: null, link: "https://x/i1" }],
    });

    const res = await api.fetchInvites();

    expect(res.items).toHaveLength(1);
    const { url, options } = lastCall();
    expect(url).toContain("/api/invites");
    expect(options.method ?? "GET").toBe("GET");
    expect(authHeaderOf(options)).toBe("Bearer test-admin-token");
  });

  it("fetchSubmissions returns the list response", async () => {
    setSignedIn();
    stubFetch({ total: 1, items: [{ id: "s1" } as never] });

    const res = await api.fetchSubmissions();

    expect(res.total).toBe(1);
    expect(lastCall().url).toContain("/api/submissions");
  });

  it("fetchSubmission targets the id path", async () => {
    setSignedIn();
    stubFetch({ id: "s42" });

    await api.fetchSubmission("s42");

    expect(lastCall().url).toContain("/api/submissions/s42");
  });

  it("fetchFileUrl and fetchCustomerFileUrl build their distinct paths", async () => {
    setSignedIn();
    stubFetch({ url: "https://r2/x", originalName: "a.pdf" });
    await api.fetchFileUrl("f1");
    expect(lastCall().url).toContain("/api/files/f1/download");

    await api.fetchCustomerFileUrl("f2");
    expect(lastCall().url).toContain("/api/files/customer/f2/download");
  });

  it("fetchDistributors / fetchDistributor return distributor data", async () => {
    setSignedIn();
    stubFetch([{ id: "d1" } as never]);
    expect(await api.fetchDistributors()).toHaveLength(1);

    stubFetch({ id: "d1" } as never);
    await api.fetchDistributor("d1");
    expect(lastCall().url).toContain("/api/distributors/d1");
  });

  it("fetchDataTierTemplate returns the template", async () => {
    setSignedIn();
    stubFetch({ tiers: [] });
    await api.fetchDataTierTemplate();
    expect(lastCall().url).toContain("/api/distributors/data-tier/template");
  });

  it("fetchMatches returns matches for a submission", async () => {
    setSignedIn();
    stubFetch([{ id: "m1" } as never]);
    expect(await api.fetchMatches("s9")).toHaveLength(1);
    expect(lastCall().url).toContain("/api/submissions/s9/matches");
  });

  it("fetchCustomers / fetchCustomer / fetchCustomerBySubmission hit their routes", async () => {
    setSignedIn();
    stubFetch([{ id: "c1" } as never]);
    expect(await api.fetchCustomers()).toHaveLength(1);

    stubFetch({ id: "c1" } as never);
    await api.fetchCustomer("c1");
    expect(lastCall().url).toContain("/api/customers/c1");

    stubFetch({ id: "c1" } as never);
    await api.fetchCustomerBySubmission("s1");
    expect(lastCall().url).toContain("/api/customers/from-submission/s1");
  });

  it("fetchCustomerBySubmission throws NO_CUSTOMER on 404", async () => {
    setSignedIn();
    stubFetch({}, { ok: false, status: 404 });

    await expect(api.fetchCustomerBySubmission("s1")).rejects.toThrow("NO_CUSTOMER");
  });

  it("validateInvite (public GET) parses a valid token and sends no auth", async () => {
    stubFetch({ valid: true, purpose: "ONBOARDING" });

    const res = await api.validateInvite("abc");

    expect(res.valid).toBe(true);
    const { url, options } = lastCall();
    expect(url).toContain("/api/invites/validate?token=abc");
    expect(authHeaderOf(options)).toBeUndefined();
  });

  it("a non-ok GET response throws the documented error", async () => {
    setSignedIn();
    stubFetch({}, { ok: false, status: 500 });

    // Note: the simple admin GET functions throw a fixed message and do NOT
    // surface the server's error body (unlike the POST functions that read
    // `body.error`). That fixed-message behaviour is what we assert here.
    await expect(api.fetchSubmissions()).rejects.toThrow("Failed to load submissions");
  });
});

// ── Posting (POST) functions ─────────────────────────────────────────────────

describe("posting (POST)", () => {
  it("submitAssessment posts FormData without auth (public)", async () => {
    stubFetch({ id: "new" });
    const file = new Blob(["x"]) as unknown as File;

    await api.submitAssessment({ a: 1 }, [file], "invite-token");

    const { url, options } = lastCall();
    expect(url).toContain("/api/submissions");
    expect(options.method).toBe("POST");
    expect(options.body).toBeInstanceOf(FormData);
    expect(authHeaderOf(options)).toBeUndefined();
  });

  it("requestReport posts JSON without auth (public)", async () => {
    stubFetch({ id: "r1", emailSent: true });

    const res = await api.requestReport({ subject: "s", message: "m", email: "a@b.co" });

    const { url, options } = lastCall();
    expect(res.id).toBe("r1");
    expect(url).toContain("/api/report-requests");
    expect(authHeaderOf(options)).toBeUndefined();
    expect(JSON.parse(options.body as string).email).toBe("a@b.co");
  });

  it("submitExportLead composes the report-request payload (public)", async () => {
    stubFetch({ id: "r2", emailSent: false });

    await api.submitExportLead({
      companyName: "Acme",
      country: "FI",
      fullName: "Jane",
      workEmail: "jane@acme.co",
      product: "Olives",
      targetMarket: "UAE",
    });

    const { url, options } = lastCall();
    expect(url).toContain("/api/report-requests");
    const body = JSON.parse(options.body as string);
    expect(body.subject).toContain("Acme");
    expect(body.message).toContain("UAE");
    expect(authHeaderOf(options)).toBeUndefined();
  });

  it("createInvite sends purpose + email and the admin token", async () => {
    setSignedIn();
    stubFetch({ id: "i1", token: "t", status: "ACTIVE", purpose: "ONBOARDING", link: "l" });

    await api.createInvite("ops@x.co", "ONBOARDING");

    const { url, options } = lastCall();
    expect(url).toContain("/api/invites");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body as string).email).toBe("ops@x.co");
    expect(authHeaderOf(options)).toBe("Bearer test-admin-token");
  });

  it("evaluateSubmission posts the submission id (admin)", async () => {
    setSignedIn();
    stubFetch({ score: 80, explanation: "ok", decision: "PROCEED" });

    const res = await api.evaluateSubmission("s1");

    expect(res.score).toBe(80);
    expect(lastCall().url).toContain("/api/score");
  });

  it("createDistributor / importDistributors post JSON with auth", async () => {
    setSignedIn();
    stubFetch({ id: "d1" } as never);
    await api.createDistributor({ name: "Dist", country: "SA", city: "Riyadh", attributes: {}, channels: [] } as never);
    expect(lastCall().url).toContain("/api/distributors");
    expect(authHeaderOf(lastCall().options)).toBe("Bearer test-admin-token");

    stubFetch({ imported: 2 });
    const res = await api.importDistributors([]);
    expect(res.imported).toBe(2);
  });

  it("syncDistributorsFromSheet forwards the access token (admin)", async () => {
    setSignedIn();
    stubFetch({ imported: 1, updated: 0, skipped: 0, errors: [] });

    await api.syncDistributorsFromSheet("google-tok");

    expect(JSON.parse(lastCall().options.body as string).accessToken).toBe("google-tok");
  });

  it("recalcDataTiers / recalcDistributorTier post to their routes (admin)", async () => {
    setSignedIn();
    stubFetch({ updated: 3 });
    await api.recalcDataTiers();
    expect(lastCall().url).toContain("/api/distributors/data-tier/recalc");

    stubFetch({ dataTier: 2 });
    await api.recalcDistributorTier("d1");
    expect(lastCall().url).toContain("/api/distributors/d1/recalc-tier");
  });

  it("findMatches posts to the match route (admin)", async () => {
    setSignedIn();
    stubFetch([{ id: "m1" } as never]);

    await api.findMatches("s1");

    const { url, options } = lastCall();
    expect(url).toContain("/api/submissions/s1/match");
    expect(options.method).toBe("POST");
  });

  it("extractCatalogue returns the mapping; surfaces server error text", async () => {
    setSignedIn();
    stubFetch({
      catalogueData: {},
      catalogueExtractedAt: "",
      fieldMapping: { matched: [], additional: [] },
    });

    const res = await api.extractCatalogue("s1");
    expect(res.fieldMapping).toBeDefined();

    stubFetch({}, { ok: false, status: 422, errorBody: { error: "no files" } });
    await expect(api.extractCatalogue("s1")).rejects.toThrow("no files");
  });

  it("applyCatalogueMapping posts additionalFields (admin)", async () => {
    setSignedIn();
    stubFetch({});

    await api.applyCatalogueMapping("s1", [{ key: "k", value: "v" }]);

    const body = JSON.parse(lastCall().options.body as string);
    expect(body.additionalFields).toEqual([{ key: "k", value: "v" }]);
    expect(lastCall().url).toContain("/api/submissions/s1/apply-catalogue-mapping");
  });

  it("createCustomer / createCustomerProfile / convertSubmissionToCustomer (admin)", async () => {
    setSignedIn();
    stubFetch({ id: "c1" } as never);
    await api.createCustomer({} as never);
    expect(lastCall().url).toContain("/api/customers");
    expect(authHeaderOf(lastCall().options)).toBe("Bearer test-admin-token");

    stubFetch({ id: "c2" } as never);
    await api.createCustomerProfile({} as never);
    expect(lastCall().url).toContain("/api/customers/profile");

    stubFetch({ id: "c3" } as never);
    const res = await api.convertSubmissionToCustomer("s1");
    expect(res.id).toBe("c3");
    expect(lastCall().url).toContain("/api/customers/from-submission/s1");
  });

  it("convertSubmissionToCustomer surfaces the server error", async () => {
    setSignedIn();
    stubFetch({}, { ok: false, status: 409, errorBody: { error: "already a customer" } });

    await expect(api.convertSubmissionToCustomer("s1")).rejects.toThrow("already a customer");
  });

  it("uploadCustomerLogo posts FormData with auth (admin)", async () => {
    setSignedIn();
    stubFetch({ id: "c1" } as never);
    const file = new Blob(["x"]) as unknown as File;

    await api.uploadCustomerLogo("c1", file);

    const { url, options } = lastCall();
    expect(url).toContain("/api/customers/c1/logo");
    expect(options.body).toBeInstanceOf(FormData);
    expect(authHeaderOf(options)).toBe("Bearer test-admin-token");
  });
});

// ── Editing (PUT / PATCH / DELETE) functions ─────────────────────────────────

describe("editing (PUT / PATCH / DELETE)", () => {
  it("updateDistributor puts the payload; includes googleAccessToken when given", async () => {
    setSignedIn();
    stubFetch({ id: "d1" } as never);
    const data = { name: "D", country: "SA", city: "Jeddah", attributes: {}, channels: [] } as never;

    await api.updateDistributor("d1", data);
    expect(lastCall().options.method).toBe("PUT");
    expect(lastCall().url).toContain("/api/distributors/d1");
    expect(JSON.parse(lastCall().options.body as string).googleAccessToken).toBeUndefined();

    await api.updateDistributor("d1", data, "g-tok");
    expect(JSON.parse(lastCall().options.body as string).googleAccessToken).toBe("g-tok");
  });

  it("deleteDistributor sends DELETE with auth", async () => {
    setSignedIn();
    stubFetch({});

    await api.deleteDistributor("d1");

    const { url, options } = lastCall();
    expect(options.method).toBe("DELETE");
    expect(url).toContain("/api/distributors/d1");
    expect(authHeaderOf(options)).toBe("Bearer test-admin-token");
  });

  it("updateCustomer / deleteCustomer (PUT/DELETE)", async () => {
    setSignedIn();
    stubFetch({ id: "c1" } as never);
    await api.updateCustomer("c1", {} as never);
    expect(lastCall().options.method).toBe("PUT");
    expect(lastCall().url).toContain("/api/customers/c1");

    stubFetch({});
    await api.deleteCustomer("c1");
    expect(lastCall().options.method).toBe("DELETE");
  });

  it("deleteInvite / deleteSubmission send DELETE to their routes", async () => {
    setSignedIn();
    stubFetch({});
    await api.deleteInvite("i1");
    expect(lastCall().url).toContain("/api/invites/i1");
    expect(lastCall().options.method).toBe("DELETE");

    await api.deleteSubmission("s1");
    expect(lastCall().url).toContain("/api/submissions/s1");
    expect(lastCall().options.method).toBe("DELETE");
  });

  it("setCustomerCategory PATCHes the category (admin)", async () => {
    setSignedIn();
    stubFetch({ id: "c1" } as never);

    await api.setCustomerCategory("c1", "POTENTIAL");

    const { url, options } = lastCall();
    expect(options.method).toBe("PATCH");
    expect(url).toContain("/api/customers/c1/category");
    expect(JSON.parse(options.body as string).category).toBe("POTENTIAL");
    expect(authHeaderOf(options)).toBe("Bearer test-admin-token");
  });

  it("a non-ok edit response throws the documented error", async () => {
    setSignedIn();
    stubFetch({}, { ok: false, status: 403 });

    // Like the GET functions, the DELETE/PUT helpers throw a fixed message
    // and don't read the server error body.
    await expect(api.deleteDistributor("d1")).rejects.toThrow("Failed to delete distributor");
  });
});

// ── Auth / security contract ─────────────────────────────────────────────────
// These guard against a test (or future refactor) silently dropping credentials.

describe("auth / security contract", () => {
  it("admin requests across verbs carry the bearer token when signed in", async () => {
    setSignedIn();

    stubFetch({ total: 0, items: [] });
    await api.fetchSubmissions();
    expect(authHeaderOf(lastCall().options)).toBe("Bearer test-admin-token");

    stubFetch({ id: "d1" } as never);
    await api.createDistributor({ name: "D", country: "SA", city: "R", attributes: {}, channels: [] } as never);
    expect(authHeaderOf(lastCall().options)).toBe("Bearer test-admin-token");

    stubFetch({ id: "d1" } as never);
    await api.updateDistributor("d1", { name: "D", country: "SA", city: "R", attributes: {}, channels: [] } as never);
    expect(authHeaderOf(lastCall().options)).toBe("Bearer test-admin-token");

    stubFetch({});
    await api.deleteDistributor("d1");
    expect(authHeaderOf(lastCall().options)).toBe("Bearer test-admin-token");

    stubFetch({ id: "c1" } as never);
    await api.setCustomerCategory("c1", "OTHER");
    expect(authHeaderOf(lastCall().options)).toBe("Bearer test-admin-token");
  });

  it("admin requests send NO auth header when signed out (no bypass)", async () => {
    setSignedOut();

    stubFetch({ total: 0, items: [] });
    await api.fetchSubmissions();
    expect(authHeaderOf(lastCall().options)).toBeUndefined();

    stubFetch({ id: "d1" } as never);
    await api.createDistributor({ name: "D", country: "SA", city: "R", attributes: {}, channels: [] } as never);
    expect(authHeaderOf(lastCall().options)).toBeUndefined();
  });

  it("public endpoints never send an auth header, signed in or out", async () => {
    setSignedIn();
    stubFetch({ id: "r", emailSent: false });
    await api.requestReport({ subject: "s", message: "m", email: "a@b.co" });
    expect(authHeaderOf(lastCall().options)).toBeUndefined();

    stubFetch({ valid: true });
    await api.validateInvite("tok");
    expect(authHeaderOf(lastCall().options)).toBeUndefined();
  });

  it("authHeader waits for authStateReady before reading the user", async () => {
    setSignedIn();
    stubFetch({ total: 0, items: [] });

    await api.fetchSubmissions();

    expect(mockAuth.auth.authStateReady).toHaveBeenCalled();
  });
});
