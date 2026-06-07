import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET  /api/mother/appointments?patient_id=xxx
 *      Returns all upcoming appointments for the patient.
 *
 * POST /api/mother/appointments
 *      Create a new appointment (for use by clinician dashboard or admin).
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const patientId = req.nextUrl.searchParams.get("patient_id");
  const includeAll = req.nextUrl.searchParams.get("all") === "true";

  if (!patientId) {
    return NextResponse.json({ error: "patient_id is required" }, { status: 400 });
  }

  let query = supabase
    .from("appointments")
    .select("*")
    .eq("patient_id", patientId)
    .order("scheduled_at", { ascending: true });

  if (!includeAll) {
    query = query
      .eq("status", "scheduled")
      .gte("scheduled_at", new Date().toISOString());
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ appointments: data ?? [] });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      patient_id,
      scheduled_at,
      type = "ANC",
      location,
      clinician,
      notes,
    } = body;

    if (!patient_id || !scheduled_at) {
      return NextResponse.json(
        { error: "patient_id and scheduled_at are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("appointments")
      .insert({ patient_id, scheduled_at, type, location, clinician, notes })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ appointment: data }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
