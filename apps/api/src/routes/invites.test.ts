import { describe, it, expect, afterAll, vi } from "vitest";
import request from "supertest";

// Admin auth is email-allowlist based (requireAdmin). Stub Firebase so a known
// token resolves to an allowlisted, verified admin email.
const ADMIN_EMAIL = "modarag36@gmail.com";
const ADMIN_TOKEN = "admin-invite-token";

vi.mock("../lib/firebaseAdmin.js", () => ({
  verifyIdToken: vi.fn(async (token: string) => {
    if (token === ADMIN_TOKEN) {
      return { uid: "admin-invite-uid", email: ADMIN_EMAIL, email_verified: true };
    }
    throw new Error("invalid token");
  }),
  adminAuth: vi.fn(),
}));

import { app } from "../index.js";
import { prisma } from "../prisma.js";

const auth = { Authorization: `Bearer ${ADMIN_TOKEN}` };
const createdIds: string[] = [];

afterAll(async () => {
  for (const id of createdIds) {
    await prisma.invite.delete({ where: { id } }).catch(() => {});
  }
  await prisma.$disconnect();
});

describe("Admin invites", () => {
  it("rejects an unauthenticated create", async () => {
    const res = await request(app)
      .post("/api/invites")
      .send({ purpose: "ACCOUNT", role: "BUYER" });
    expect(res.status).toBe(401);
  });

  it("creates an ACCOUNT invite for a BUYER workspace", async () => {
    const res = await request(app)
      .post("/api/invites")
      .set(auth)
      .send({ purpose: "ACCOUNT", role: "BUYER" });
    expect(res.status).toBe(201);
    expect(res.body.purpose).toBe("ACCOUNT");
    expect(res.body.role).toBe("BUYER");
    expect(res.body.status).toBe("PENDING");
    expect(res.body.link).toContain("accountInvite=");
    expect(typeof res.body.token).toBe("string");
    createdIds.push(res.body.id);
  });

  it("creates an ACCOUNT invite for a MANUFACTURER workspace", async () => {
    const res = await request(app)
      .post("/api/invites")
      .set(auth)
      .send({ purpose: "ACCOUNT", role: "MANUFACTURER" });
    expect(res.status).toBe(201);
    expect(res.body.role).toBe("MANUFACTURER");
    createdIds.push(res.body.id);
  });

  it("rejects an ACCOUNT invite without a role", async () => {
    const res = await request(app).post("/api/invites").set(auth).send({ purpose: "ACCOUNT" });
    expect(res.status).toBe(400);
  });

  it("lists invites and includes the created ones", async () => {
    const res = await request(app).get("/api/invites").set(auth);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    for (const id of createdIds) {
      expect(res.body.items.some((i: { id: string }) => i.id === id)).toBe(true);
    }
  });

  it("deletes an invite", async () => {
    const id = createdIds.shift()!;
    const res = await request(app).delete(`/api/invites/${id}`).set(auth);
    expect(res.status).toBe(204);
  });
});
