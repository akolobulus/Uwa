import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ sid: string }>;
};

/**
 * POST /api/mother/voice/session/[sid]/offer
 *
 * Relays the browser's SDP offer to Aethex and returns the server SDP answer.
 * Completely independent from /api/voice/session/[sid]/offer (Tolu).
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { sid: sessionId } = await context.params;

    const apiKey = process.env.AETHEX_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AETHEX_API_KEY is not configured" }, { status: 500 });
    }

    let sdp: string, type: string;
    try {
      const body = await req.json();
      sdp = body.sdp;
      type = body.type;
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const res = await fetch(
      `https://api.aethexai.com/api/v1/conversation/${sessionId}/offer`,
      {
        method: "POST",
        headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ sdp, type }),
        signal: AbortSignal.timeout(12_000),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      console.error(`[NurtureAI Offer] Aethex rejected SDP (${res.status}):`, body);
      return NextResponse.json(
        { error: `SDP exchange failed: ${res.status}` },
        { status: 502 }
      );
    }

    const answer = await res.json();
    return NextResponse.json(answer);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[NurtureAI Offer] Exception:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
