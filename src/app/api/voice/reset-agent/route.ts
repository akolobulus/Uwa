import { NextResponse } from "next/server";

/**
 * POST /api/voice/reset-agent
 *
 * TEMPORARY: Deletes old Evans agent(s) so a fresh one can be created with the ngrok URL.
 * Call this ONCE, then delete this file.
 *
 * Why: The old agent was created with localhost webhook URL.
 * Aethex cannot reach localhost to register tool webhooks, so we delete it and
 * let the session route create a fresh one with the ngrok URL.
 */
export async function POST() {
  const apiKey = process.env.AETHEX_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AETHEX_API_KEY is not set" }, { status: 500 });
  }

  const BASE = "https://api.aethexai.com";
  const AGENT_NAME = "Tolu — Nurture Voice Core";

  try {
    // List all agents
    const listRes = await fetch(`${BASE}/api/v1/agents?limit=100`, {
      headers: { "X-API-Key": apiKey },
    });

    if (!listRes.ok) {
      return NextResponse.json({ error: "Failed to list agents" }, { status: 502 });
    }

    const page = await listRes.json() as { data?: Array<{ id: string; name: string }> };
    const agents = page.data ?? [];

    // Find and delete any agent named "Tolu — Nurture Voice Core"
    const deleted: string[] = [];
    for (const agent of agents) {
      if (agent.name === AGENT_NAME) {
        try {
          const delRes = await fetch(`${BASE}/api/v1/agents/${agent.id}`, {
            method: "DELETE",
            headers: { "X-API-Key": apiKey },
          });

          if (delRes.ok) {
            deleted.push(agent.id);
            console.log(`[Tolu Reset] Deleted agent ${agent.id} (${AGENT_NAME})`);
          }
        } catch (err) {
          console.error(`[Tolu Reset] Failed to delete agent ${agent.id}:`, err);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Deleted ${deleted.length} old Tolu agent(s). On next 'Activate Tolu' click, a fresh agent will be created with the ngrok URL.`,
      deleted_ids: deleted,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
