import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ sid: string }>;
};

/**
 * POST /api/voice/session/[sid]/offer
 *
 * Relays the browser's SDP offer to Aethex and returns the server's SDP answer.
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    console.log("[Offer Route] POST /api/voice/session/[sid]/offer called");

    const { sid: sessionId } = await context.params;
    console.log(`[Offer Route] Extracted sessionId: ${sessionId}`);

    let sdp: string;
    let type: string;
    try {
      const body = await req.json();
      sdp = body.sdp;
      type = body.type;
      console.log(`[Offer Route] Parsed SDP type: ${type}`);
    } catch (parseErr) {
      console.error("[Offer Route] Failed to parse request JSON:", parseErr);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    if (!process.env.AETHEX_API_KEY) {
      console.error("[Offer Route] AETHEX_API_KEY is not defined");
      return NextResponse.json(
        { error: "AETHEX_API_KEY is not defined" },
        { status: 500 }
      );
    }

    console.log("[Offer Route] Sending offer to Aethex...");
    const res = await fetch(
      `https://api.aethexai.com/api/v1/conversation/${sessionId}/offer`,
      {
        method: "POST",
        headers: {
          "X-API-Key": process.env.AETHEX_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sdp, type }),
        signal: AbortSignal.timeout(12_000),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      console.error(
        `[Offer Route] Aethex SDP exchange rejected ${res.status}:`,
        body
      );
      return NextResponse.json(
        {
          error: `Aethex SDP exchange rejected: ${res.status} — ${body}`,
        },
        { status: 502 }
      );
    }

    console.log("[Offer Route] Successfully received SDP answer from Aethex");
    const answer = await res.json();
    return NextResponse.json(answer);
  } catch (err: any) {
    console.error("[Offer Endpoint Framework Exception]:", err);
    return NextResponse.json(
      {
        error: err.message || "Internal Framework Error",
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}

