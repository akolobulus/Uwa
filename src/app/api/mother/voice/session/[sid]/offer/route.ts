import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ sid: string }>;
};

const BASE = "https://api.aethexai.com";

export async function POST(req: NextRequest, context: RouteContext) {
  console.log("[Mother Offer Route] POST /api/mother/voice/session/[sid]/offer called");

  const apiKey = process.env.AETHEX_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AETHEX_API_KEY not configured" }, { status: 500 });
  }

  const { sid: sessionId } = await context.params;
  console.log("[Mother Offer Route] Extracted sessionId:", sessionId);

  let sdp: string;
  let type: string;
  try {
    const body = await req.json();
    sdp = body.sdp;
    type = body.type;
    console.log("[Mother Offer Route] Parsed SDP type:", type);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  console.log("[Mother Offer Route] Sending offer to Aethex...");

  const aethexRes = await fetch(
    `${BASE}/api/v1/conversation/${sessionId}/offer`,
    {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sdp, type }),
      signal: AbortSignal.timeout(12_000),
    }
  );

  if (!aethexRes.ok) {
    const errText = await aethexRes.text();
    console.error(`[Mother Offer Route] Aethex error (${aethexRes.status}):`, errText);
    return NextResponse.json(
      { error: `Aethex offer failed: ${aethexRes.status} — ${errText}` },
      { status: 502 }
    );
  }

  const answer = await aethexRes.json();
  console.log("[Mother Offer Route] Successfully received SDP answer from Aethex");
  return NextResponse.json(answer);
}
