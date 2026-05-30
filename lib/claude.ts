import type { ChartSpec } from "@/types/chart";
import { isChartSpec, normalizeSpec } from "./chart-utils";
import { BRAND_NAME } from "./brand";

const SYSTEM_PROMPT = `You are ${BRAND_NAME}, a visual learning data engine for everyday people.
Return ONLY valid JSON. No markdown, no backticks, no explanation.

Shape:
{
  "title": "short chart title",
  "subtitle": "plain-language context",
  "chartType": "line" | "bar" | "area" | "scatter",
  "data": [{ "<xKey>": "...", "<yKey>": 123 }],
  "xKey": "key for x-axis",
  "yKeys": ["one_to_three_numeric_keys"],
  "seriesLabels": ["Human label"],
  "colors": ["#c0392b"],
  "unit": "%, $, index, people, titles, etc.",
  "source": "source or confidence note",
  "sourceUrl": "optional official or useful source URL",
  "sourceUpdatedAt": "optional YYYY-MM-DD freshness date",
  "assumptions": ["optional plain-language caveat"],
  "insight": "one neutral description of the most visible pattern",
  "whyItMatters": "optional neutral source or chart context, not a conclusion about importance",
  "followUpPrompts": ["short related question"],
  "dataSource": "training" | "approximate"
}

Rules:
- Make the chart legible to a normal person without telling them what to conclude.
- Be honest. Use "approximate" when uncertain.
- Use 5-16 data points.
- Include 2-4 follow-up prompts when useful.
- Up to 3 series.
- Raw numeric values only in y fields.
- Prefer colors #c0392b, #2980b9, #16a085.
- Return JSON only.`;

export async function generateChartWithClaude(query: string): Promise<ChartSpec> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1600,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: query }]
  });

  const raw = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("")
    .replace(/```json|```/g, "")
    .trim();
  const parsed = JSON.parse(raw) as unknown;

  if (!isChartSpec(parsed)) {
    throw new Error("Claude returned an invalid chart spec");
  }

  return normalizeSpec(parsed);
}
