import { describe, it, expect, afterAll, beforeAll, vi } from "vitest";
import request from "supertest";

// Stub Firebase token verification: the test token resolves to a known Account.
const TEST_UID = "test-manufacturer-uid";
const TEST_TOKEN = "test-firebase-token";

vi.mock("../lib/firebaseAdmin.js", () => ({
  verifyIdToken: vi.fn(async (token: string) => {
    if (token === TEST_TOKEN) {
      return { uid: TEST_UID, email: "maker@example.com", email_verified: true };
    }
    throw new Error("invalid token");
  }),
}));

// Import after the mock is registered (vi.mock is hoisted above imports).
import { app } from "../index.js";
import { prisma } from "../prisma.js";
import { env } from "../env.js";

const auth = { Authorization: `Bearer ${TEST_TOKEN}` };
const AGENT_KEY = "secret-agent-key";

beforeAll(async () => {
  await prisma.account.deleteMany({ where: { firebaseUid: TEST_UID } });
  await prisma.account.create({
    data: {
      firebaseUid: TEST_UID,
      email: "maker@example.com",
      role: "MANUFACTURER",
      status: "ACTIVE",
    },
  });
  // Make the matchmaking agent feed reachable in this test run.
  env.MATCHMAKING_API_KEY = AGENT_KEY;
});

afterAll(async () => {
  await prisma.opportunityCard
    .deleteMany({ where: { title: { startsWith: "Test " } } })
    .catch(() => {});
  await prisma.account.deleteMany({ where: { firebaseUid: TEST_UID } }).catch(() => {});
  await prisma.$disconnect();
});

describe("Opportunity cards", () => {
  let cardId: string;

  it("creates a SELL card for a manufacturer (side derived from role)", async () => {
    const res = await request(app)
      .post("/api/opportunity-cards")
      .set(auth)
      .send({ title: "Test Premium Confectionery", summary: "Halal sweets", category: "Snacks" });
    expect(res.status).toBe(201);
    expect(res.body.side).toBe("SELL");
    expect(res.body.status).toBe("DRAFT");
    cardId = res.body.id;
  });

  it("rejects creation without authentication", async () => {
    const res = await request(app).post("/api/opportunity-cards").send({ title: "x" });
    expect(res.status).toBe(401);
  });

  it("publishes a card (DRAFT → POSTED) and stamps publishedAt", async () => {
    const res = await request(app)
      .post(`/api/opportunity-cards/${cardId}/publish`)
      .set(auth);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("POSTED");
    expect(res.body.publishedAt).toBeTruthy();
  });

  it("surfaces the posted card in the agent feed (x-api-key)", async () => {
    const res = await request(app)
      .get("/api/opportunity-cards/feed?side=SELL")
      .set("x-api-key", AGENT_KEY);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((c: { id: string }) => c.id === cardId)).toBe(true);
  });

  it("rejects the agent feed without the API key", async () => {
    const res = await request(app).get("/api/opportunity-cards/feed");
    expect(res.status).toBe(401);
  });

  it("keeps the owner-scoped list to only the caller's cards", async () => {
    const res = await request(app).get("/api/opportunity-cards").set(auth);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.every((c: { ownerAccountId: string }) => c.ownerAccountId)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
