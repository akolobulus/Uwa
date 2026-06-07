import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getCencoriClient } from "@/lib/cencori";

/**
 * POST /api/mother/chat
 *
 * Powers the text-based Nurture AI chat interface for mothers.
 * Uses Cencori AI → Groq llama-3.3-70b-versatile (separate from Aethex voice).
 *
 * Request body:
 *   { messages: [{role, content}], patient_id?: string, session_id?: string }
 *
 * Returns:
 *   { reply: string, severity?: string, action?: string, ui_event?: object }
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SYSTEM_PROMPT = `You are Nurture AI, a warm and compassionate maternal health companion for pregnant women and new mothers in Nigeria.

RESPONSE FORMAT: Always respond with valid JSON in this exact shape:
{
  "reply": "your message to the mother (warm, clear, 2-4 sentences)",
  "severity": "low" | "moderate" | "high" | "critical",
  "detected_symptoms": ["symptom1", "symptom2"],
  "action": "none" | "advice" | "call_doctor" | "call_ambulance",
  "log_symptoms": true | false
}

SEVERITY RULES:
- critical: heavy bleeding, seizures, no fetal movement for hours, loss of consciousness, severe chest pain, difficulty breathing → action: call_ambulance
- high: fever, persistent vomiting, swollen face/hands, reduced baby movement, severe headache with vision changes → action: call_doctor
- moderate: mild headaches, back pain, heartburn, mild ankle swelling, anxiety, sleep issues → action: advice
- low: normal questions, general pregnancy info, nutrition, mild normal symptoms → action: none or advice

STYLE:
- Address her as "mama" or by name
- Be warm: "Don't worry, mama..." 
- Keep replies to 2-4 sentences max
- Never diagnose — say "this could be..." not "you have..."
- For critical/high: be calm but clear that action is needed
- For general questions: be informative and reassuring
- You can include Pidgin English naturally: "No worry yourself..."

TOPICS you handle: symptoms, pregnancy stages, baby development, nutrition, ANC visits, warning signs, emotional health, breastfeeding, postpartum care.`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, patient_id, session_id } = await req.json() as {
      messages: ChatMessage[];
      patient_id?: string;
      session_id?: string;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages array is required" }, { status: 400 });
    }

    // Call Groq via Cencori
    const cencori = getCencoriClient();
    let rawText: string;

    try {
      const aiRes = await cencori.ai.chat({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      });
      rawText = aiRes.content ?? "";
    } catch (aiErr: unknown) {
      const msg = aiErr instanceof Error ? aiErr.message : String(aiErr);
      console.error("[NurtureAI Chat] Cencori/Groq error:", msg);
      return NextResponse.json({ error: "AI service unavailable" }, { status: 502 });
    }

    // Parse JSON response from Groq
    let parsed: {
      reply: string;
      severity: string;
      detected_symptoms: string[];
      action: string;
      log_symptoms: boolean;
    };

    try {
      const cleaned = rawText.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // Fallback if Groq doesn't return clean JSON
      parsed = {
        reply: rawText || "I'm here for you, mama. Could you tell me more about how you're feeling?",
        severity: "low",
        detected_symptoms: [],
        action: "none",
        log_symptoms: false,
      };
    }

    const { reply, severity, detected_symptoms, action, log_symptoms } = parsed;

    // Log symptoms to DB if warranted
    if (log_symptoms && detected_symptoms?.length > 0) {
      const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
      await supabase.from("symptom_logs").insert({
        patient_id: patient_id ?? null,
        session_id: session_id ?? null,
        raw_input: lastUserMsg?.content ?? "",
        symptoms: detected_symptoms,
        severity: severity ?? "low",
        ai_analysis: reply,
        action_taken: action ?? "none",
        flagged: severity === "high" || severity === "critical",
        created_at: new Date().toISOString(),
      });
    }

    // Build UI event for high/critical
    let ui_event: Record<string, unknown> | null = null;
    if (action === "call_ambulance" || severity === "critical") {
      ui_event = { type: "TRIGGER_AMBULANCE", severity, symptoms: detected_symptoms };
    } else if (action === "call_doctor" || severity === "high") {
      ui_event = { type: "TRIGGER_DOCTOR_CALL", severity, symptoms: detected_symptoms };
    } else if (severity === "moderate") {
      ui_event = { type: "SYMPTOM_FLAGGED", severity, symptoms: detected_symptoms };
    }

    return NextResponse.json({
      reply,
      severity,
      detected_symptoms,
      action,
      ui_event,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[NurtureAI Chat] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
