import { NextResponse } from "next/server";
import type { DataCatalogEntry } from "@/lib/data-catalog";
import { rankCatalogMatches } from "@/lib/query-intelligence";
import { sourceRegistrySummary } from "@/lib/source-registry";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const query = new URL(req.url).searchParams.get("q")?.trim();
  const summary = sourceRegistrySummary();

  return NextResponse.json({
    sources: summary.providers,
    series: query
      ? rankCatalogMatches(query, { status: "all", limit: 8 }).map((match) => ({
          ...publicCatalogEntry(match.entry),
          match: {
            confidence: match.confidence,
            reasons: match.reasons
          }
        }))
      : summary.series,
    query: query || undefined
  });
}

function publicCatalogEntry({ patterns: _patterns, ...entry }: DataCatalogEntry) {
  return entry;
}
