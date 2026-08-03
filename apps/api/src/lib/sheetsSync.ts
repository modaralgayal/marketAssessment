import { google } from "googleapis";
import { prisma } from "../prisma.js";
import { distributorSchema } from "@mea/shared";
import { env } from "../env.js";

const SHEET_ID = env.GOOGLE_SHEET_ID;

export interface SyncResult {
  imported: number;
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
    return { imported: 0, skipped: 0, errors: [] };
  }

  const result: SyncResult = { imported: 0, skipped: 0, errors: [] };

  // Process each tab (same schema across all tabs)
  for (const sheet of tabs) {
    const tabName = sheet.properties?.title;
    if (!tabName) continue;

    // Skip README tab
    if (tabName.toLowerCase() === "readme") {
      console.log(`[sheetsSync] Skipping README tab`);
      continue;
    }

    const tabBefore = { imported: result.imported, skipped: result.skipped, errors: result.errors.length };

    try {
      await processTab(sheets, tabName, result);
    } catch (err: any) {
      result.errors.push(`Tab "${tabName}": ${err.message}`);
    }

    const tabImported = result.imported - tabBefore.imported;
    const tabSkipped = result.skipped - tabBefore.skipped;
    const tabErrors = result.errors.length - tabBefore.errors;
    console.log(`[sheetsSync] Tab "${tabName}": ${tabImported} imported, ${tabSkipped} skipped, ${tabErrors} errors`);
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
  let headerRowIndex = 0;
  let dataStartIndex = 1;
  if (rows.length > 1) {
    const firstRow = rows[0]!.map((h: string) => String(h).trim()).filter(Boolean);
    const secondRow = rows[1]!.map((h: string) => String(h).trim()).filter(Boolean);
    // If first row is a single cell and second row has multiple cells, skip the title row
    if (firstRow.length <= 1 && secondRow.length >= 3) {
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

  const mappedHeaders = headers.map((h: string) => fieldMap[h] ?? null);

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
    const obj: Record<string, string> = {};
    mappedHeaders.forEach((field: string | null, colIdx: number) => {
      if (field && row[colIdx] !== undefined && row[colIdx] !== null) {
        obj[field] = String(row[colIdx]).trim();
      }
    });

    // Skip rows without a company name
    if (!obj.companyName) {
      result.errors.push(`Tab "${tabName}", row ${rowOffset + i}: Missing company name, skipped.`);
      continue;
    }

    // Validate against schema
    const parsed = distributorSchema.safeParse(obj);
    if (!parsed.success) {
      result.errors.push(
        `Tab "${tabName}", row ${rowOffset + i} ("${obj.companyName}"): Validation failed — ${JSON.stringify(parsed.error.flatten().fieldErrors)}. Skipped.`,
      );
      continue;
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

    if (existing) {
      result.skipped++;
      continue;
    }

    // Insert new distributor
    await prisma.distributor.create({ data: parsed.data });
    result.imported++;
  }
}