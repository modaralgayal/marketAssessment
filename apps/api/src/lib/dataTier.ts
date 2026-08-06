import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { DataTierTemplate, DataTierLevel, DataTierField, TierCompleteness } from "@mea/shared";

// ── Module-level cache ──────────────────────────────────────────────────

let cachedTemplate: DataTierTemplate | null = null;
let templatePath: string | null = null;

/**
 * Resolve the path to the tier template JSON.
 * Uses the location of this source file to find the sibling JSON.
 */
function getTemplatePath(): string {
  if (templatePath) return templatePath;
  const __dirname = dirname(fileURLToPath(import.meta.url));
  templatePath = resolve(__dirname, "dataTierTemplate.json");
  return templatePath;
}

/**
 * Invalidate the cached template so the next call re-reads from disk.
 * Useful after the template file is updated at runtime.
 */
export function invalidateTemplateCache(): void {
  cachedTemplate = null;
}

/**
 * Load and validate the data tier template from the JSON config file.
 * Results are cached in memory for the lifetime of the process.
 */
export function loadTierTemplate(): DataTierTemplate {
  if (cachedTemplate) return cachedTemplate;

  const raw = readFileSync(getTemplatePath(), "utf-8");
  const parsed = JSON.parse(raw) as DataTierTemplate;

  // Basic validation
  if (!parsed.tier1?.fields || !parsed.tier2?.fields || !parsed.tier3?.fields) {
    throw new Error("Invalid data tier template: missing tier1/tier2/tier3 field definitions");
  }

  cachedTemplate = parsed;
  return parsed;
}

/**
 * Get the fields defined for a specific tier level.
 */
export function getTierFields(tier: number): DataTierField[] {
  const level = getTierLevel(tier);
  return level?.fields ?? [];
}

/**
 * Get the tier level config object for a given numeric tier.
 */
function getTierLevel(tier: number): DataTierLevel | undefined {
  const template = loadTierTemplate();
  switch (tier) {
    case 1: return template.tier1;
    case 2: return template.tier2;
    case 3: return template.tier3;
    default: return undefined;
  }
}

/**
 * Read custom field tier assignments stored in attributes.
 * Format: attributes._customFieldTiers = { "fieldKey": 1 | 2 | 3, ... }
 */
function getCustomTierMap(attributes: Record<string, any>): Record<string, number> {
  const raw = attributes?.["_customFieldTiers"];
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, number>;
  }
  return {};
}

/**
 * Count how many fields for a given tier level have truthy values in the
 * attributes object. Includes custom fields assigned to this tier via
 * the _customFieldTiers metadata.
 */
function countFilledFields(attributes: Record<string, any>, fields: DataTierField[], tierNum: number): number {
  const templateFilled = fields.filter((f) => {
    const val = attributes[f.key];
    return val !== undefined && val !== null && val !== "" && !(Array.isArray(val) && val.length === 0);
  }).length;

  // Count custom fields assigned to this tier
  const customTierMap = getCustomTierMap(attributes);
  const customFilled = Object.entries(customTierMap)
    .filter(([, t]) => t === tierNum)
    .filter(([key]) => {
      // Skip if this key is already a template field (it's already counted above)
      if (fields.some((f) => f.key === key)) return false;
      const val = attributes[key];
      return val !== undefined && val !== null && val !== "" && !(Array.isArray(val) && val.length === 0);
    }).length;

  return templateFilled + customFilled;
}

/**
 * Get the total number of fields for a tier, including custom fields assigned
 * to this tier via _customFieldTiers metadata.
 */
function totalFieldsForTier(attributes: Record<string, any>, fields: DataTierField[], tierNum: number): number {
  const templateTotal = fields.length;

  const customTierMap = getCustomTierMap(attributes);
  const customTotal = Object.entries(customTierMap)
    .filter(([, t]) => t === tierNum)
    .filter(([key]) => !fields.some((f) => f.key === key))
    .length;

  return templateTotal + customTotal;
}

/**
 * Compute the data tier for a distributor based on their attributes.
 *
 * Logic: check Tier 1 first (top-down). If ≥70% (or the tier's configured
 * threshold) of Tier 1 fields are filled → Tier 1. Else check Tier 2 with
 * the same threshold. Else → Tier 3.
 *
 * The threshold is read from the tier template — each tier can have its own
 * threshold, falling back to the root-level `threshold` (0.7 by default).
 */
export function computeDataTier(attributes: Record<string, any>): number {
  const template = loadTierTemplate();
  const attrs = attributes ?? {};

  // Check Tier 1
  const t1Threshold = template.tier1.threshold ?? template.threshold ?? 0.7;
  const t1Total = totalFieldsForTier(attrs, template.tier1.fields, 1);
  const t1Filled = countFilledFields(attrs, template.tier1.fields, 1);
  if (t1Total > 0 && t1Filled / t1Total >= t1Threshold) {
    return 1;
  }

  // Check Tier 2
  const t2Threshold = template.tier2.threshold ?? template.threshold ?? 0.7;
  const t2Total = totalFieldsForTier(attrs, template.tier2.fields, 2);
  const t2Filled = countFilledFields(attrs, template.tier2.fields, 2);
  if (t2Total > 0 && t2Filled / t2Total >= t2Threshold) {
    return 2;
  }

  return 3;
}

/**
 * Get completeness info for all tiers: how many fields filled, the
 * percentage, and whether the tier threshold is met.
 */
export function getTierCompleteness(attributes: Record<string, any>): TierCompleteness[] {
  const template = loadTierTemplate();
  const attrs = attributes ?? {};

  const tiers: Array<{ tier: number; level: DataTierLevel }> = [
    { tier: 1, level: template.tier1 },
    { tier: 2, level: template.tier2 },
    { tier: 3, level: template.tier3 },
  ];

  return tiers.map(({ tier, level }) => {
    const total = totalFieldsForTier(attrs, level.fields, tier);
    const filled = countFilledFields(attrs, level.fields, tier);
    const pct = total > 0 ? filled / total : 0;
    const threshold = level.threshold ?? template.threshold ?? 0.7;
    return {
      tier,
      label: level.label,
      total,
      filled,
      pct,
      met: pct >= threshold,
    };
  });
}

/**
 * Get a human-readable summary for a tier.
 */
export function getTierSummary(tier: number): { label: string; description: string } | null {
  const level = getTierLevel(tier);
  if (!level) return null;
  return { label: level.label, description: level.description };
}

/**
 * Get the list of field keys that are still missing to reach the next tier.
 * If already at tier 1, returns empty array.
 */
export function getMissingFields(attributes: Record<string, any>, currentTier: number): string[] {
  const template = loadTierTemplate();
  const attrs = attributes ?? {};

  // If already at Tier 1, nothing to improve
  if (currentTier <= 1) return [];

  // Figure out which tier to check next
  const targetTier = currentTier === 3 ? 2 : currentTier - 1;
  const level = getTierLevel(targetTier);
  if (!level) return [];

  const total = totalFieldsForTier(attrs, level.fields, targetTier);
  const filled = countFilledFields(attrs, level.fields, targetTier);
  const threshold = level.threshold ?? template.threshold ?? 0.7;
  const needed = Math.ceil(total * threshold);

  // Find template fields that are empty
  const empty = level.fields.filter((f) => {
    const val = attrs[f.key];
    return val === undefined || val === null || val === "";
  });

  // Return how many we need to fill to reach threshold (at most)
  const needToFill = Math.max(0, needed - filled);
  return empty.slice(0, needToFill).map((f) => f.label);
}