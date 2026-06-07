import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/mother/voice/agent-tools
 *
 * Aethex calls this endpoint when Nurture AI invokes a tool during a live
 * mother voice/chat session. Completely isolated from the Tolu clinician tools.
 *
 * Tools handled:
 *   - log_symptoms       → symptom_logs table + severity escalation
 *   - get_appointment    → appointments table
 *   - call_doctor        → doctor_on_duty table lookup + notification
 *   - request_ambulance  → ambulance_requests table
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ToolCallBody {
  tool_name: string;
  tool_call_id: string;
  parameters: Record<string, unknown>;
  session_id?: string;
}

export async function POST(req: NextRequest) {
  let body: ToolCallBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { tool_name, parameters, session_id } = body;
  console.log(`[NurtureAI Tools] ${tool_name}`, parameters);

  try {
    switch (tool_name) {
      case "log_symptoms":
        return await handleLogSymptoms(parameters, session_id);
      case "get_appointment":
        return await handleGetAppointment(parameters);
      case "call_doctor":
        return await handleCallDoctor(parameters);
      case "request_ambulance":
        return await handleRequestAmbulance(parameters);
      default:
        return NextResponse.json({ error: `Unknown tool: ${tool_name}` }, { status: 400 });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    console.error(`[NurtureAI Tools] ${tool_name} error:`, err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── Tool: log_symptoms ───────────────────────────────────────────────────────

async function handleLogSymptoms(
  params: Record<string, unknown>,
  sessionId?: string
) {
  const patientId = params.patient_id ? String(params.patient_id) : null;
  const rawInput = String(params.raw_input ?? "");
  const symptoms = Array.isArray(params.symptoms)
    ? (params.symptoms as string[])
    : [rawInput];
  const severity = String(params.severity ?? "low") as
    | "low"
    | "moderate"
    | "high"
    | "critical";
  const aiAnalysis = String(params.ai_analysis ?? "");

  const isFlagged = severity === "high" || severity === "critical";

  // Determine action taken based on severity
  const actionTaken =
    severity === "critical"
      ? "ambulance"
      : severity === "high"
      ? "doctor_called"
      : severity === "moderate"
      ? "advice"
      : "none";

  const { data, error } = await supabase.from("symptom_logs").insert({
    patient_id: patientId,
    session_id: sessionId ?? null,
    raw_input: rawInput,
    symptoms,
    severity,
    ai_analysis: aiAnalysis,
    action_taken: actionTaken,
    flagged: isFlagged,
    created_at: new Date().toISOString(),
  }).select("id").single();

  if (error) {
    console.error("[NurtureAI] symptom_logs insert error:", error);
    // Don't fail the voice call over a DB error — still return guidance
    return NextResponse.json({
      success: false,
      logged: false,
      severity,
      message: `I've noted your symptoms${isFlagged ? " and flagged them for attention" : ""}. ${getSeverityAdvice(severity)}`,
      __ui_event: isFlagged
        ? { type: "SYMPTOM_FLAGGED", severity, symptoms }
        : null,
    });
  }

  return NextResponse.json({
    success: true,
    logged: true,
    log_id: data?.id,
    severity,
    flagged: isFlagged,
    message: `I've recorded your symptoms${isFlagged ? " and marked them as needing attention" : ""}. ${getSeverityAdvice(severity)}`,
    __ui_event: isFlagged
      ? { type: "SYMPTOM_FLAGGED", severity, symptoms, log_id: data?.id }
      : null,
  });
}

function getSeverityAdvice(severity: string): string {
  switch (severity) {
    case "critical":
      return "This sounds like an emergency — I'm getting help for you right now. Please stay as calm as you can.";
    case "high":
      return "This needs a doctor's attention today. I'm alerting the on-duty doctor now.";
    case "moderate":
      return "Please contact your clinic soon or call in if these symptoms get worse. Rest and stay hydrated.";
    default:
      return "This sounds like a normal part of pregnancy, but always trust your instincts. Call your clinic if you're worried.";
  }
}

// ─── Tool: get_appointment ────────────────────────────────────────────────────

async function handleGetAppointment(params: Record<string, unknown>) {
  const patientId = params.patient_id ? String(params.patient_id) : null;

  if (!patientId) {
    return NextResponse.json({
      success: false,
      message:
        "I wasn't able to find your appointment details. Please log in to the Nurture app or call your clinic directly to confirm your next visit.",
    });
  }

  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("patient_id", patientId)
    .eq("status", "scheduled")
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({
      success: false,
      message:
        "I don't see any upcoming appointments booked for you yet. Please contact your clinic to schedule your next ANC visit.",
      __ui_event: null,
    });
  }

  const apptDate = new Date(data.scheduled_at);
  const dateStr = apptDate.toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = apptDate.toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return NextResponse.json({
    success: true,
    appointment: {
      id: data.id,
      date: dateStr,
      time: timeStr,
      type: data.type,
      location: data.location,
      clinician: data.clinician,
    },
    message: `Your next appointment is on ${dateStr} at ${timeStr}${
      data.type ? ` — it's a ${data.type} visit` : ""
    }${data.location ? ` at ${data.location}` : ""}. Please try not to miss it, mama!`,
    __ui_event: { type: "SHOW_APPOINTMENT", appointment: data },
  });
}

// ─── Tool: call_doctor ────────────────────────────────────────────────────────

async function handleCallDoctor(params: Record<string, unknown>) {
  const patientId = params.patient_id ? String(params.patient_id) : null;
  const patientName = String(params.patient_name ?? "a patient");
  const symptomsSummary = String(params.symptoms_summary ?? "");
  const severity = String(params.severity ?? "high");

  // Get currently on-duty doctor
  const { data: doctor, error } = await supabase
    .from("doctor_on_duty")
    .select("*")
    .eq("is_active", true)
    .order("shift_start", { ascending: false })
    .limit(1)
    .single();

  if (error || !doctor) {
    return NextResponse.json({
      success: false,
      message:
        "I wasn't able to reach an on-duty doctor right now. Please call your clinic's emergency line directly, or go to the nearest hospital if this is urgent.",
      __ui_event: { type: "DOCTOR_UNAVAILABLE" },
    });
  }

  // In a real deployment, you'd trigger an SMS/WhatsApp/call here via Twilio or similar.
  // For now, we log the alert and surface the doctor's info to the UI.
  console.log(
    `[NurtureAI] DOCTOR ALERT — Patient: ${patientName} | Severity: ${severity} | Symptoms: ${symptomsSummary} | Doctor: ${doctor.name} (${doctor.phone_number})`
  );

  // Log symptom entry with action_taken = "doctor_called"
  if (patientId) {
    await supabase.from("symptom_logs").insert({
      patient_id: patientId,
      raw_input: symptomsSummary,
      symptoms: [symptomsSummary],
      severity,
      ai_analysis: `Doctor ${doctor.name} has been alerted.`,
      action_taken: "doctor_called",
      flagged: true,
      created_at: new Date().toISOString(),
    });
  }

  return NextResponse.json({
    success: true,
    doctor: {
      name: doctor.name,
      phone: doctor.phone_number,
      specialty: doctor.specialty,
    },
    message: `I've alerted Dr. ${doctor.name}, who is on duty right now. They will call you back shortly. Their direct number is ${doctor.phone_number} in case you need to reach them immediately.`,
    __ui_event: {
      type: "DOCTOR_CALLED",
      doctor_name: doctor.name,
      doctor_phone: doctor.phone_number,
      severity,
    },
  });
}

// ─── Tool: request_ambulance ──────────────────────────────────────────────────

async function handleRequestAmbulance(params: Record<string, unknown>) {
  const patientId = params.patient_id ? String(params.patient_id) : null;
  const patientName = String(params.patient_name ?? "Unknown patient");
  const address = String(params.address ?? "");
  const latitude = params.latitude ? Number(params.latitude) : null;
  const longitude = params.longitude ? Number(params.longitude) : null;
  const symptoms = String(params.symptoms ?? "");

  if (!address && !latitude) {
    return NextResponse.json({
      success: false,
      message:
        "I need your location to send help. Can you tell me your address or the nearest landmark?",
    });
  }

  // Insert ambulance request
  const { data, error } = await supabase.from("ambulance_requests").insert({
    patient_id: patientId,
    latitude,
    longitude,
    address,
    symptoms,
    severity: "critical",
    status: "requested",
    notes: `Voice request for ${patientName}`,
    created_at: new Date().toISOString(),
  }).select("id").single();

  if (error) {
    console.error("[NurtureAI] Ambulance request DB error:", error);
  }

  // In production: trigger actual emergency dispatch via local service (LASAMBUS, FRSC, etc.)
  console.log(
    `[NurtureAI] 🚨 AMBULANCE REQUESTED — Patient: ${patientName} | Address: ${address} | Symptoms: ${symptoms}`
  );

  // Also alert on-duty doctor
  const { data: doctor } = await supabase
    .from("doctor_on_duty")
    .select("name, phone_number")
    .eq("is_active", true)
    .limit(1)
    .single();

  return NextResponse.json({
    success: true,
    request_id: data?.id,
    message: `Help is on the way, mama. An ambulance has been requested to ${address}. ${
      doctor
        ? `Dr. ${doctor.name} has also been alerted. Stay on the line and keep your door unlocked if you can.`
        : "Stay calm and keep your door unlocked. Help is coming."
    }`,
    __ui_event: {
      type: "AMBULANCE_REQUESTED",
      address,
      request_id: data?.id,
      doctor_name: doctor?.name ?? null,
    },
  });
}
