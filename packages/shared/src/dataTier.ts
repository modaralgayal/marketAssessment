// ── Data Tier Types ──────────────────────────────────────────────────────

export interface DataTierField {
  key: string;
  label: string;
  type: "text" | "textarea" | "url" | "select";
  options?: string[];
}

export interface DataTierLevel {
  label: string;
  description: string;
  threshold: number;
  fields: DataTierField[];
}

export interface DataTierTemplate {
  threshold: number;
  tier1: DataTierLevel;
  tier2: DataTierLevel;
  tier3: DataTierLevel;
}

export interface TierCompleteness {
  tier: number;
  label: string;
  total: number;
  filled: number;
  pct: number;
  met: boolean;
}