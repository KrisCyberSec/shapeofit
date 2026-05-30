import { NextRequest, NextResponse } from "next/server";
import { immigrationSpecForQuery } from "@/lib/immigration-data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const query =
    req.nextUrl.searchParams.get("q")?.trim() ??
    "how many immigrants have come to the United States in the past 20 years";

  try {
    const spec = await immigrationSpecForQuery(query);
    return NextResponse.json({ spec });
  } catch {
    return NextResponse.json(
      {
        error: "live_immigration_unavailable",
        message: "Live DHS immigration data is unavailable right now."
      },
      { status: 502 }
    );
  }
}
