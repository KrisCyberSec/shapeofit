import { NextResponse } from "next/server";
import type { DataCatalogEntry } from "@/lib/data-catalog";
import { searchCatalog } from "@/lib/data-catalog";
import { sourceRegistrySummary } from "@/lib/source-registry";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const query = new URL(req.url).searchParams.get("q")?.trim();
  const summary = sourceRegistrySummary();

  return NextResponse.json({
    sources: summary.providers,
    series: query ? searchCatalog(query).map(publicCatalogEntry) : summary.series,
    query: query || undefined
  });
}

function publicCatalogEntry({ patterns: _patterns, ...entry }: DataCatalogEntry) {
  return entry;
}
