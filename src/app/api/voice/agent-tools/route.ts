import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/voice/agent-tools
 *
 * Aethex calls this endpoint when Evans invokes a tool during a live conversation.
 * The request body follows Aethex's tool-call webhook format:
 *   { tool_name, tool_call_id, parameters, session_id }
 *
 * Each handler returns a JSON object that Aethex feeds back to the LLM as the
 * tool result, and also includes a `__ui_event` field that the polling client
 * picks up to drive UI state changes (navigate to patient, refresh list, etc.).
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

  const { tool_name, parameters } = body;

  try {
    switch (tool_name) {
      case "add_patient":
        return await handleAddPatient(parameters);

      case "search_patient":
        return await handleSearchPatient(parameters);

      case "log_visit":
        return await handleLogVisit(parameters);

      case "explain_patient_risk":
        return await handleExplainRisk(parameters);

      default:
        return NextResponse.json(
          { error: `Unknown tool: ${tool_name}` },
          { status: 400 }
        );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error(`Tool [${tool_name}] error:`, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── Tool: add_patient ────────────────────────────────────────────────────────

async function handleAddPatient(params: Record<string, unknown>) {
  const name = String(params.name ?? "").trim();
  const gestationalWeek = Number(params.gestational_week ?? 0);
  const ancWeek = Number(params.anc_booking_week ?? gestationalWeek);
  const age = Number(params.age ?? 25);
  const gravidity = Number(params.gravidity ?? 1);
  const state = String(params.state ?? "Unknown");
  const scd = String(params.scd ?? "AA");
  const hiv = String(params.hiv ?? "Negative");
  const malaria = String(params.malaria ?? "0");
  const iptpDoses = String(params.iptp_doses ?? "0");
  const htn = String(params.htn ?? "0");
  const multiple = String(params.multiple ?? "0");
  const multiparity = gravidity >= 5 ? "1" : "0";

  if (!name || gestationalWeek < 1) {
    return NextResponse.json({
      success: false,
      message: "Cannot register patient: name and gestational week are required.",
      __ui_event: null,
    });
  }

  const patientId = crypto.randomUUID();

  const { error } = await supabase.from("patients").insert({
    id: patientId,
    name,
    age,
    state,
    week: gestationalWeek,
    anc_week: ancWeek,
    gravidity,
    scd,
    hiv,
    malaria,
    iptp_doses: iptpDoses,
    htn,
    multiple,
    facility: "1",
    multiparity,
    created_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({
      success: false,
      message: `Database error while registering patient: ${error.message}`,
      __ui_event: null,
    });
  }

  return NextResponse.json({
    success: true,
    patient_id: patientId,
    message: `Patient ${name} has been registered at gestational week ${gestationalWeek}. Their record is now available in the system.`,
    __ui_event: {
      type: "NAVIGATE_TO_PATIENT",
      patient_id: patientId,
      refresh: true,
    },
  });
}

// ─── Tool: search_patient ─────────────────────────────────────────────────────

async function handleSearchPatient(params: Record<string, unknown>) {
  const query = String(params.query ?? "").trim();

  if (!query) {
    return NextResponse.json({
      success: false,
      message: "Please provide a patient name to search for.",
      __ui_event: null,
    });
  }

  const { data, error } = await supabase
    .from("patients")
    .select("id, name, age, week, state")
    .ilike("name", `%${query}%`)
    .limit(5);

  if (error) {
    return NextResponse.json({
      success: false,
      message: `Search failed: ${error.message}`,
      __ui_event: null,
    });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({
      success: false,
      message: `No patient found matching "${query}". Please check the name spelling or register them as a new patient.`,
      __ui_event: { type: "SEARCH_QUERY", query },
    });
  }

  if (data.length === 1) {
    const patient = data[0];
    return NextResponse.json({
      success: true,
      patient_id: patient.id,
      patient_name: patient.name,
      message: `Found ${patient.name}, age ${patient.age}, gestational week ${patient.week}. Navigating to their record now.`,
      __ui_event: {
        type: "NAVIGATE_TO_PATIENT",
        patient_id: patient.id,
        refresh: false,
      },
    });
  }

  // Multiple matches — return all, navigate to best
  const names = data.map((p) => p.name).join(", ");
  const bestMatch = data[0];
  return NextResponse.json({
    success: true,
    patient_id: bestMatch.id,
    matches: data,
    message: `Found ${data.length} patients matching "${query}": ${names}. Navigating to ${bestMatch.name}'s record. Say a more specific name if this isn't the right patient.`,
    __ui_event: {
      type: "NAVIGATE_TO_PATIENT",
      patient_id: bestMatch.id,
      refresh: false,
    },
  });
}

// ─── Tool: log_visit ──────────────────────────────────────────────────────────

async function handleLogVisit(params: Record<string, unknown>) {
  const patientId = String(params.patient_id ?? "").trim();
  const sbp = Number(params.systolic_bp);
  const dbp = Number(params.diastolic_bp);
  const hr = Number(params.heart_rate ?? 75);
  const bs = Number(params.blood_sugar ?? 5.0);
  const temp = Number(params.temperature ?? 37.0);
  const week = params.gestational_week ? Number(params.gestational_week) : null;
  const oedema = String(params.oedema ?? "none");
  const protein = String(params.protein ?? "none");
  const notes = String(params.notes ?? "");

  if (!patientId || !sbp || !dbp) {
    return NextResponse.json({
      success: false,
      message: "Cannot log visit: patient ID and blood pressure readings are required.",
      __ui_event: null,
    });
  }

  // Fetch patient details for ML scoring
  const { data: patient, error: fetchError } = await supabase
    .from("patients")
    .select("*")
    .eq("id", patientId)
    .single();

  if (fetchError || !patient) {
    return NextResponse.json({
      success: false,
      message: `Could not find patient record to log visit against.`,
      __ui_event: null,
    });
  }

  // Delegate to the existing visit endpoint for ML scoring + DB insert
  const visitPayload = {
    visit: {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split("T")[0],
      week,
      sbp,
      dbp,
      hr,
      bs,
      temp,
      weight: null,
      notes,
      oedema,
      protein,
    },
    patient: {
      id: patient.id,
      age: patient.age,
      scd: patient.scd,
      ancWeek: patient.anc_week,
      hiv: patient.hiv,
      malaria: patient.malaria,
      htn: patient.htn,
      multiple: patient.multiple,
      multiparity: patient.multiparity,
      gravidity: patient.gravidity,
      facility: patient.facility,
      iptpDoses: patient.iptp_doses,
    },
  };

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const visitRes = await fetch(`${appUrl}/api/patients/visit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(visitPayload),
    signal: AbortSignal.timeout(30_000),
  });

  const visitResult = visitRes.ok ? await visitRes.json() : null;
  const scored = visitResult?.scored ?? false;

  return NextResponse.json({
    success: true,
    scored,
    message: scored
      ? `Visit logged for ${patient.name}. Blood pressure ${sbp}/${dbp} mmHg recorded. ML risk scores have been updated — check the dashboard for the latest assessment.`
      : `Visit logged for ${patient.name} with BP ${sbp}/${dbp} mmHg. The ML engine is currently offline so risk scores will update when it reconnects.`,
    __ui_event: {
      type: "NAVIGATE_TO_PATIENT",
      patient_id: patientId,
      refresh: true,
    },
  });
}

// ─── Tool: explain_patient_risk ───────────────────────────────────────────────

async function handleExplainRisk(params: Record<string, unknown>) {
  const patientName = String(params.patient_name ?? "").trim();
  const patientId = params.patient_id ? String(params.patient_id) : null;

  // Find patient
  let patientData: Record<string, unknown> | null = null;
  let visitData: Record<string, unknown> | null = null;

  if (patientId) {
    const { data } = await supabase
      .from("patients")
      .select("*, visits(*)")
      .eq("id", patientId)
      .single();
    patientData = data as Record<string, unknown> | null;
  } else {
    const { data } = await supabase
      .from("patients")
      .select("*, visits(*)")
      .ilike("name", `%${patientName}%`)
      .limit(1)
      .single();
    patientData = data as Record<string, unknown> | null;
  }

  if (!patientData) {
    return NextResponse.json({
      success: false,
      message: `Cannot find a patient matching "${patientName}". Please check the name or search for the patient first.`,
      __ui_event: null,
    });
  }

  const visits = (patientData.visits as Record<string, unknown>[] | undefined) ?? [];
  if (visits.length > 0) {
    visits.sort((a, b) => {
      const dateA = new Date(String(a.date ?? 0)).getTime();
      const dateB = new Date(String(b.date ?? 0)).getTime();
      return dateB - dateA;
    });
    visitData = visits[0];
  }

  const name = String(patientData.name);
  const pph = Number(visitData?.risk_pph ?? 0);
  const pre = Number(visitData?.risk_pre ?? 0);
  const ptl = Number(visitData?.risk_ptl ?? 0);
  const composite = Number(visitData?.risk_composite ?? 0);
  const colour = String(visitData?.risk_colour ?? "low");
  const drivers = String(visitData?.risk_drivers ?? "No driver data available.");
  const scd = String(patientData.scd ?? "AA");
  const hiv = String(patientData.hiv ?? "Negative");
  const malaria = String(patientData.malaria ?? "0");
  const htn = patientData.htn === "1" || patientData.htn === 1;
  const multiple = patientData.multiple === "1" || patientData.multiple === 1;
  const ancWeek = Number(patientData.anc_week ?? 12);
  const gravidity = Number(patientData.gravidity ?? 1);

  if (visits.length === 0) {
    return NextResponse.json({
      success: true,
      message: `${name} has no visits logged yet, so no risk assessment has been run. Log their first ANC visit to generate risk scores.`,
      __ui_event: patientId
        ? { type: "NAVIGATE_TO_PATIENT", patient_id: patientId, refresh: false }
        : null,
    });
  }

  // Build a rich explanation
  const flaggedConditions = [];
  if (pph >= 25) flaggedConditions.push(`PPH at ${pph}/99`);
  if (pre >= 25) flaggedConditions.push(`Preeclampsia at ${pre}/99`);
  if (ptl >= 25) flaggedConditions.push(`Preterm Labour at ${ptl}/99`);

  const contextualFactors = [];
  if (scd === "SS" || scd === "SC") contextualFactors.push(`sickle cell genotype ${scd}`);
  if (hiv === "Positive_No_ART") contextualFactors.push("HIV positive without ART");
  if (malaria === "2") contextualFactors.push("two or more malaria episodes this pregnancy");
  if (htn) contextualFactors.push("prior hypertension history");
  if (multiple) contextualFactors.push("multiple gestation");
  if (ancWeek >= 20) contextualFactors.push(`late ANC booking at week ${ancWeek}`);
  if (gravidity >= 5) contextualFactors.push("grand multiparity");

  const explanation = [
    `${name} currently holds a ${colour.toUpperCase()} risk classification with composite score ${composite}/99.`,
    flaggedConditions.length > 0
      ? `The model has flagged: ${flaggedConditions.join(", ")}.`
      : "No individual conditions are currently flagged above the 25/99 threshold.",
    contextualFactors.length > 0
      ? `Contributing clinical context includes: ${contextualFactors.join("; ")}.`
      : "",
    `SHAP driver summary: ${drivers.slice(0, 300)}`,
  ]
    .filter(Boolean)
    .join(" ");

  return NextResponse.json({
    success: true,
    patient_id: String(patientData.id),
    message: explanation,
    __ui_event: {
      type: "NAVIGATE_TO_PATIENT",
      patient_id: String(patientData.id),
      refresh: false,
    },
  });
}
