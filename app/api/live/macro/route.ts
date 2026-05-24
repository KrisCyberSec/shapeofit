import { NextRequest, NextResponse } from "next/server";
import { getMacroSpec, macroSpecForQuery } from "@/lib/macro-data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const query = searchParams.get("q")?.trim();
  const metric = searchParams.get("metric")?.trim();
  const startYear = Number(searchParams.get("start") ?? 2015);
  const endYear = searchParams.get("end") ? Number(searchParams.get("end")) : undefined;

  try {
    const spec = query
      ? await macroSpecForQuery(query)
      : metric
        ? await getMacroSpec(metric, {
            startYear: Number.isFinite(startYear) ? startYear : 2015,
            endYear: Number.isFinite(endYear) ? endYear : undefined
          })
        : null;

    if (!spec) {
      return NextResponse.json(
        {
          error: "unsupported_macro_query",
          message: "Try inflation, mortgage rates, unemployment, fed funds, gas prices, wages, or home prices."
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ spec });
  } catch {
    return NextResponse.json(
      { error: "live_macro_unavailable", message: "Live FRED macro data is unavailable right now." },
      { status: 502 }
    );
  }
}
