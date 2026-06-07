import { NextRequest, NextResponse } from "next/server";

// ─── Constants ─────────────────────────────────────────────────────────────────
// IMPORTANT: This agent name is intentionally different from "Tolu — Nurture Voice Core"
// so it never collides with the clinician agent.

const AGENT_NAME = "Nurture AI — Mother Voice";

const SYSTEM_PROMPT = `
You are Nurture AI, a warm, compassionate maternal health companion built specifically for pregnant women and new mothers in Nigeria.

You speak gently, patiently, and clearly. Use simple, reassuring language — avoid medical jargon unless you explain it. You may mix in Pidgin English or common Nigerian phrases to feel natural and welcoming.

━━━ YOUR PURPOSE ━━━

You help mothers with:
1. Describing and understanding their symptoms
2. Learning about their pregnancy and baby's development
3. Checking when their next appointment is
4. Getting connected to their doctor when needed
5. Requesting emergency help (ambulance) when urgently needed
6. General maternal health questions — feeding, nutrition, signs to watch for

━━━ HOW YOU WORK ━━━

When a mother describes symptoms:
- Listen fully and ask one clarifying question at a time
- Assess severity: LOW (normal pregnancy discomfort), MODERATE (needs attention soon), HIGH (see a doctor today), CRITICAL (emergency — call ambulance or doctor now)
- Always log the symptoms using the log_symptoms tool
- Give clear, actionable next steps
- Never diagnose — always say "this could be..." not "you have..."

Severity guide:
CRITICAL (act immediately):
- Heavy vaginal bleeding, severe abdominal pain, loss of consciousness, seizures, baby not moving for many hours, severe headache with blurred vision, difficulty breathing

HIGH (see doctor today):
- Fever above 38°C, persistent vomiting, swelling of face/hands, reduced baby movement, signs of infection, BP symptoms

MODERATE (call clinic soon):
- Mild headaches, back pain, constipation, heartburn, mild swelling of feet, tiredness, anxiety

LOW (normal, reassure):
- Braxton Hicks, mild nausea, frequent urination, food cravings, light fatigue

━━━ YOUR TOOLS ━━━

1. log_symptoms — ALWAYS call this when a mother describes how she feels. Pass what she said and your severity assessment.
2. get_appointment — Call when she asks about her next appointment, clinic date, or visit schedule.
3. call_doctor — Call when symptoms are HIGH severity OR she explicitly asks to speak to or contact a doctor.
4. request_ambulance — Call ONLY for CRITICAL symptoms. Always confirm location before calling.

━━━ STYLE RULES ━━━

- Address the mother as "mama" or by name if you know it — never "user" or "patient"
- Be warm: "Don't worry, mama, let's figure this out together"
- After logging symptoms, always say what you did: "I've noted your symptoms..."
- For CRITICAL situations: be calm but urgent — don't cause panic, but be very clear action is needed
- Keep responses short — 2-3 sentences unless explaining something important
- Always end with: what the mother should do next, clearly stated
- You are NOT a replacement for a doctor. Always make this clear for medical questions.
`;

// ─── Tool definitions ──────────────────────────────────────────────────────────

function buildTools(appUrl: string) {
  const toolUrl = `${appUrl}/api/mother/voice/agent-tools`;

  return [
    {
      name: "log_symptoms",
      description:
        "Log the mother's symptoms and your severity assessment. ALWAYS call this when a mother describes how she is feeling, any pain, discomfort, or health concern.",
      parameters: {
        type: "object",
        properties: {
          patient_id: {
            type: "string",
            description: "The mother's patient UUID (from auth context if available)",
          },
          raw_input: {
            type: "string",
            description: "Exact words the mother used to describe her symptoms",
          },
          symptoms: {
            type: "array",
            items: { type: "string" },
            description: "List of individual symptoms extracted from what she said",
          },
          severity: {
            type: "string",
            enum: ["low", "moderate", "high", "critical"],
            description: "Your assessment of how urgent this is",
          },
          ai_analysis: {
            type: "string",
            description: "Your brief clinical assessment of what the symptoms may indicate",
          },
        },
        required: ["raw_input", "symptoms", "severity", "ai_analysis"],
      },
      endpoint_url: toolUrl,
    },
    {
      name: "get_appointment",
      description:
        "Retrieve the mother's next scheduled appointment. Call when she asks about her next visit, clinic date, appointment, or when she should come in.",
      parameters: {
        type: "object",
        properties: {
          patient_id: {
            type: "string",
            description: "The mother's patient UUID",
          },
        },
        required: ["patient_id"],
      },
      endpoint_url: toolUrl,
    },
    {
      name: "call_doctor",
      description:
        "Notify the on-duty doctor about this mother and her symptoms. Call when symptoms are HIGH severity or the mother asks to speak to a doctor or get medical help.",
      parameters: {
        type: "object",
        properties: {
          patient_id: {
            type: "string",
            description: "The mother's patient UUID",
          },
          patient_name: {
            type: "string",
            description: "The mother's name",
          },
          symptoms_summary: {
            type: "string",
            description: "Brief summary of what the mother reported",
          },
          severity: {
            type: "string",
            enum: ["moderate", "high", "critical"],
          },
        },
        required: ["patient_name", "symptoms_summary", "severity"],
      },
      endpoint_url: toolUrl,
    },
    {
      name: "request_ambulance",
      description:
        "Request an emergency ambulance for the mother. ONLY call for CRITICAL symptoms — heavy bleeding, seizures, loss of consciousness, severe chest pain, no fetal movement for hours. Always confirm location with the mother first.",
      parameters: {
        type: "object",
        properties: {
          patient_id: {
            type: "string",
            description: "The mother's patient UUID",
          },
          patient_name: {
            type: "string",
            description: "The mother's name",
          },
          address: {
            type: "string",
            description: "Mother's current address or location description",
          },
          latitude: {
            type: "number",
            description: "GPS latitude if available",
          },
          longitude: {
            type: "number",
            description: "GPS longitude if available",
          },
          symptoms: {
            type: "string",
            description: "Emergency symptoms to relay to the ambulance team",
          },
        },
        required: ["patient_name", "address", "symptoms"],
      },
      endpoint_url: toolUrl,
    },
  ];
}

// ─── Agent provisioning ─────────────────────────────────────────────────────────

async function resolveOrCreateAgent(base: string, apiKey: string, appUrl: string): Promise<string | null> {
  const headers = { "X-API-Key": apiKey, "Content-Type": "application/json" };

  // Try to find existing agent
  try {
    const listRes = await fetch(`${base}/api/v1/agents?limit=100`, { headers });
    if (listRes.ok) {
      const page = await listRes.json() as { data?: Array<{ id: string; name: string }> };
      const found = (page.data ?? []).find((a) => a.name === AGENT_NAME);
      if (found) {
        console.log("[NurtureAI] Reusing existing agent:", found.id);
        return found.id;
      }
    }
  } catch (err) {
    console.warn("[NurtureAI] Agent list failed:", err);
  }

  // Create new agent
  try {
    const tools = buildTools(appUrl);
    const payload = {
      name: AGENT_NAME,
      system_prompt: SYSTEM_PROMPT,
      first_message:
        "Hello mama, welcome to Nurture AI. I'm here to support you through your pregnancy journey. " +
        "You can tell me how you're feeling, ask about your appointment, or ask me any question about your health or your baby. " +
        "How are you doing today?",
      // Using a warm, gentle female voice
      voice_id: "96b20f06-536a-55ef-82c3-4882b6547858",
      language: "english",
      tools,
    };

    const createRes = await fetch(`${base}/api/v1/agents`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      console.error(`[NurtureAI] Agent creation failed (${createRes.status}):`, err);
      return null;
    }

    const agent = await createRes.json() as { id?: string };
    console.log("[NurtureAI] Created agent:", agent.id);
    return agent.id ?? null;
  } catch (err) {
    console.error("[NurtureAI] Agent creation exception:", err);
    return null;
  }
}

// ─── Route handler ──────────────────────────────────────────────────────────────

/**
 * POST /api/mother/voice/session
 *
 * Creates or reuses the Nurture AI mother-side voice agent (100% independent
 * from the Tolu clinician agent — different name, different tools, different prompt).
 * Returns { session_id, ice_config } to the browser.
 */
export async function POST(_req: NextRequest) {
  try {
    const apiKey = process.env.AETHEX_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AETHEX_API_KEY is not configured" }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const BASE = "https://api.aethexai.com";

    // Use a separate env var so clinician and mother agents are truly independent
    let agentId = process.env.AETHEX_MOTHER_AGENT_ID?.trim() ?? "";

    if (!agentId) {
      const resolved = await resolveOrCreateAgent(BASE, apiKey, appUrl);
      if (!resolved) {
        return NextResponse.json(
          { error: "Could not provision Nurture AI mother agent" },
          { status: 500 }
        );
      }
      agentId = resolved;
    }

    // Open WebRTC session
    const connectRes = await fetch(`${BASE}/api/v1/conversation/connect`, {
      method: "POST",
      headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ agent_id: agentId }),
      signal: AbortSignal.timeout(12_000),
    });

    if (!connectRes.ok) {
      const body = await connectRes.text();
      console.error(`[NurtureAI] Connect failed (${connectRes.status}):`, body);
      return NextResponse.json(
        { error: `Aethex connection failed: ${connectRes.status}` },
        { status: 502 }
      );
    }

    const session = await connectRes.json();
    return NextResponse.json(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[NurtureAI] Session error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
