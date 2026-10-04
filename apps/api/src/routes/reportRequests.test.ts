import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import { app } from "../index.js";
import { prisma } from "../prisma.js";

const base = "/api/report-requests";

const valid = {
  subject: "Quarterly GCC distributor report",
  message: "Please send the latest overview for our board.",
  email: "procurement@example.com",
  consent: true,
};

afterAll(async () => {
  await prisma.reportRequest.deleteMany({}).catch(() => {});
  await prisma.$disconnect();
});

describe("POST /api/report-requests (regression)", () => {
  it("201 for a valid request with consent", async () => {
    const res = await request(app).post(base).send(valid);
    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();

    const row = await prisma.reportRequest.findUnique({ where: { id: res.body.id } });
    expect(row?.consent).toBe(true);
  });

  it("400 when consent is missing/false", async () => {
    const res = await request(app)
      .post(base)
      .send({ ...valid, consent: false });
    expect(res.status).toBe(400);
  });

  it("400 when the honeypot is filled", async () => {
    const res = await request(app)
      .post(base)
      .send({ ...valid, hp: "bot" });
    expect(res.status).toBe(400);
  });

  it("400 for an invalid email", async () => {
    const res = await request(app)
      .post(base)
      .send({ ...valid, email: "nope" });
    expect(res.status).toBe(400);
  });
});
