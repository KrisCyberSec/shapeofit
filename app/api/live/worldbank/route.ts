import { NextRequest, NextResponse } from "next/server";
import { getWorldBankSpec, worldBankSpecForQuery } from "@/lib/world-bank-data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const query = searchParams.get("q")?.trim();
  const metric = searchParams.get("metric")?.trim();
  const startYear = Number(searchParams.get("start") ?? 1960);
  const endYear = searchParams.get("end") ? Number(searchParams.get("end")) : undefined;

  try {
    const spec = query
      ? await worldBankSpecForQuery(query)
      : metric
        ? await getWorldBankSpec(metric, {
            startYear: Number.isFinite(startYear) ? startYear : 1960,
            endYear: Number.isFinite(endYear) ? endYear : undefined
          })
        : null;

    if (!spec) {
      return NextResponse.json(
        {
          error: "unsupported_worldbank_query",
          message:
            "Try world population, life expectancy US vs Japan, urban population, or largest countries by population."
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ spec });
  } catch {
    return NextResponse.json(
      {
        error: "live_worldbank_unavailable",
        message: "Live World Bank data is unavailable right now."
      },
      { status: 502 }
    );
  }
}
