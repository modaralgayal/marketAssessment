import { google } from "googleapis";
import { prisma } from "../prisma.js";
import { distributorSchema, type DistributorDto } from "@mea/shared";
import { env } from "../env.js";
import { computeDataTier } from "./dataTier.js";

const SHEET_ID = env.GOOGLE_SHEET_ID;

export interface SyncResult {
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
}

/**
 * Reads all tabs from the configured Google Sheet and inserts new distributors.
 *
 * Security:
 *  - Token is never stored or logged — used once and discarded.
 *  - Only reads the configured GOOGLE_SHEET_ID.
 *  - Uses the minimum scope: spreadsheets.readonly.
 *
 * @param accessToken - One-time Google OAuth token (spreadsheets.readonly scope).
 */
export async function syncFromSheet(accessToken: string): Promise<SyncResult> {
  if (!SHEET_ID) {
    throw new Error("GOOGLE_SHEET_ID is not configured.");
  }

  // Authenticate with the admin's one-time token
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const sheets = google.sheets({ version: "v4", auth });

  // Get all sheet names (tabs)
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID,
  });

  const tabs = spreadsheet.data.sheets ?? [];
  if (tabs.length === 0) {
    return { imported: 0, updated: 0, skipped: 0, errors: [] };
  }

  const result: SyncResult = { imported: 0, updated: 0, skipped: 0, errors: [] };

  // Process each tab (same schema across all tabs)
  for (const sheet of tabs) {
    const tabName = sheet.properties?.title;
    if (!tabName) continue;

    // Skip README tab
    if (tabName.toLowerCase() === "readme") {
      console.log(`[sheetsSync] Skipping README tab`);
      continue;
    }

    const tabBefore = { imported: result.imported, updated: result.updated, skipped: result.skipped, errors: result.errors.length };

    try {
      await processTab(sheets, tabName, result);
    } catch (err: any) {
      result.errors.push(`Tab "${tabName}": ${err.message}`);
    }

    const tabImported = result.imported - tabBefore.imported;
    const tabUpdated = result.updated - tabBefore.updated;
    const tabSkipped = result.skipped - tabBefore.skipped;
    const tabErrors = result.errors.length - tabBefore.errors;
    console.log(`[sheetsSync] Tab "${tabName}": ${tabImported} imported, ${tabUpdated} updated, ${tabSkipped} skipped, ${tabErrors} errors`);
  }

  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processTab(sheets: any, tabName: string, result: SyncResult): Promise<void> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID!,
    range: tabName,
  });

  const rows = response.data.values;
  if (!rows || rows.length < 2) {
    // No data rows (only header or empty)
    return;
  }

  // Some sheets have a title row (row 1) before the actual column headers (row 2).
  // Detect this: if the first row has only 1 cell and doesn't look like column headers,
  // treat it as a title and use row 2 as headers.
  // The A1 value of the title row is the product category for this tab.
  let headerRowIndex = 0;
  let dataStartIndex = 1;
  let tabProductCategory = "";
  if (rows.length > 1) {
    const firstRow = rows[0]!.map((h: string) => String(h).trim()).filter(Boolean);
    const secondRow = rows[1]!.map((h: string) => String(h).trim()).filter(Boolean);
    // If first row is a single cell and second row has multiple cells, skip the title row
    if (firstRow.length <= 1 && secondRow.length >= 3) {
      tabProductCategory = String(rows[0]![0] ?? "").trim();
      headerRowIndex = 1;
      dataStartIndex = 2;
    }
  }

  const rawHeaders = rows[headerRowIndex]!.map((h: string) => String(h));
  const headers = rawHeaders.map((h: string) => h.trim().toLowerCase());
  const dataRows = rows.slice(dataStartIndex).filter((row: any[]) => row.some((cell) => String(cell).trim() !== ""));

  if (dataRows.length === 0) return;

  // Map spreadsheet headers to distributor field names
  // Handles both human-readable headers ("Company Name") and camelCase headers ("companyName")
  const fieldMap: Record<string, string> = {
    "company name": "companyName",
    companyname: "companyName",
    company: "companyName",
    "city / region": "cityRegion",
    "city/region": "cityRegion",
    "city region": "cityRegion",
    cityregion: "cityRegion",
    region: "cityRegion",
    city: "cityRegion",
    "channel / type": "channelType",
    "channel/type": "channelType",
    "channel type": "channelType",
    channeltype: "channelType",
    channel: "channelType",
    type: "channelType",
    "size / scale": "sizeScale",
    "size/scale": "sizeScale",
    "size scale": "sizeScale",
    sizescale: "sizeScale",
    scale: "sizeScale",
    size: "sizeScale",
    website: "website",
    phone: "phone",
    email: "email",
    "contact person": "contactPerson",
    contactperson: "contactPerson",
    contact: "contactPerson",
    "do we know them?": "doWeKnowThem",
    "do we know them": "doWeKnowThem",
    "know them": "doWeKnowThem",
    doweknowthem: "doWeKnowThem",
    "status / last contact": "statusLastContact",
    "status/last contact": "statusLastContact",
    "status last contact": "statusLastContact",
    statuslastcontact: "statusLastContact",
    status: "statusLastContact",
    "last contact": "statusLastContact",
        description: "description",
  };

  const mappedHeaders = headers.map((h: string) => {
    if (h.startsWith("attributes.") || h.startsWith("attributes_")) return h;
    return fieldMap[h] ?? null;
  });

  // Check required columns exist
  const missingRequired = ["companyName", "cityRegion", "channelType"].filter(
    (f) => !mappedHeaders.includes(f),
  );
  if (missingRequired.length > 0) {
    result.errors.push(
      `Tab "${tabName}": Missing required columns: ${missingRequired.join(", ")}. Skipping tab.`,
    );
    return;
  }

  // Process each row
  const rowOffset = dataStartIndex + 1; // 1-indexed row number in the sheet
  for (const [i, row] of dataRows.entries()) {
    await processRow(row, i, rowOffset, tabName, tabProductCategory, mappedHeaders, result);
  }
}

/**
 * Parse a single row and upsert it into the database.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processRow(row: any[], index: number, rowOffset: number, tabName: string, tabProductCategory: string, mappedHeaders: (string | null)[], result: SyncResult): Promise<void> {
  const obj: Record<string, any> = {};
  const attributes: Record<string, string> = {};
  mappedHeaders.forEach((field: string | null, colIdx: number) => {
    if (field && row[colIdx] !== undefined && row[colIdx] !== null) {
      const val = String(row[colIdx]).trim();
      if (field.startsWith("attributes.")) {
        attributes[field.slice("attributes.".length)] = val;
      } else if (field.startsWith("attributes_")) {
        attributes[field.slice("attributes_".length)] = val;
      } else {
        obj[field] = val;
      }
    }
  });

  // Merge attributes
  if (Object.keys(attributes).length > 0) {
    obj.attributes = attributes;
  }

  // If the tab has a product category title (A1), apply it unless the row
  // already has a productCategories value from a column mapping
  if (tabProductCategory) {
    const existing = (obj.attributes as Record<string, any>)?.["productCategories"];
    if (!existing || String(existing).trim() === "") {
      if (!obj.attributes) obj.attributes = {};
      (obj.attributes as Record<string, any>)["productCategories"] = tabProductCategory;
    }
  }

  // Skip rows without a company name
  if (!obj.companyName) {
    result.errors.push(`Tab "${tabName}", row ${rowOffset + index}: Missing company name, skipped.`);
    return;
  }

  // Validate against schema
  const parsed = distributorSchema.safeParse(obj);
  if (!parsed.success) {
    result.errors.push(
      `Tab "${tabName}", row ${rowOffset + index} ("${obj.companyName}"): Validation failed — ${JSON.stringify(parsed.error.flatten().fieldErrors)}. Skipped.`,
    );
    return;
  }

  // Check if this distributor already exists (case-insensitive by companyName)
  const existing = await prisma.distributor.findFirst({
    where: {
      companyName: {
        equals: parsed.data.companyName,
        mode: "insensitive",
      },
    },
  });

  // Compute data tier from attributes
  const attrs = (parsed.data.attributes as Record<string, any>) ?? {};
  const dataTier = computeDataTier(attrs);
  const updateData = { ...parsed.data, dataTier, attributes: attrs } as any;

  if (existing) {
    // Update existing distributor with latest sheet data
    await prisma.distributor.update({
      where: { id: existing.id },
      data: updateData,
    });
    result.updated++;
    return;
  }

  // Insert new distributor
  await prisma.distributor.create({ data: updateData });
  result.imported++;
}

/**
 * Sync a single distributor from the Google Sheet by matching its company name.
 * Searches all tabs and updates the first matching row.
 *
 * @returns The updated distributor data, or null if not found in the sheet.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function syncSingleDistributorFromSheet(accessToken: string, companyName: string): Promise<DistributorDto | null> {
  if (!SHEET_ID) {
    throw new Error("GOOGLE_SHEET_ID is not configured.");
  }

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const sheets = google.sheets({ version: "v4", auth });

  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID,
  });

  const tabs = spreadsheet.data.sheets ?? [];
  if (tabs.length === 0) return null;

  for (const sheet of tabs) {
    const tabName = sheet.properties?.title;
    if (!tabName || tabName.toLowerCase() === "readme") continue;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID!,
      range: tabName,
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) continue;

    // Detect title row
    let headerRowIndex = 0;
    let dataStartIndex = 1;
    let tabProductCategory = "";
    if (rows.length > 1) {
      const firstRow = rows[0]!.map((h: string) => String(h).trim()).filter(Boolean);
      const secondRow = rows[1]!.map((h: string) => String(h).trim()).filter(Boolean);
      if (firstRow.length <= 1 && secondRow.length >= 3) {
        tabProductCategory = String(rows[0]![0] ?? "").trim();
        headerRowIndex = 1;
        dataStartIndex = 2;
      }
    }

    const rawHeaders = rows[headerRowIndex]!.map((h: string) => String(h));
    const headers = rawHeaders.map((h: string) => h.trim().toLowerCase());

    // Build field map (same as processTab)
    const fieldMap: Record<string, string> = {
      "company name": "companyName",
      companyname: "companyName",
      company: "companyName",
      "city / region": "cityRegion",
      "city/region": "cityRegion",
      "city region": "cityRegion",
      cityregion: "cityRegion",
      region: "cityRegion",
      city: "cityRegion",
      "channel / type": "channelType",
      "channel/type": "channelType",
      "channel type": "channelType",
      channeltype: "channelType",
      channel: "channelType",
      type: "channelType",
      "size / scale": "sizeScale",
      "size/scale": "sizeScale",
      "size scale": "sizeScale",
      sizescale: "sizeScale",
      scale: "sizeScale",
      size: "sizeScale",
      website: "website",
      phone: "phone",
      email: "email",
      "contact person": "contactPerson",
      contactperson: "contactPerson",
      contact: "contactPerson",
      "do we know them?": "doWeKnowThem",
      "do we know them": "doWeKnowThem",
      "know them": "doWeKnowThem",
      doweknowthem: "doWeKnowThem",
      "status / last contact": "statusLastContact",
      "status/last contact": "statusLastContact",
      "status last contact": "statusLastContact",
      statuslastcontact: "statusLastContact",
      status: "statusLastContact",
      "last contact": "statusLastContact",
      description: "description",
    };

    const mappedHeaders = headers.map((h: string) => {
      if (h.startsWith("attributes.") || h.startsWith("attributes_")) return h;
      return fieldMap[h] ?? null;
    });

    const nameColIndex = mappedHeaders.indexOf("companyName");
    if (nameColIndex === -1) continue;

    const dataRows = rows.slice(dataStartIndex).filter((row: any[]) => row.some((cell) => String(cell).trim() !== ""));
    const searchName = companyName.toLowerCase().trim();

    for (const row of dataRows) {
      const rowName = String(row[nameColIndex] ?? "").trim().toLowerCase();
      if (rowName !== searchName) continue;

      // Found a match — process this row
      const singleResult: SyncResult = { imported: 0, updated: 0, skipped: 0, errors: [] };
      const rowOffset = dataStartIndex + 1;
      const rowIndex = dataRows.indexOf(row);
      await processRow(row, rowIndex, rowOffset, tabName, tabProductCategory, mappedHeaders, singleResult);

      if (singleResult.errors.length > 0) {
        throw new Error(singleResult.errors[0]);
      }

      // Fetch and return the updated distributor
      const updated = await prisma.distributor.findFirst({
        where: {
          companyName: {
            equals: companyName,
            mode: "insensitive",
          },
        },
        include: { _count: { select: { matches: true } } },
      });

      if (!updated) return null;

      return {
        id: updated.id,
        companyName: updated.companyName,
        cityRegion: updated.cityRegion,
        channelType: updated.channelType,
        sizeScale: updated.sizeScale ?? undefined,
        website: updated.website ?? undefined,
        phone: updated.phone ?? undefined,
        email: updated.email ?? undefined,
        contactPerson: updated.contactPerson ?? undefined,
        doWeKnowThem: updated.doWeKnowThem ?? undefined,
        statusLastContact: updated.statusLastContact ?? undefined,
        description: updated.description ?? undefined,
        dataTier: updated.dataTier ?? 3,
        attributes: (updated.attributes as Record<string, any>) ?? {},
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        matchCount: updated._count?.matches ?? undefined,
      };
    }
  }

  return null;
}