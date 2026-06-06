import { NextRequest, NextResponse } from "next/server";

/**
 * GET  /api/voice/ui-events?session_id=xxx
 *      Returns the oldest pending UI event for this session (if any).
 *
 * POST /api/voice/ui-events
 *      Called internally by agent-tools to enqueue a UI event.
 *
 * Events are stored in memory (per-process). For multi-instance deployments,
 * replace with a Redis list or Supabase realtime channel.
 */

type UIEvent = {
  type: string;
  [key: string]: unknown;
};

// In-memory store: session_id → queue of pending events
const eventQueues = new Map<string, UIEvent[]>();

// Clean up sessions older than 1 hour
setInterval(() => {
  eventQueues.clear();
}, 60 * 60 * 1000);

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ event: null });
  }

  const queue = eventQueues.get(sessionId);
  if (!queue || queue.length === 0) {
    return NextResponse.json({ event: null });
  }

  const event = queue.shift(); // dequeue oldest
  if (queue.length === 0) {
    eventQueues.delete(sessionId);
  }

  return NextResponse.json({ event });
}

export async function POST(req: NextRequest) {
  const { session_id, event } = await req.json();

  if (!session_id || !event) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!eventQueues.has(session_id)) {
    eventQueues.set(session_id, []);
  }
  eventQueues.get(session_id)!.push(event);

  return NextResponse.json({ ok: true });
}

/**
 * Utility: enqueue a UI event from a server-side tool handler.
 * Import and call this from agent-tools/route.ts after a tool completes.
 */
export function enqueueUIEvent(sessionId: string, event: UIEvent) {
  if (!eventQueues.has(sessionId)) {
    eventQueues.set(sessionId, []);
  }
  eventQueues.get(sessionId)!.push(event);
}
