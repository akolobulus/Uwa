import { NextRequest, NextResponse } from "next/server";

/**
 * GET  /api/mother/voice/ui-events?session_id=xxx
 *      Dequeues the oldest pending UI event for this mother session.
 *
 * POST /api/mother/voice/ui-events
 *      Enqueues a UI event (called by agent-tools).
 *
 * Fully independent from /api/voice/ui-events (Tolu clinician system).
 * In-memory per process — swap for Redis on multi-instance deployments.
 */

type UIEvent = {
  type: string;
  [key: string]: unknown;
};

// Separate map from the Tolu system — no cross-contamination
const motherEventQueues = new Map<string, UIEvent[]>();

// Hourly cleanup
setInterval(() => {
  motherEventQueues.clear();
}, 60 * 60 * 1000);

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ event: null });

  const queue = motherEventQueues.get(sessionId);
  if (!queue || queue.length === 0) return NextResponse.json({ event: null });

  const event = queue.shift();
  if (queue.length === 0) motherEventQueues.delete(sessionId);

  return NextResponse.json({ event });
}

export async function POST(req: NextRequest) {
  const { session_id, event } = await req.json();
  if (!session_id || !event) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!motherEventQueues.has(session_id)) {
    motherEventQueues.set(session_id, []);
  }
  motherEventQueues.get(session_id)!.push(event);

  return NextResponse.json({ ok: true });
}

/** Utility — call from agent-tools to push a UI event */
export function enqueueMotherUIEvent(sessionId: string, event: UIEvent) {
  if (!motherEventQueues.has(sessionId)) {
    motherEventQueues.set(sessionId, []);
  }
  motherEventQueues.get(sessionId)!.push(event);
}
