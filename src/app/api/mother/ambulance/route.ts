import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/mother/ambulance
 *      Create an ambulance request (from UI button or AI tool).
 *
 * GET  /api/mother/ambulance?patient_id=xxx
 *      Check status of recent ambulance requests.
 *
 * PATCH /api/mother/ambulance
 *      Update request status (for dispatch team).
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      patient_id,
      address,
      latitude,
      longitude,
      symptoms,
      severity = "critical",
      notes,
    } = body;

    if (!address && (!latitude || !longitude)) {
      return NextResponse.json(
        { error: "address or GPS coordinates are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("ambulance_requests")
      .insert({
        patient_id: patient_id ?? null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        address: address ?? null,
        symptoms: symptoms ?? null,
        severity,
        status: "requested",
        notes: notes ?? null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // In production: trigger your dispatch system here
    // e.g. POST to LASAMBUS API, send SMS to emergency line, etc.
    console.log("🚨 AMBULANCE REQUESTED:", data);

    return NextResponse.json({ request: data }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const patientId = req.nextUrl.searchParams.get("patient_id");
  if (!patientId) {
    return NextResponse.json({ error: "patient_id is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("ambulance_requests")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ requests: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ error: "id and status are required" }, { status: 400 });
    }

    const validStatuses = ["requested", "dispatched", "arrived", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("ambulance_requests")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ request: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
