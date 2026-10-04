import { describe, it, expect } from "vitest";
import {
  leadSchema,
  exportingLeadSchema,
  sourcingLeadSchema,
  orgLeadSchema,
} from "./lead.js";
import { reportRequestSchema } from "./reportRequest.js";

const exportingValid = {
  kind: "EXPORTING" as const,
  companyName: "Nordic Berries Oy",
  country: "Finland",
  fullName: "Test User",
  email: "test@example.com",
  website: "https://nordic.example.com",
  product: "Frozen lingonberries",
  targetMarket: ["Saudi Arabia"],
  consent: true,
};

const sourcingValid = {
  kind: "SOURCING" as const,
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
  kind: "ORGANIZATION" as const,
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

describe("exportingLeadSchema", () => {
  it("accepts a fully valid payload", () => {
    expect(exportingLeadSchema.parse(exportingValid)).toMatchObject({ kind: "EXPORTING" });
  });

  it("rejects a missing required field", () => {
    expect(() => exportingLeadSchema.parse({ ...exportingValid, companyName: "" })).toThrow();
  });

  it("rejects an invalid email", () => {
    expect(() => exportingLeadSchema.parse({ ...exportingValid, email: "nope" })).toThrow();
  });

  it("rejects a non-array target market", () => {
    expect(() =>
      exportingLeadSchema.parse({ ...exportingValid, targetMarket: "Mars" as unknown as string[] }),
    ).toThrow();
  });

  it("rejects an empty target market array", () => {
    expect(() => exportingLeadSchema.parse({ ...exportingValid, targetMarket: [] })).toThrow();
  });

  it("rejects consent !== true", () => {
    expect(() => exportingLeadSchema.parse({ ...exportingValid, consent: false })).toThrow();
  });
});

describe("sourcingLeadSchema", () => {
  it("accepts a link-based product document", () => {
    expect(sourcingLeadSchema.parse(sourcingValid)).toMatchObject({ kind: "SOURCING" });
  });

  it("accepts a payload with no link (file supplied out-of-band)", () => {
    const { productDocumentLink, ...rest } = sourcingValid;
    expect(sourcingLeadSchema.parse(rest)).toMatchObject({ kind: "SOURCING" });
  });

  it("accepts a payload with no product document at all (optional per the HTML)", () => {
    const { productDocumentLink, ...rest } = sourcingValid;
    expect(sourcingLeadSchema.parse({ ...rest, companyName: "X Oy", country: "FI" })).toMatchObject({
      kind: "SOURCING",
    });
  });

  it("rejects missing companyName", () => {
    expect(() => sourcingLeadSchema.parse({ ...sourcingValid, companyName: "" })).toThrow();
  });

  it("rejects missing products", () => {
    expect(() => sourcingLeadSchema.parse({ ...sourcingValid, products: "" })).toThrow();
  });

  it("rejects an empty sourceCountries array", () => {
    expect(() => sourcingLeadSchema.parse({ ...sourcingValid, sourceCountries: [] })).toThrow();
  });

  it("rejects a missing phone", () => {
    expect(() => sourcingLeadSchema.parse({ ...sourcingValid, phone: "" })).toThrow();
  });
});

describe("orgLeadSchema", () => {
  it("accepts a fully valid payload (jobTitle optional)", () => {
    expect(orgLeadSchema.parse(orgValid)).toMatchObject({ kind: "ORGANIZATION" });
  });

  it("rejects an unknown organization type", () => {
    expect(() => orgLeadSchema.parse({ ...orgValid, organizationType: "Sole Trader" })).toThrow();
  });

  it("rejects an empty support array", () => {
    expect(() => orgLeadSchema.parse({ ...orgValid, support: [] })).toThrow();
  });
});

describe("leadSchema (discriminated union)", () => {
  it("routes each kind to its variant", () => {
    expect(leadSchema.parse(exportingValid).kind).toBe("EXPORTING");
    expect(leadSchema.parse(sourcingValid).kind).toBe("SOURCING");
    expect(leadSchema.parse(orgValid).kind).toBe("ORGANIZATION");
  });

  it("rejects an unknown kind", () => {
    expect(() => leadSchema.parse({ ...exportingValid, kind: "WHATEVER" })).toThrow();
  });

  it("strips an unknown honeypot field instead of erroring", () => {
    const parsed = leadSchema.parse({ ...exportingValid, hp: "bot" });
    expect((parsed as Record<string, unknown>).hp).toBeUndefined();
  });
});

describe("reportRequestSchema", () => {
  const valid = {
    subject: "Quarterly GCC report",
    message: "Please send the latest distributor overview.",
    email: "procurement@example.com",
    consent: true,
  };

  it("still enforces subject/message/email", () => {
    expect(reportRequestSchema.parse(valid)).toMatchObject({ email: "procurement@example.com" });
  });

  it("requires consent (new rule)", () => {
    expect(() => reportRequestSchema.parse({ ...valid, consent: false })).toThrow();
    expect(() =>
      reportRequestSchema.parse({
        subject: valid.subject,
        message: valid.message,
        email: valid.email,
      }),
    ).toThrow();
  });
});
