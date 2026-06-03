import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── Mapping helpers (mirror the model's FHIR parser exactly) ───────────────

function scdToScore(genotype: string): number {
  return ({ AA: 0, AS: 1, SC: 2, SS: 3 } as Record<string, number>)[genotype] ?? 0;
}

function hivToScore(status: string): number {
  return (
    { Negative: 0, Unknown: 0.2, Positive_ART: 0.5, Positive_No_ART: 1.0 } as Record<
      string,
      number
    >
  )[status] ?? 0;
}

// ─── FHIR R4 bundle builder ──────────────────────────────────────────────────

function buildFhirBundle(patient: any, visit: any) {
  const ancBookingWeek = patient.ancWeek ?? 40;

  return {
    resourceType: 'Bundle',
    type: 'transaction',
    entry: [
      {
        resource: {
          resourceType: 'Patient',
          id: patient.id,
          // The Colab parser reads birthDate to compute age, but we already have it
          // so we synthesise a birthDate from age as a fallback
          birthDate: `${new Date().getFullYear() - patient.age}-01-01`,
          extension: [
            {
              url: 'https://uwa.health/fhir/sickle-cell-genotype',
              valueCode: patient.scd,
            },
            {
              url: 'https://uwa.health/fhir/anc-booking-week',
              valueInteger: ancBookingWeek,
            },
            // Extra context the Colab model doesn't parse from FHIR but we attach
            // for completeness / future use
            {
              url: 'https://uwa.health/fhir/hiv-status',
              valueCode: patient.hiv,
            },
            {
              url: 'https://uwa.health/fhir/malaria-episodes',
              valueInteger: parseInt(patient.malaria) || 0,
            },
            {
              url: 'https://uwa.health/fhir/prior-hypertension',
              valueBoolean: patient.htn === '1',
            },
            {
              url: 'https://uwa.health/fhir/multiple-gestation',
              valueBoolean: patient.multiple === '1',
            },
            {
              url: 'https://uwa.health/fhir/grand-multiparity',
              valueBoolean: patient.multiparity === '1',
            },
            {
              url: 'https://uwa.health/fhir/gravidity',
              valueInteger: patient.gravidity ?? 1,
            },
            {
              url: 'https://uwa.health/fhir/facility-delivery',
              valueBoolean: patient.facility === '1',
            },
            {
              url: 'https://uwa.health/fhir/iptp-doses',
              valueInteger: parseInt(patient.iptpDoses) || 0,
            },
          ],
        },
      },
      // Blood pressure (LOINC 55284-4)
      {
        resource: {
          resourceType: 'Observation',
          code: {
            coding: [
              { system: 'http://loinc.org', code: '55284-4', display: 'Blood pressure' },
            ],
          },
          // The Colab parser loops over valueQuantity array and checks component field
          valueQuantity: [
            { value: visit.sbp, component: 'systolic' },
            { value: visit.dbp, component: 'diastolic' },
          ],
        },
      },
      // Blood glucose (LOINC 2339-0)
      ...(visit.bs != null
        ? [
            {
              resource: {
                resourceType: 'Observation',
                code: {
                  coding: [
                    { system: 'http://loinc.org', code: '2339-0', display: 'Blood Glucose' },
                  ],
                },
                valueQuantity: { value: visit.bs },
              },
            },
          ]
        : []),
      // Heart rate (LOINC 8867-4) — not parsed by Colab yet, included for completeness
      ...(visit.hr != null
        ? [
            {
              resource: {
                resourceType: 'Observation',
                code: {
                  coding: [
                    { system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' },
                  ],
                },
                valueQuantity: { value: visit.hr, unit: '/min' },
              },
            },
          ]
        : []),
    ],
  };
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { visit, patient } = await req.json();

  if (!visit || !patient) {
    return NextResponse.json({ error: 'visit and patient data contexts required' }, { status: 400 });
  }

  // 1. Process standard non-blocking predictive analytics via Colab Pipeline Engine 
  let scored = false;
  let engineResult = null;
  const colabUrl = process.env.COLAB_ENGINE_URL;

  if (colabUrl) {
    try {
      const bundle = buildFhirBundle(patient, visit);
      const engineRes = await fetch(colabUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bundle),
        signal: AbortSignal.timeout(10000), // Protect thread lifecycle
      });

      if (engineRes.ok) {
        engineResult = await engineRes.json();
        scored = true;
      }
    } catch (err) {
      console.warn('External Predictive Pipeline Engine Unreachable:', err);
    }
  }

  // 2. Direct clean entry straight down into separate clinical relational database rows
  const { error: insertErr } = await supabase.from('visits').insert({
    id: visit.id,
    patient_id: patient.id,
    date: visit.date,
    week: visit.week ?? null,
    sbp: visit.sbp,
    dbp: visit.dbp,
    hr: visit.hr ?? null,
    bs: visit.bs ?? null,
    temp: visit.temp ?? null,
    weight: visit.weight ?? null,
    notes: visit.notes ?? null,
    oedema: visit.oedema ?? null,
    protein: visit.protein ?? null,
    
    // Save predictive results directly onto the specific clinical checkup
    risk_composite: engineResult?.uwa_composite_score ?? null,
    risk_colour: engineResult?.uwa_priority_colour ?? null,
    risk_priority: engineResult?.note?.[0]?.text ?? null,
    scored_at: scored ? new Date().toISOString() : null
  });

  if (insertErr) {
    console.error('Relational DB Insert Block Failure:', insertErr.message);
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    scored,
    engineResult,
  });
}

