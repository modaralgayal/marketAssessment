import { describe, it, expect, afterAll, vi } from "vitest";
import request from "supertest";

// R2 isn't available in tests; stub the storage module the route imports so
// file uploads succeed without a real bucket.
vi.mock("../storage/index.js", () => ({
  storage: {
    put: vi.fn(async () => {}),
    get: vi.fn(async () => Buffer.from("")),
    getSignedUrl: vi.fn(async () => "https://example.com/x"),
    delete: vi.fn(async () => {}),
  },
}));

// Import after the mock is registered (vi.mock is hoisted above imports).
import { app } from "../index.js";
import { prisma } from "../prisma.js";

const base = "/api/leads";

const exportingValid = {
  kind: "EXPORTING",
  companyName: "Nordic Berries Oy",
  country: "Finland",
  fullName: "Test User",
  email: "test@example.com",
  website: "https://nordic.example.com",
  product: "Frozen lingonberries",
  targetMarket: ["Saudi Arabia"],
  consent: true,
};

const sourcingLink = {
  kind: "SOURCING",
  companyName: "Import Co Oy",
  country: "Finland",
  products: "Specialty coffee, olive oil",
  sourceCountries: ["Italy", "Spain"],
  fullName: "Buyer Person",
  email: "buyer@example.com",
  phone: "+358 40 123 4567",
  productDocumentLink: "https://example.com/products.pdf",
  consent: true,
};

const orgValid = {
  kind: "ORGANIZATION",
  fullName: "Org Contact",
  email: "org@example.com",
  jobTitle: "Trade Commissioner",
  organizationName: "West Coast Chamber of Commerce",
  organizationType: "Chamber of Commerce",
  country: "Portugal",
  support: ["Help businesses find buyers and distribution partners"],
  priorities: "Agri-food SMEs",
  consent: true,
};

afterAll(async () => {
  // Best-effort cleanup so repeated local runs stay isolated.
  await prisma.lead.deleteMany({}).catch(() => {});
  await prisma.$disconnect();
});

describe("POST /api/leads", () => {
  it("201 + Lead row for a valid EXPORTING lead", async () => {
    const res = await request(app).post(base).send(exportingValid);
    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();

    const row = await prisma.lead.findUnique({ where: { id: res.body.id } });
    expect(row?.kind).toBe("EXPORTING");
    expect(row?.companyName).toBe("Nordic Berries Oy");
    expect(row?.consent).toBe(true);
  });

  it("400 with field errors for a missing required field", async () => {
    const res = await request(app)
      .post(base)
      .send({ ...exportingValid, companyName: "" });
    expect(res.status).toBe(400);
    expect(res.body.fields).toBeTruthy();
  });

  it("400 for an invalid email", async () => {
    const res = await request(app)
      .post(base)
      .send({ ...exportingValid, email: "not-an-email" });
    expect(res.status).toBe(400);
  });

  it("400 when consent is false (no row created)", async () => {
    const res = await request(app)
      .post(base)
      .send({ ...exportingValid, consent: false });
    expect(res.status).toBe(400);

    const count = await prisma.lead.count({
      where: { email: "test@example.com", consent: false },
    });
    expect(count).toBe(0);
  });

  it("400 when the honeypot is filled (no row created)", async () => {
    // Use a unique email so the count reflects only THIS submission (the
    // valid-EXPORTING test above already persisted test@example.com).
    const res = await request(app)
      .post(base)
      .send({ ...exportingValid, email: "hp@example.com", hp: "bot" });
    expect(res.status).toBe(400);

    const count = await prisma.lead.count({ where: { email: "hp@example.com" } });
    expect(count).toBe(0);
  });

  it("201 for a SOURCING lead with a document link", async () => {
    const res = await request(app).post(base).send(sourcingLink);
    expect(res.status).toBe(201);
    const row = await prisma.lead.findUnique({ where: { id: res.body.id } });
    expect(row?.kind).toBe("SOURCING");
    expect(row?.productDocumentLink).toBe("https://example.com/products.pdf");
  });

  it("201 for a SOURCING lead with no product document (optional per the HTML)", async () => {
    const { productDocumentLink, ...noDoc } = sourcingLink;
    const res = await request(app).post(base).send(noDoc);
    expect(res.status).toBe(201);
  });

  it("201 for a SOURCING lead with an uploaded file + LeadFile row", async () => {
    const payload = JSON.stringify({
      kind: "SOURCING",
      companyName: "Uploader Co Oy",
      country: "Finland",
      products: "Specialty coffee",
      sourceCountries: ["Italy"],
      fullName: "Uploader",
      email: "uploader@example.com",
      phone: "+358 40 000 0000",
      consent: true,
    });
    const res = await request(app)
      .post(base)
      .field("payload", payload)
      .attach("productDocument", Buffer.from("example catalogue"), "catalogue.pdf");

    expect(res.status).toBe(201);
    const lead = await prisma.lead.findUnique({
      where: { id: res.body.id },
      include: { files: true },
    });
    expect(lead?.files.length).toBe(1);
  });

  it("201 for an ORGANIZATION lead (support + type persisted)", async () => {
    const res = await request(app).post(base).send(orgValid);
    expect(res.status).toBe(201);
    const row = await prisma.lead.findUnique({ where: { id: res.body.id } });
    expect(row?.kind).toBe("ORGANIZATION");
    expect(row?.organizationType).toBe("Chamber of Commerce");
    expect(row?.support).toContain("Help businesses find buyers and distribution partners");
  });
});
