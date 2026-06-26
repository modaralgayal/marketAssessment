import { Anthropic } from "@anthropic-ai/sdk";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to criteria file (relative to project root)
const CRITERIA_PATH = path.resolve(
  __dirname,
  "./criteria/gcc-market-entry-assessment.json",
);

let criteriaCache: any = null;
let criteriaMtime: number = 0;

/**
 * Loads and caches the criteria JSON file.
 * Reloads if the file has changed on disk.
 */
async function loadCriteria(): Promise<any> {
  const { mtime } = await stat(CRITERIA_PATH);
  const mtimeMs = mtime.getTime();
  if (!criteriaCache || mtimeMs !== criteriaMtime) {
    const raw = await readFile(CRITERIA_PATH, "utf-8");
    criteriaCache = JSON.parse(raw);
    criteriaMtime = mtimeMs;
  }
  return criteriaCache;
}

/**
 * Builds the prompt for Claude Haiku based on the criteria and application data.
 * This mirrors the logic from the previous Python scoring agent.
 */
function buildPrompt(criteria: any, application: any): string {
  const criteriaStr = JSON.stringify(criteria, null, 2);
  const appStr = JSON.stringify(application, null, 2);

  const outputRules = `
    OUTPUT REQUIREMENTS:

    - Your entire response MUST be a single valid JSON object.
    - Do NOT wrap the JSON in markdown.
    - Do NOT use \`\`\`json or \`\`\`.
    - Do NOT include explanations before or after the JSON.
    - Do NOT include notes, headings, reasoning, or comments.
    - The first character of your response must be {
    - The last character of your response must be }

    Required schema:

    {
      "score": 78.3,
      "explanation": "Brief explanation."
    }

    The response must be parseable by JSON.parse() without modification.
    `;

  const helperBlock = `
HELPER DEFINITIONS (use these exactly when evaluating a rule):
- sentiment:   Compute the VADER compound sentiment score of the text.
                1. Use NLTK's SentimentIntensityAnalyzer.
                2. Return the "compound" value (range -1.0 … +1.0).
                3. Example: "I love this product!" → compound ≈ 0.6369.
- length:      Return the number of characters in the given string (including spaces).
                Example: "hi there!" → 9.
- keyword:     Return TRUE if **any** of the listed words/phrases appear in the text,
                case‑insensitive, whole‑word match.
                Example: words=["growth","scalability"]; text="We seek scalability." → TRUE.
- numeric:     Use the raw numeric value from the application field.
                Example: years_experience: 6 → 6.
`;

  return `
You are an expert scoring agent. Your ONLY task is to score applications based strictly on the criteria provided below.

CRITERIA JSON:
${criteriaStr}

APPLICATION TO SCORE:
${appStr}

${helperBlock}


INSTRUCTIONS:
1. For each rule in the criteria, evaluate its condition using the helper definitions above.
2. If the condition is TRUE → award the rule's "points"; otherwise award 0.
3. Sum all awarded points → TOTAL_POINTS.
4. Convert to a 0‑100 scale:
   score = (TOTAL_POINTS / max_possible) * 100
   (max_possible comes from criteria.scoring.max_possible)
5. ROUND to ONE decimal place (e.g., 78.3).
6. Return exactly:

{
  "score": 78.3,
  "explanation": "One sentence under 30 words."
}

7. The explanation must be one sentence.
8. The explanation must contain fewer than 30 words.
9. The first character must be {.
10. The last character must be }.
11. Never output markdown or code fences.

Now produce the JSON for the application above.
${outputRules}
`;
}

/**
 * Calls Claude Haiku to score the application.
 * Throws if API key missing or API call fails.
 */
async function callClaude(
  prompt: string,
): Promise<{ score: number; explanation: string }> {
  const apiKey = process.env.CLAUDE_API_KEY;

  if (!apiKey) {
    throw new Error("CLAUDE_API_KEY is not set in environment variables");
  }

  const anthropic = new Anthropic({ apiKey });

  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    temperature: 0,
    system: `
You are a scoring API.

Rules:
- Output exactly one JSON object.
- Never output markdown.
- Never output code fences.
- Never output explanations outside the JSON.
- The explanation must be a single sentence under 30 words.

Valid format:

{
  "score": 78.3,
  "explanation": "Brief explanation."
}
`,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const text = msg.content[0]?.type === "text" ? msg.content[0].text : "";

  console.log("Claude raw response:");
  console.log(text);

  let cleaned = text.trim();

  // Remove ```json
  cleaned = cleaned.replace(/^```json\s*/i, "");

  // Remove ```
  cleaned = cleaned.replace(/^```\s*/i, "");

  // Remove ending ```
  cleaned = cleaned.replace(/\s*```$/, "");

  let result: any;

  try {
    result = JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed JSON:");
    console.error(cleaned);

    throw new Error(`Failed to parse Claude response as JSON: ${e}`);
  }

  if (
    typeof result.score !== "number" ||
    result.score < 0 ||
    result.score > 100 ||
    typeof result.explanation !== "string"
  ) {
    throw new Error(
      `Claude response missing required fields:\n${JSON.stringify(
        result,
        null,
        2,
      )}`,
    );
  }

  return {
    score: Number(result.score.toFixed(1)),
    explanation: result.explanation.trim(),
  };
}

/**
 * Determines the decision (GO, CONDITIONAL, REVISIT, NO-GO) based on the
 * criteria's decision_gate section.
 */
function getDecisionFromCriteria(criteria: any, score: number): string | null {
  const decisionGate = criteria?.framework?.decision_gate;
  if (!decisionGate) return null;
  const gates = ["go", "conditional", "revisit", "no_go"] as const;
  for (const g of gates) {
    const range = decisionGate[g]?.score_range;
    if (range && score >= range.min && score <= range.max) {
      return decisionGate[g].decision;
    }
  }
  return null;
}

/**
 * Public function used by the route to score an application.
 */
export async function scoreApplication(application: any): Promise<{
  score: number;
  explanation: string;
  decision?: string;
}> {
  const criteria = await loadCriteria();
  const prompt = buildPrompt(criteria, application);
  const { score, explanation } = await callClaude(prompt);
  const decision = getDecisionFromCriteria(criteria, score);
  return decision ? { score, explanation, decision } : { score, explanation };
}
