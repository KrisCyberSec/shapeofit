import { NextRequest, NextResponse } from "next/server";
import type { ChartSpec, UnsupportedQueryResponse } from "@/types/chart";
import { answerabilityForPlan } from "@/lib/answerability";
import { planChartQuery, type ChartPlan } from "@/lib/chart-planner";
import { generateChartWithClaude } from "@/lib/claude";
import { getClarification } from "@/lib/clarify";
import { mergeComparison, normalizeSpec } from "@/lib/chart-utils";
import { grokipediaContextForChart } from "@/lib/grokipedia-context";
import { liveSpecForQuery } from "@/lib/live-data";
import { routeQueryIntent, splitComparisonQuery } from "@/lib/query-router";
import { isSupportedQuery, nearbySupportedPrompts } from "@/lib/source-registry";

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

  const rawQuery = body.query?.trim();
  if (!rawQuery) {
    return NextResponse.json(
      { error: "empty_query", message: "Type something you want to see visualized." },
      { status: 400 }
    );
  }
  const query = routeQueryIntent(rawQuery);
  const plan = !body.compareWith ? planChartQuery(rawQuery) : planChartQuery(query);

  if (!body.compareWith) {
    const clarification = getClarification(rawQuery);
    if (clarification) return NextResponse.json(clarification);
  }

  const startedAt = Date.now();
  const comparisonQueries =
    !body.compareWith && plan.kind === "comparison"
      ? plan.comparisonQueries
      : !body.compareWith
        ? splitComparisonQuery(rawQuery)
        : null;
  if (comparisonQueries) {
    const [baseQuery, additionQuery] = comparisonQueries.map(routeQueryIntent);
    const unsupportedQuery = [baseQuery, additionQuery].find((item) => !isSupportedQuery(item));
    if (unsupportedQuery) {
      return NextResponse.json(unsupportedResponse(rawQuery, unsupportedQuery, plan));
    }

    let base: Awaited<ReturnType<typeof generateSpec>>;
    let addition: Awaited<ReturnType<typeof generateSpec>>;
    try {
      [base, addition] = await Promise.all([
        generateSpec(baseQuery),
        generateSpec(additionQuery)
      ]);
    } catch {
      return sourceUnavailableResponse();
    }
    const merged = mergeComparison(base.spec, addition.spec);
    const enriched = await withReferenceContext(normalizeSpec(merged), rawQuery, plan);

    return NextResponse.json({
      spec: enriched,
      cached: false,
      mocked: base.mocked || addition.mocked,
      latencyMs: Date.now() - startedAt,
      chartPlan: publicPlan(plan),
      answerability: answerabilityForPlan({ query: rawQuery, plan, spec: enriched })
    });
  }

  const generationQuery = plan.kind === "derived" ? plan.canonicalQuery : query;

  if (!body.compareWith && plan.kind === "partial_unsupported") {
    return NextResponse.json(partialUnsupportedResponse(rawQuery, plan));
  }

  if (!body.compareWith && plan.kind === "unsupported") {
    return NextResponse.json(unsupportedResponse(rawQuery, plan.query, plan));
  }

  if (!body.compareWith && !isSupportedQuery(generationQuery)) {
    return NextResponse.json(unsupportedResponse(rawQuery, generationQuery, plan));
  }

  if (body.compareWith && !isSupportedQuery(generationQuery)) {
    return NextResponse.json(unsupportedResponse(rawQuery, query, plan));
  }

  let generated: Awaited<ReturnType<typeof generateSpec>>;
  try {
    generated = await generateSpec(generationQuery);
  } catch {
    return sourceUnavailableResponse();
  }
  const { spec, mocked } = generated;
  const merged = body.compareWith ? mergeComparison(body.compareWith, spec) : spec;
  const enriched = await withReferenceContext(normalizeSpec(merged), rawQuery, plan);

  return NextResponse.json({
    spec: enriched,
    cached: false,
    mocked,
    latencyMs: Date.now() - startedAt,
    chartPlan: publicPlan(plan),
    answerability: answerabilityForPlan({ query: rawQuery, plan, spec: enriched })
  });
}

async function withReferenceContext(spec: ChartSpec, query: string, plan: ChartPlan) {
  const referenceContext = await grokipediaContextForChart({ query, plan, spec });
  return referenceContext ? { ...spec, referenceContext } : spec;
}

async function generateSpec(query: string): Promise<{ spec: ChartSpec; mocked: boolean }> {
  const liveSpec = await liveSpecForQuery(query);
  if (liveSpec) return { spec: liveSpec, mocked: false };

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("No supported live source matched this query");
  }

  try {
    return { spec: await generateChartWithClaude(query), mocked: false };
  } catch {
    throw new Error("No supported chart could be generated for this query");
  }
}

function unsupportedResponse(
  originalQuery: string,
  routedQuery: string,
  plan?: ChartPlan
): UnsupportedQueryResponse {
  return {
    unsupported: true,
    query: originalQuery,
    message:
      "Shape Of It does not have a reliable source mapped for that question yet.",
    supportedPrompts: nearbySupportedPrompts(routedQuery),
    answerability: plan
      ? answerabilityForPlan({ query: originalQuery, plan })
      : undefined
  };
}

function partialUnsupportedResponse(
  originalQuery: string,
  plan: Extract<ChartPlan, { kind: "partial_unsupported" }>
): UnsupportedQueryResponse {
  const planned = plan.plannedMatches.map((match) => match.label);
  const missing = plan.missingQueries.join(", ");
  const supported = plan.supportedQueries.length
    ? ` The mapped part is: ${plan.supportedQueries.join(", ")}.`
    : "";
  const plannedText = planned.length
    ? ` Planned source needed: ${planned.join(", ")}.`
    : "";

  return {
    unsupported: true,
    query: originalQuery,
    message:
      `Shape Of It can tell this is a comparison, but it does not have every required source mapped yet. Missing: ${missing}.${supported}${plannedText}`,
    supportedPrompts: nearbySupportedPrompts(originalQuery),
    answerability: answerabilityForPlan({ query: originalQuery, plan })
  };
}

function sourceUnavailableResponse() {
  return NextResponse.json(
    {
      error: "source_unavailable",
      message: "The mapped data source could not be reached. Try again in a moment."
    },
    { status: 503 }
  );
}

function publicPlan(plan: ChartPlan) {
  if (plan.kind === "source") {
    return {
      kind: plan.kind,
      intent: plan.intent,
      confidence: plan.confidence,
      sourceId: plan.entry.id
    };
  }

  return plan;
}
