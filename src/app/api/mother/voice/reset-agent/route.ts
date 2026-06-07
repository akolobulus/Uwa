import { NextResponse } from "next/server";

/**
 * POST /api/mother/voice/reset-agent
 *
 * Deletes the "Nurture AI — Mother Voice" agent so it gets recreated with
 * fresh tool URLs on next session start. Use when you change the ngrok URL
 * or tool endpoint.
 *
 * Completely independent from /api/voice/reset-agent (Tolu clinician system).
 */
export async function POST() {
  const apiKey = process.env.AETHEX_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AETHEX_API_KEY is not set" }, { status: 500 });
  }

  const BASE = "https://api.aethexai.com";
  const AGENT_NAME = "Nurture AI — Mother Voice";

  try {
    const listRes = await fetch(`${BASE}/api/v1/agents?limit=100`, {
      headers: { "X-API-Key": apiKey },
    });

    if (!listRes.ok) {
      return NextResponse.json({ error: "Failed to list agents" }, { status: 502 });
    }

    const page = await listRes.json() as { data?: Array<{ id: string; name: string }> };
    const deleted: string[] = [];

    for (const agent of page.data ?? []) {
      if (agent.name === AGENT_NAME) {
        const delRes = await fetch(`${BASE}/api/v1/agents/${agent.id}`, {
          method: "DELETE",
          headers: { "X-API-Key": apiKey },
        });
        if (delRes.ok) {
          deleted.push(agent.id);
          console.log(`[NurtureAI Reset] Deleted agent ${agent.id}`);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Deleted ${deleted.length} Nurture AI mother agent(s). A fresh one will be created on next session.`,
      deleted_ids: deleted,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
