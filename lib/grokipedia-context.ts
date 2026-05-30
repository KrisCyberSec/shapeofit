import type { ChartSpec, ReferenceContext } from "@/types/chart";
import type { ChartPlan } from "./chart-planner";

type XaiResponsePayload = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
    type?: string;
  }>;
  sources?: Array<{
    title?: string;
    url?: string;
  }>;
};

export async function grokipediaContextForChart({
  query,
  plan,
  spec
}: {
  query: string;
  plan: ChartPlan;
  spec: ChartSpec;
}): Promise<ReferenceContext | null> {
  if (!process.env.XAI_API_KEY) return null;
  if (plan.kind === "unsupported") return null;

  try {
    const payload = await requestGrokipediaContext(query, spec);
    const summary = extractText(payload);
    if (!summary) return null;

    return {
      provider: "grokipedia",
      label: "Grokipedia reference",
      summary,
      url: extractGrokipediaUrl(payload),
      confidence: "context_only"
    };
  } catch {
    return null;
  }
}

async function requestGrokipediaContext(query: string, spec: ChartSpec) {
  const controller = new AbortController();
  const timeout = windowlessTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch("https://api.x.ai/v1/responses", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.XAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.XAI_GROKIPEDIA_MODEL ?? "grok-4.3",
        input: [
          {
            role: "system",
            content:
              "Return concise encyclopedia context for a data chart. Use Grokipedia only. Do not provide chart values or numeric claims unless they are definitional. Keep it neutral and under 55 words."
          },
          {
            role: "user",
            content: `Chart title: ${spec.title}\nQuestion: ${query}\nSeries: ${(spec.seriesLabels ?? spec.yKeys).join(", ")}`
          }
        ],
        tools: [
          {
            type: "web_search",
            allowed_domains: ["grokipedia.com"]
          }
        ],
        max_output_tokens: 180
      })
    });

    if (!response.ok) throw new Error("xAI Grokipedia context request failed");
    return (await response.json()) as XaiResponsePayload;
  } finally {
    clearTimeout(timeout);
  }
}

function extractText(payload: XaiResponsePayload) {
  const direct = payload.output_text?.trim();
  if (direct) return sanitizeSummary(direct);

  const fromOutput = payload.output
    ?.flatMap((item) => item.content ?? [])
    .map((item) => item.text)
    .find((text) => text?.trim());

  return fromOutput ? sanitizeSummary(fromOutput) : "";
}

function sanitizeSummary(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 420);
}

function extractGrokipediaUrl(payload: XaiResponsePayload) {
  const sourceUrl = payload.sources?.find((source) =>
    source.url?.includes("grokipedia.com")
  )?.url;
  if (sourceUrl) return sourceUrl;

  const match = JSON.stringify(payload).match(/https?:\/\/(?:www\.)?grokipedia\.com[^\s"\\)]+/i);
  return match?.[0];
}

function windowlessTimeout(callback: () => void, ms: number) {
  return setTimeout(callback, ms);
}
