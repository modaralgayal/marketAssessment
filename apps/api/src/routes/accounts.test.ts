import { describe, it, expect, afterAll, beforeAll, vi } from "vitest";
import request from "supertest";

// Stub the full Firebase admin module so account actions (incl. self-deletion,
// which would otherwise call the real Firebase API) don't leave the test.
const TEST_UID = "test-account-uid";
const TEST_EMAIL = "account-test@example.com";
const TEST_TOKEN = "test-account-token";

// Regression fixtures for the "stale firebaseUid" scenario (see docs/deployment.md):
// an ACTIVE account row whose stored firebaseUid no longer matches the UID Google
// mints now. This is the exact condition that made a real, working Google sign-in
// start returning "no account".
const STALE_UID = "stale-regression-uid";
const LIVE_UID = "live-regression-uid";
const STALE_TOKEN = "stale-regression-token";
const LIVE_TOKEN = "live-regression-token";
const REGRESSION_EMAIL = "stale-regression@example.com";

vi.mock("../lib/firebaseAdmin.js", () => ({
  verifyIdToken: vi.fn(async (token: string) => {
    if (token === TEST_TOKEN) {
      return { uid: TEST_UID, email: TEST_EMAIL, email_verified: true };
    }
    if (token === STALE_TOKEN) {
      return { uid: STALE_UID, email: REGRESSION_EMAIL, email_verified: true };
    }
    if (token === LIVE_TOKEN) {
      return { uid: LIVE_UID, email: REGRESSION_EMAIL, email_verified: true };
    }
    throw new Error("invalid token");
  }),
  adminAuth: vi.fn(),
  getFirebaseUser: vi.fn(async () => ({ providerData: [{ providerId: "password" }] })),
  generatePasswordResetLink: vi.fn(async () => "https://example.com/reset"),
  generateEmailVerificationLink: vi.fn(async () => "https://example.com/verify"),
  deleteFirebaseUser: vi.fn(async () => {}),
}));

import { app } from "../index.js";
import { prisma } from "../prisma.js";

const auth = { Authorization: `Bearer ${TEST_TOKEN}` };

beforeAll(async () => {
  await prisma.account.deleteMany({ where: { firebaseUid: TEST_UID } });
  await prisma.account.create({
    data: {
      firebaseUid: TEST_UID,
      email: TEST_EMAIL,
      role: "MANUFACTURER",
      status: "ACTIVE",
    },
  });
});

afterAll(async () => {
  await prisma.account.deleteMany({ where: { firebaseUid: TEST_UID } }).catch(() => {});
  await prisma.$disconnect();
});

describe("Self-service accounts", () => {
  it("returns the signed-in account at GET /me", async () => {
    const res = await request(app).get("/api/accounts/me").set(auth);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(TEST_EMAIL);
    expect(res.body.role).toBe("MANUFACTURER");
    expect(res.body).toHaveProperty("privacyAcceptedVersion");
  });

  it("accepts the latest privacy policy at POST /me/privacy", async () => {
    const res = await request(app).post("/api/accounts/me/privacy").set(auth).send({ accept: true });
    expect(res.status).toBe(200);
    expect(typeof res.body.privacyAcceptedVersion).toBe("number");
    expect(res.body.privacyAcceptedAt).toBeTruthy();
  });

  it("exports the user's own data at GET /me/export", async () => {
    const res = await request(app).get("/api/accounts/me/export").set(auth);
    expect(res.status).toBe(200);
    expect(res.body.account.email).toBe(TEST_EMAIL);
    expect(res.headers["content-disposition"]).toContain("attachment");
  });

  it("rejects GET /me without authentication", async () => {
    const res = await request(app).get("/api/accounts/me");
    expect(res.status).toBe(401);
  });

  it("deletes the account at DELETE /me (GDPR erasure)", async () => {
    const res = await request(app).delete("/api/accounts/me").set(auth);
    expect(res.status).toBe(200);
    // The account is gone: a follow-up request can no longer resolve it.
    const after = await request(app).get("/api/accounts/me").set(auth);
    expect(after.status).toBe(403);
  });
});

describe("Privacy-policy version", () => {
  it("exposes the latest version (public) at GET /version", async () => {
    const res = await request(app).get("/api/privacy-policy/version");
    expect(res.status).toBe(200);
    expect(typeof res.body.version).toBe("number");
  });
});

describe("Stale firebaseUid (regression: 'no account' on Google sign-in)", () => {
  beforeAll(async () => {
    await prisma.account.deleteMany({ where: { firebaseUid: { in: [STALE_UID, LIVE_UID] } } });
    // The row is bound to a DIFFERENT firebaseUid than the one Google mints now —
    // the exact condition that made a real, ACTIVE account unreachable after sign-in.
    await prisma.account.create({
      data: { firebaseUid: STALE_UID, email: REGRESSION_EMAIL, role: "BUYER", status: "ACTIVE" },
    });
  });

  afterAll(async () => {
    await prisma.account.deleteMany({ where: { firebaseUid: { in: [STALE_UID, LIVE_UID] } } }).catch(() => {});
  });

  it("returns 403 'Account not found' when the token uid ≠ stored firebaseUid", async () => {
    const res = await request(app)
      .get("/api/accounts/me")
      .set({ Authorization: `Bearer ${LIVE_TOKEN}` });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/account not found/i);
  });

  it("resolves the account once firebaseUid is rebound to the live token uid", async () => {
    await prisma.account.update({ where: { firebaseUid: STALE_UID }, data: { firebaseUid: LIVE_UID } });
    const res = await request(app)
      .get("/api/accounts/me")
      .set({ Authorization: `Bearer ${LIVE_TOKEN}` });
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(REGRESSION_EMAIL);
    // The Firebase UID is never leaked to the client.
    expect(res.body.firebaseUid).toBeUndefined();
  });
});
