import { NextRequest, NextResponse } from "next/server";
import { getCryptoPriceSpec, liveSpecForQuery } from "@/lib/live-data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const days = Number(searchParams.get("days") ?? 30);
  const coins = searchParams
    .get("coins")
    ?.split(",")
    .map((coin) => coin.trim().toLowerCase())
    .filter(Boolean);

  try {
    const spec = coins?.length
      ? await liveSpecForQuery(`${coins.join(" ")} over the last ${days} days`)
      : await getCryptoPriceSpec(undefined, days);

    if (!spec) throw new Error("No matching live crypto spec");

    return NextResponse.json({ spec });
  } catch {
    return NextResponse.json(
      { error: "live_crypto_unavailable", message: "Live crypto data is unavailable right now." },
      { status: 502 }
    );
  }
}
