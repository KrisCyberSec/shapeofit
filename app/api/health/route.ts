export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    ok: true,
    service: "shapeofit",
    timestamp: new Date().toISOString()
  });
}
