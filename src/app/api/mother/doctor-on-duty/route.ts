import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET  /api/mother/doctor-on-duty
 *      Returns the currently active on-duty doctor.
 *
 * POST /api/mother/doctor-on-duty
 *      Set a new on-duty doctor (from clinician dashboard).
 *      Deactivates the previous on-duty entry.
 *
 * PATCH /api/mother/doctor-on-duty
 *      Update duty status (e.g. set is_active=false when shift ends).
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from("doctor_on_duty")
    .select("*")
    .eq("is_active", true)
    .order("shift_start", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({ doctor: null, message: "No doctor currently on duty" });
  }

  return NextResponse.json({ doctor: data });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone_number, specialty = "Obstetrics", facility = "1", shift_end } = body;

    if (!name || !phone_number) {
      return NextResponse.json(
        { error: "name and phone_number are required" },
        { status: 400 }
      );
    }

    // Deactivate all current on-duty entries for this facility
    await supabase
      .from("doctor_on_duty")
      .update({ is_active: false, shift_end: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("facility", facility)
      .eq("is_active", true);

    // Insert new on-duty record
    const { data, error } = await supabase
      .from("doctor_on_duty")
      .insert({
        name,
        phone_number,
        specialty,
        facility,
        shift_start: new Date().toISOString(),
        shift_end: shift_end ?? null,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ doctor: data }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, is_active, shift_end } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("doctor_on_duty")
      .update({
        is_active: is_active ?? false,
        shift_end: shift_end ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ doctor: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
