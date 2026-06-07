import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET  /api/mother/symptom-log?patient_id=xxx&limit=20
 *      Returns recent symptom logs for the patient.
 *
 * POST /api/mother/symptom-log
 *      Manually log symptoms (e.g. from text chat fallback).
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const patientId = req.nextUrl.searchParams.get("patient_id");
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 20);
  const flaggedOnly = req.nextUrl.searchParams.get("flagged") === "true";

  if (!patientId) {
    return NextResponse.json({ error: "patient_id is required" }, { status: 400 });
  }

  let query = supabase
    .from("symptom_logs")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (flaggedOnly) {
    query = query.eq("flagged", true);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ logs: data ?? [] });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      patient_id,
      raw_input,
      symptoms = [],
      severity = "low",
      ai_analysis = "",
      session_id,
    } = body;

    if (!patient_id || !raw_input) {
      return NextResponse.json(
        { error: "patient_id and raw_input are required" },
        { status: 400 }
      );
    }

    const flagged = severity === "high" || severity === "critical";
    const actionTaken =
      severity === "critical"
        ? "ambulance"
        : severity === "high"
        ? "doctor_called"
        : severity === "moderate"
        ? "advice"
        : "none";

    const { data, error } = await supabase
      .from("symptom_logs")
      .insert({
        patient_id,
        session_id: session_id ?? null,
        raw_input,
        symptoms,
        severity,
        ai_analysis,
        action_taken: actionTaken,
        flagged,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ log: data }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
