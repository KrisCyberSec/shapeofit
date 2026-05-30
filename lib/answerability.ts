import type {
  AnswerabilityReport,
  ChartSpec,
  ChartType,
  DataRequirement
} from "@/types/chart";
import type { ChartPlan } from "./chart-planner";
import {
  plannedCatalogEntryForQuery,
  resolveSupportedCatalogEntry,
  type DataCatalogEntry
} from "./data-catalog";
import { bestPlannedCatalogMatch, bestSupportedCatalogMatch } from "./query-intelligence";
import { routeQueryIntent } from "./query-router";

export function answerabilityForPlan({
  query,
  plan,
  spec
}: {
  query: string;
  plan: ChartPlan;
  spec?: ChartSpec;
}): AnswerabilityReport {
  const requirements = requirementsForPlan(query, plan, Boolean(spec));
  const availableCount = requirements.filter((item) => item.status === "available").length;
  const missingCount = requirements.filter((item) => item.status === "missing").length;
  const plannedCount = requirements.filter((item) => item.status === "planned").length;
  const approximateCount = requirements.filter((item) => item.status === "approximate").length;
  const reportStatus = spec
    ? approximateCount
      ? "approximate"
      : "chart_ready"
    : "needs_source";

  return {
    status: reportStatus,
    intent: intentLabel(plan),
    confidence: plan.confidence,
    summary: summaryForReport({
      plan,
      spec,
      availableCount,
      missingCount,
      plannedCount,
      approximateCount
    }),
    requirements,
    render: spec ? renderReadiness(spec) : undefined
  };
}

function requirementsForPlan(query: string, plan: ChartPlan, hasSpec: boolean): DataRequirement[] {
  if (plan.kind === "source") return [requirementForCatalogEntry(plan.entry, "available")];

  if (plan.kind === "comparison") {
    return plan.comparisonQueries.map((comparisonQuery) => requirementForQuery(comparisonQuery));
  }

  if (plan.kind === "derived") {
    return plan.sourceRequirements.map((label) => ({
      label,
      status: "available",
      note: plan.transform
    }));
  }

  if (plan.kind === "partial_unsupported") {
    const supported = plan.supportedQueries.map((supportedQuery) => requirementForQuery(supportedQuery));
    const missing = plan.missingQueries.map((missingQuery) => {
      const planned = plan.plannedMatches.find(
        (match) => normalize(match.query) === normalize(missingQuery)
      );
      if (planned) {
        return {
          label: planned.label,
          status: "planned" as const,
          sourceId: planned.sourceId,
          note: "The app understands this source need, but the adapter is not built yet."
        };
      }
      return requirementForQuery(missingQuery);
    });
    return [...supported, ...missing];
  }

  const planned = bestPlannedCatalogMatch(query)?.entry ?? plannedCatalogEntryForQuery(query);
  if (planned) return [requirementForCatalogEntry(planned, "planned")];

  const closestSupported = bestSupportedCatalogMatch(routeQueryIntent(query))?.entry;
  if (closestSupported && hasSpec) return [requirementForCatalogEntry(closestSupported, "available")];

  return [
    {
      label: query,
      status: "missing",
      note: "No cataloged source is mapped for this question yet."
    }
  ];
}

function requirementForQuery(query: string): DataRequirement {
  const routedQuery = routeQueryIntent(query);
  const supported =
    bestSupportedCatalogMatch(routedQuery)?.entry ?? resolveSupportedCatalogEntry(routedQuery);
  if (supported) return requirementForCatalogEntry(supported, "available");

  const planned = bestPlannedCatalogMatch(routedQuery)?.entry ?? plannedCatalogEntryForQuery(routedQuery);
  if (planned) return requirementForCatalogEntry(planned, "planned");

  return {
    label: query,
    status: "missing",
    note: "No cataloged source is mapped for this part of the question yet."
  };
}

function requirementForCatalogEntry(
  entry: DataCatalogEntry,
  status: DataRequirement["status"]
): DataRequirement {
  return {
    label: entry.label,
    status,
    providerLabel: entry.providerLabel,
    sourceId: entry.id,
    sourceUrl: entry.sourceUrl,
    unit: entry.unit,
    cadence: entry.cadence,
    transform: entry.transform,
    note: entry.limitations[0]
  };
}

function renderReadiness(spec: ChartSpec) {
  const dataPoints = spec.data.length;
  const seriesCount = spec.yKeys.length;
  const warnings: string[] = [];

  if (dataPoints < 3) warnings.push("Very few data points.");
  if (seriesCount > 3) warnings.push("Many series can reduce readability.");
  if (!spec.sourceUrl) warnings.push("Source URL is missing.");

  return {
    status: warnings.length ? ("limited" as const) : ("ready" as const),
    chartType: spec.chartType,
    xAxis: axisLabelForXKey(spec.xKey),
    yAxis: axisLabelForUnit(spec.unit),
    dataPoints,
    seriesCount,
    checks: [
      `${axisLabelForXKey(spec.xKey)} x-axis`,
      `${axisLabelForUnit(spec.unit)} y-axis`,
      `${dataPoints} data points`,
      `${seriesCount} ${seriesCount === 1 ? "series" : "series"}`,
      spec.sourceUrl ? "source URL" : "source note"
    ],
    warnings
  };
}

function summaryForReport({
  plan,
  spec,
  availableCount,
  missingCount,
  plannedCount,
  approximateCount
}: {
  plan: ChartPlan;
  spec?: ChartSpec;
  availableCount: number;
  missingCount: number;
  plannedCount: number;
  approximateCount: number;
}) {
  if (spec && approximateCount) {
    return "This can render, but at least one part is approximate rather than source-backed.";
  }
  if (spec) {
    return `Ready: ${availableCount} mapped ${availableCount === 1 ? "source" : "sources"} and a ${spec.chartType} render plan.`;
  }
  if (plannedCount || missingCount) {
    return `Not chart-ready: ${plannedCount + missingCount} required ${plannedCount + missingCount === 1 ? "source is" : "sources are"} not live yet.`;
  }
  if (plan.kind === "unsupported") return "No reliable source is mapped for this question yet.";
  return "The question is understood, but the data plan is incomplete.";
}

function intentLabel(plan: ChartPlan) {
  if (plan.kind === "source") return "single metric";
  if (plan.kind === "comparison" || plan.kind === "partial_unsupported") return "comparison";
  if (plan.kind === "derived") return "derived chart";
  return "unknown";
}

function axisLabelForXKey(xKey: string) {
  if (xKey === "date") return "Date";
  if (xKey === "year") return "Year";
  return labelize(xKey);
}

function axisLabelForUnit(unit: string) {
  if (unit === "$") return "Dollars";
  if (unit === "%") return "Percent";
  if (unit === "people") return "People";
  if (unit === "index") return "Index";
  if (unit === "years") return "Years";
  if (unit === "bn") return "Billions";
  if (unit === "trillion USD") return "Trillion USD";
  return unit ? labelize(unit) : "Value";
}

function labelize(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
