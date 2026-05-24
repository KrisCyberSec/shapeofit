import { NextRequest, NextResponse } from "next/server";
import type { ChartSpec } from "@/types/chart";
import { generateChartWithClaude } from "@/lib/claude";
import { getClarification } from "@/lib/clarify";
import { mergeComparison, normalizeSpec } from "@/lib/chart-utils";
import { mockChartForQuery } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { query?: string; compareWith?: ChartSpec };

  try {
    body = (await req.json()) as { query?: string; compareWith?: ChartSpec };
  } catch {
    return NextResponse.json(
      { error: "invalid_json", message: "Send a JSON body with a query." },
      { status: 400 }
    );
  }

  const query = body.query?.trim();
  if (!query) {
    return NextResponse.json(
      { error: "empty_query", message: "Type something you want to see visualized." },
      { status: 400 }
    );
  }

  if (!body.compareWith) {
    const clarification = getClarification(query);
    if (clarification) return NextResponse.json(clarification);
  }

  const startedAt = Date.now();
  const { spec, mocked } = await generateSpec(query);
  const merged = body.compareWith ? mergeComparison(body.compareWith, spec) : spec;

  return NextResponse.json({
    spec: normalizeSpec(merged),
    cached: false,
    mocked,
    latencyMs: Date.now() - startedAt
  });
}

async function generateSpec(query: string): Promise<{ spec: ChartSpec; mocked: boolean }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { spec: mockChartForQuery(query), mocked: true };
  }

  try {
    return { spec: await generateChartWithClaude(query), mocked: false };
  } catch {
    return { spec: mockChartForQuery(query), mocked: true };
  }
}
