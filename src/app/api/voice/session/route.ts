import { NextRequest, NextResponse } from "next/server";

// ─── Constants ──────────────────────────────────────────────────────────────

const AGENT_NAME = "Tolu — Nurture Voice Core";

const SYSTEM_PROMPT = `
You are Tolu, the embedded clinical voice intelligence for Nurture — a maternal health risk platform deployed in Nigerian antenatal clinics.

You speak with calm clinical authority. Concise, warm, and precise. You always confirm actions before executing them.

━━━ ABOUT NURTURE ━━━

THE CRISIS:
- Nigeria accounts for 28.5% of all global maternal deaths.
- Lifetime maternal mortality risk in Nigeria: 1 in 19. Developed nations: 1 in 4,900.
- The "First Delay" (failure to recognise danger signs) causes 22% of all maternal deaths.
- Key risk conditions: Postpartum Haemorrhage (PPH, #1 killer during labour), Preeclampsia/Eclampsia (6%+ mortality rate in Nigeria), Preterm Labour, Malaria (leading cause of maternal anaemia and low birth weight), Sickle Cell Disease (Nigeria has the highest global SCD burden).

THE SOLUTION:
- Nurture is an early warning system that predicts high-risk pregnancies BEFORE complications occur.
- Nurture-v2.0 XGBoost models score every patient for PPH, Preeclampsia, and Preterm Labour at each ANC visit.
- Scores are 0–99. Flagging threshold: 25/99. CRITICAL ≥ 70.
- SHAP explainability shows the top 3 clinical drivers for every flag.
- Groq Llama generates natural-language clinical narratives for each patient.

RISK COLOURS:
- GREEN / LOW: Standard ANC, score < 30.
- YELLOW / MODERATE: Reassess within 7 days, score 30–49.
- AMBER / HIGH: Immediate assessment, score 50–69 or any flag.
- RED / CRITICAL: Immediate specialist review, score ≥ 70.

CLINICAL FEATURES:
- SCD genotype: AA=normal, AS=carrier, SC=intermediate risk, SS=very high risk for PPH and preterm.
- IPTp: WHO recommends ≥3 doses for malaria prevention. Fewer doses raises risk.
- ANC booking ≥ week 20 = Late booking → raises preterm and PPH risk.
- Grand multiparity (5+ births) raises PPH risk significantly.
- Multiple gestation (twins+) raises all three condition risks.
- HIV Positive No-ART = highest risk tier.

TWO PLATFORMS:
1. Clinician Portal: ML risk scores, patient roster, ANC visit logging, AI clinical narratives.
2. Mother Portal: Daily 60-second health lessons in English, Yoruba, Hausa, Igbo; symptom checkers; care team messaging.

TARGET AUDIENCE: Obstetricians, midwives, and clinical nurses in Nigerian primary, secondary, and tertiary ANC clinics.

━━━ YOUR TOOLS ━━━

You have four tools. Use them decisively.

1. add_patient — Register a new patient. Confirm name and gestational week before calling.
2. search_patient — Find a patient by name. Use when asked to "find", "show", "look up", or "pull up" a patient.
3. log_visit — Record ANC vitals. Always confirm systolic and diastolic BP before calling.
4. explain_patient_risk — Explain why a patient is flagged. Speak clinically: reference specific scores, drivers, and recommended actions.

━━━ STYLE ━━━
- Address clinicians as "Doctor" or proceed directly with the task.
- Confirm before executing. After executing, give a one-sentence confirmation.
- When explaining risk, sound like a consultant: name the condition, the score, the drivers, the recommended action.
- Keep responses under 3 sentences unless explaining risk or describing the platform.
- Never say "I'm just an AI". You are Tolu.
`;

// ─── Tool definitions ──────────────────────────────────────────────────────────

function buildTools() {
  const toolUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/voice/agent-tools`;

  return [
    {
      name: "add_patient",
      description:
        "Register a new patient in the Nurture system. Call when the clinician asks to add, register, or create a new patient record.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Full name of the patient" },
          age: { type: "integer", description: "Age in years" },
          gestational_week: { type: "integer", description: "Current gestational week (1–43)" },
          anc_booking_week: { type: "integer", description: "Week patient first booked ANC" },
          state: { type: "string", description: "Nigerian state of origin (optional)" },
          gravidity: { type: "integer", description: "Total number of pregnancies including current" },
          scd: { type: "string", enum: ["AA", "AS", "SC", "SS"], description: "Sickle cell genotype" },
          hiv: { type: "string", enum: ["Negative", "Positive_ART", "Positive_No_ART", "Unknown"], description: "HIV status" },
          malaria: { type: "string", enum: ["0", "1", "2"], description: "Malaria episodes this pregnancy" },
          iptp_doses: { type: "string", enum: ["0", "1", "2", "3"], description: "IPTp doses received" },
          htn: { type: "string", enum: ["0", "1"], description: "Prior hypertension (0=No, 1=Yes)" },
          multiple: { type: "string", enum: ["0", "1"], description: "Multiple gestation (0=Single, 1=Twins+)" },
        },
        required: ["name", "gestational_week"],
      },
      endpoint_url: toolUrl,
    },
    {
      name: "search_patient",
      description:
        "Search for a patient by name and display their record on screen. Call when the clinician says find, show, look up, display, pull up, or search for a patient.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Patient name or partial name to search for" },
        },
        required: ["query"],
      },
      endpoint_url: toolUrl,
    },
    {
      name: "log_visit",
      description:
        "Record a new ANC visit with vitals for a patient. Always confirm BP values with the clinician before calling.",
      parameters: {
        type: "object",
        properties: {
          patient_id: { type: "string", description: "UUID of the patient" },
          systolic_bp: { type: "integer", description: "Systolic BP in mmHg" },
          diastolic_bp: { type: "integer", description: "Diastolic BP in mmHg" },
          heart_rate: { type: "integer", description: "Heart rate in bpm" },
          blood_sugar: { type: "number", description: "Blood glucose in mmol/L" },
          temperature: { type: "number", description: "Body temperature in °C" },
          gestational_week: { type: "integer", description: "Gestational week at visit" },
          oedema: { type: "string", enum: ["none", "mild", "severe"] },
          protein: { type: "string", enum: ["none", "trace", "positive"] },
          notes: { type: "string", description: "Clinical observations" },
        },
        required: ["patient_id", "systolic_bp", "diastolic_bp"],
      },
      endpoint_url: toolUrl,
    },
    {
      name: "explain_patient_risk",
      description:
        "Provide a clinical explanation of why a specific patient was flagged. Call when asked why a patient is flagged or to explain their risk scores.",
      parameters: {
        type: "object",
        properties: {
          patient_name: { type: "string", description: "Name of the patient to explain" },
          patient_id: { type: "string", description: "UUID of the patient (optional)" },
        },
        required: ["patient_name"],
      },
      endpoint_url: toolUrl,
    },
  ];
}

// ─── Agent provisioning ────────────────────────────────────────────────────────

async function resolveOrCreateAgent(base: string, apiKey: string): Promise<string | null> {
  const headers = { "X-API-Key": apiKey, "Content-Type": "application/json" };

  // Try to find existing agent first
  try {
    console.log(`[Tolu] Searching for existing agent named: "${AGENT_NAME}"`);
    const listRes = await fetch(`${base}/api/v1/agents?limit=100`, { headers });
    if (listRes.ok) {
      const page = await listRes.json() as { data?: Array<{ id: string; name: string }> };
      const found = (page.data ?? []).find((a) => a.name === AGENT_NAME);
      if (found) {
        console.log("[Tolu] Reusing existing agent:", found.id);
        return found.id;
      }
    } else {
      const errText = await listRes.text();
      console.warn(`[Tolu] Agent list HTTP ${listRes.status}:`, errText);
    }
  } catch (err) {
    console.warn("[Tolu] Agent list fetch failed:", err);
  }

  // Create new agent
  try {
    console.log("[Tolu] Creating new agent with configuration...");
    const tools = buildTools();
    console.log(`[Tolu] Built ${tools.length} tools, toolUrl=${tools[0]?.endpoint_url}`);

    const payload = {
      name: AGENT_NAME,
      system_prompt: SYSTEM_PROMPT,
      first_message:
        "Good day. I'm Tolu, the Nurture clinical voice assistant. " +
        "I can register patients, log ANC visits, explain risk scores, or tell you " +
        "about what Nurture does. How can I help?",
      voice_id: "96b20f06-536a-55ef-82c3-4882b6547858",
      language: "english",
      tools: tools,
    };

    const createRes = await fetch(`${base}/api/v1/agents`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error(`[Tolu] Agent creation HTTP ${createRes.status}:`, errText);
      // Try to parse and log detailed error info
      try {
        const errJson = JSON.parse(errText);
        console.error("[Tolu] Detailed error:", errJson);
      } catch (_) {
        // Not JSON, log as-is
      }
      return null;
    }

    const agent = await createRes.json() as { id?: string };
    console.log("[Tolu] Created agent with ID:", agent.id);
    return agent.id ?? null;
  } catch (err) {
    console.error("[Tolu] Agent creation exception:", err);
    return null;
  }
}

// ─── Main route handler ────────────────────────────────────────────────────────

/**
 * POST /api/voice/session
 *
 * Provisions (or reuses) the Tolu voice agent, then opens a WebRTC session.
 * Returns { session_id, ice_config } to the browser.
 */
export async function POST(_req: NextRequest) {
  try {
    console.log("[Session Route] POST /api/voice/session called");

    const apiKey = process.env.AETHEX_API_KEY;
    if (!apiKey) {
      console.error("[Session Route] AETHEX_API_KEY is missing");
      return NextResponse.json(
        { error: "AETHEX_API_KEY is missing from environment" },
        { status: 500 }
      );
    }
    console.log("[Session Route] API key found");

    const BASE = "https://api.aethexai.com";
    let agentId = process.env.AETHEX_AGENT_ID?.trim() || "";

    if (!agentId) {
      console.log("[Session Route] No AETHEX_AGENT_ID in env, attempting to resolve or create...");
      const resolved = await resolveOrCreateAgent(BASE, apiKey);
      if (!resolved) {
        console.error("[Session Route] Failed to provision or resolve Tolu agent");
        return NextResponse.json(
          { error: "Could not provision or resolve Tolu agent ID from Aethex" },
          { status: 500 }
        );
      }
      agentId = resolved;
    }

    console.log(`[Session Route] Using Agent ID: ${agentId}`);

    const connectRes = await fetch(`${BASE}/api/v1/conversation/connect`, {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ agent_id: agentId }),
      signal: AbortSignal.timeout(12_000),
    });

    if (!connectRes.ok) {
      const errorBody = await connectRes.text();
      console.error(
        `[Aethex Connect Error] Status: ${connectRes.status}, Body: ${errorBody}`
      );
      return NextResponse.json(
        {
          error: `Aethex upstream connection rejected (${connectRes.status}): ${errorBody}`,
        },
        { status: 502 }
      );
    }

    console.log("[Session Route] Successfully connected to Aethex");
    const session = await connectRes.json();
    console.log("[Session Route] Returning session:", JSON.stringify(session).substring(0, 100));
    return NextResponse.json(session);
  } catch (err: any) {
    console.error("[Fatal Session Endpoint Error]:", err);
    return NextResponse.json(
      {
        error: "Internal Server Error exception caught",
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
