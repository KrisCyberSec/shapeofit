import type { DataCatalogEntry } from "./data-catalog";
import { plannedCatalogEntryForQuery, resolveSupportedCatalogEntry } from "./data-catalog";
import { bestPlannedCatalogMatch, bestSupportedCatalogMatch } from "./query-intelligence";
import { routeQueryIntent, splitAnyComparisonQuery, splitComparisonQuery } from "./query-router";

export type ChartPlan =
  | {
      kind: "derived";
      intent: "real_living_costs" | "housing_payment_pressure";
      confidence: number;
      query: string;
      canonicalQuery: string;
      transform: string;
      sourceRequirements: string[];
    }
  | {
      kind: "comparison";
      intent: "compare_metrics";
      confidence: number;
      query: string;
      comparisonQueries: [string, string];
    }
  | {
      kind: "partial_unsupported";
      intent: "compare_metrics";
      confidence: number;
      query: string;
      missingQueries: string[];
      supportedQueries: string[];
      plannedMatches: Array<{
        query: string;
        sourceId: string;
        label: string;
      }>;
    }
  | {
      kind: "source";
      intent: "single_metric";
      confidence: number;
      query: string;
      entry: DataCatalogEntry;
    }
  | {
      kind: "unsupported";
      intent: "unknown";
      confidence: number;
      query: string;
    };

export function planChartQuery(rawQuery: string): ChartPlan {
  const routedQuery = routeQueryIntent(rawQuery);
  const lower = rawQuery.toLowerCase();

  if (isLivingCostIntent(lower)) {
    return {
      kind: "derived",
      intent: "real_living_costs",
      confidence: lower.includes("inflation adjusted") || lower.includes("adjusted for inflation") ? 0.9 : 0.78,
      query: rawQuery,
      canonicalQuery: withDefaultWindow(routedQuery, "since 1971"),
      transform: "Deflate living-cost category indexes and wages by all-items CPI, then index to the first shared year.",
      sourceRequirements: [
        "FRED/BLS all-items CPI",
        "FRED/BLS shelter CPI",
        "FRED/BLS food CPI",
        "FRED/BLS energy CPI",
        "FRED/BLS medical care CPI",
        "FRED average hourly earnings"
      ]
    };
  }

  if (isHousingAffordabilityIntent(lower)) {
    return {
      kind: "derived",
      intent: "housing_payment_pressure",
      confidence: 0.84,
      query: rawQuery,
      canonicalQuery: withDefaultWindow(rawQuery, "since 2000"),
      transform: "Estimate mortgage-payment pressure from home prices and mortgage rates, then compare it with hourly wages.",
      sourceRequirements: [
        "FRED Case-Shiller national home price index",
        "FRED 30-year fixed mortgage rate",
        "FRED average hourly earnings"
      ]
    };
  }

  const comparisonQueries = splitComparisonQuery(rawQuery);
  if (comparisonQueries) {
    return {
      kind: "comparison",
      intent: "compare_metrics",
      confidence: 0.82,
      query: rawQuery,
      comparisonQueries: comparisonQueries.map(routeQueryIntent) as [string, string]
    };
  }

  const partialComparison = partialUnsupportedComparison(rawQuery);
  if (partialComparison) return partialComparison;

  const sourceMatch =
    bestSupportedCatalogMatch(routedQuery) ??
    bestSupportedCatalogMatch(rawQuery) ??
    entryMatch(resolveSupportedCatalogEntry(routedQuery));
  if (sourceMatch) {
    return {
      kind: "source",
      intent: "single_metric",
      confidence: Math.max(0.68, sourceMatch.confidence),
      query: routedQuery,
      entry: sourceMatch.entry
    };
  }

  return {
    kind: "unsupported",
    intent: "unknown",
    confidence: 0,
    query: routedQuery
  };
}

function partialUnsupportedComparison(rawQuery: string): ChartPlan | null {
  const routedQuery = routeQueryIntent(rawQuery);
  const wholeQueryEntry =
    bestSupportedCatalogMatch(routedQuery)?.entry ?? resolveSupportedCatalogEntry(routedQuery);
  if (
    wholeQueryEntry?.examples.some(
      (example) => normalizeForExactMatch(example) === normalizeForExactMatch(routedQuery)
    )
  ) {
    return null;
  }

  const comparison = splitAnyComparisonQuery(rawQuery);
  if (!comparison) return null;

  const sharedWindow = rawQuery.match(/\b(?:since|from)\s+(?:19|20)\d{2}(?:\s*(?:to|-)\s*(?:19|20)\d{2})?\b/i)?.[0] ?? "";
  const sides = comparison.map((side) => withDefaultWindow(routeQueryIntent(side), sharedWindow));
  const statuses = sides.map((side) => ({
    query: side,
    supported: Boolean(bestSupportedCatalogMatch(side) ?? resolveSupportedCatalogEntry(side)),
    planned: bestPlannedCatalogMatch(side)?.entry ?? plannedCatalogEntryForQuery(side)
  }));
  const missing = statuses.filter((status) => !status.supported);
  if (!missing.length) return null;

  return {
    kind: "partial_unsupported",
    intent: "compare_metrics",
    confidence: 0.74,
    query: rawQuery,
    missingQueries: missing.map((status) => status.query),
    supportedQueries: statuses
      .filter((status) => status.supported)
      .map((status) => status.query),
    plannedMatches: missing
      .map((status) => status.planned)
      .filter((entry): entry is DataCatalogEntry => Boolean(entry))
      .map((entry) => ({
        query: entry.examples[0] ?? entry.label,
        sourceId: entry.id,
        label: entry.label
      }))
  };
}

function isLivingCostIntent(lower: string) {
  const hasCostPhrase =
    lower.includes("cost of living") ||
    lower.includes("living cost") ||
    lower.includes("living costs") ||
    lower.includes("what got more expensive");
  const hasRealTerms =
    lower.includes("inflation adjusted") ||
    lower.includes("adjusted for inflation") ||
    lower.includes("real") ||
    lower.includes("after inflation");

  return hasCostPhrase && hasRealTerms;
}

function isHousingAffordabilityIntent(lower: string) {
  return (
    /\bhous(?:e|es|ing)\b.*\baffordable\b/i.test(lower) ||
    lower.includes("housing affordability") ||
    lower.includes("home affordability") ||
    lower.includes("home payment pressure")
  );
}

function withDefaultWindow(query: string, fallbackWindow: string) {
  if (!fallbackWindow || /\b(?:since|from)\s+(?:19|20)\d{2}/i.test(query)) return query;
  return `${query} ${fallbackWindow}`;
}

function normalizeForExactMatch(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function entryMatch(entry: DataCatalogEntry | null) {
  return entry ? { entry, confidence: 0.86 } : null;
}
