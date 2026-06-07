import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/mother/emergency
 *
 * Unified emergency handler for the NurtureAI quick-action buttons.
 * action: "call_doctor" | "request_ambulance"
 *
 * This properly mirrors what agent-tools does — not just a raw DB insert.
 * Ensures consistent behavior whether triggered by UI button or AI agent.
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { action, patient_id, address, symptoms } = await req.json();

    if (action === "call_doctor") {
      // 1. Get on-duty doctor
      const { data: doctor, error } = await supabase
        .from("doctor_on_duty")
        .select("*")
        .eq("is_active", true)
        .order("shift_start", { ascending: false })
        .limit(1)
        .single();

      if (error || !doctor) {
        return NextResponse.json({ type: "DOCTOR_UNAVAILABLE" });
      }

      // 2. Log it (same as agent-tools does)
      if (patient_id) {
        await supabase.from("symptom_logs").insert({
          patient_id,
          raw_input: "Doctor called from quick-action button",
          symptoms: ["manual_doctor_request"],
          severity: "high",
          ai_analysis: `Doctor ${doctor.name} alerted via app button.`,
          action_taken: "doctor_called",
          flagged: true,
          created_at: new Date().toISOString(),
        });
      }

      // 3. In production: trigger SMS/WhatsApp via Twilio here
      console.log(
        `[Emergency] DOCTOR ALERT — Patient: ${patient_id} | Doctor: ${doctor.name} (${doctor.phone_number})`
      );

      return NextResponse.json({
        type: "DOCTOR_CALLED",
        doctor_name: doctor.name,
        doctor_phone: doctor.phone_number,
        severity: "high",
      });
    }

    if (action === "request_ambulance") {
      if (!address) {
        return NextResponse.json(
          { error: "address is required" },
          { status: 400 }
        );
      }

      // 1. Insert ambulance request
      const { data: ambulance } = await supabase
        .from("ambulance_requests")
        .insert({
          patient_id: patient_id ?? null,
          address,
          symptoms: symptoms ?? "Emergency — requested from app button",
          severity: "critical",
          status: "requested",
          notes: "Quick-action button request",
          created_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      // 2. Also alert on-duty doctor (same as agent-tools does)
      const { data: doctor } = await supabase
        .from("doctor_on_duty")
        .select("name, phone_number")
        .eq("is_active", true)
        .limit(1)
        .single();

      // 3. In production: trigger actual dispatch here (LASAMBUS, Twilio, etc.)
      console.log(
        `[Emergency] 🚨 AMBULANCE — Patient: ${patient_id} | Address: ${address}`
      );

      return NextResponse.json({
        type: "AMBULANCE_REQUESTED",
        address,
        request_id: ambulance?.id ?? "",
        doctor_name: doctor?.name ?? null,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
