import { NextRequest, NextResponse } from "next/server";
import { getTreasuryDebtSpec } from "@/lib/live-data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 30);

  try {
    const spec = await getTreasuryDebtSpec(limit);
    return NextResponse.json({ spec });
  } catch {
    return NextResponse.json(
      { error: "live_money_unavailable", message: "Live Treasury data is unavailable right now." },
      { status: 502 }
    );
  }
}
