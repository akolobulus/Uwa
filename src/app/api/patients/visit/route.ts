import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import type { ConditionKey, RiskEngineResult } from '@/app/api/risk-narrative/route';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function normaliseColour(raw: string): string {
  switch (raw.toUpperCase()) {
    case 'RED':
    case 'CRITICAL':
      return 'critical';
    case 'ORANGE':
    case 'AMBER':
    case 'HIGH':
      return 'high';
    case 'YELLOW':
    case 'MODERATE':
      return 'moderate';
    case 'GREEN':
    case 'LOW':
    default:
      return 'low';
  }
}

type PatientPayload = {
  id: string;
  age: number;
  scd: string;
  ancWeek?: number | string;
  hiv: string;
  malaria: string;
  htn: string;
  multiple: string;
  multiparity: string;
  gravidity?: number | string;
  facility: string;
  iptpDoses: string;
};

type VisitPayload = {
  id: string;
  date: string;
  week?: number | null;
  sbp: number;
  dbp: number;
  hr?: number | null;
  bs?: number | null;
  temp?: number | null;
  weight?: number | null;
  notes?: string | null;
  oedema?: string | null;
  protein?: string | null;
};

function getConditionScore(engineResult: RiskEngineResult | null, key: ConditionKey): number | null {
  const rawScore = engineResult?.conditions?.[key]?.score_0_to_100;
  return typeof rawScore === 'number' && Number.isFinite(rawScore) ? Math.round(rawScore) : null;
}

function getDriverSummary(engineResult: RiskEngineResult | null): string | null {
  const conditions = engineResult?.conditions;
  if (!conditions) return null;

  return (['PPH', 'Preeclamp', 'Preterm'] as ConditionKey[])
    .map((key) => {
      const condition = conditions[key];
      if (!condition?.top_drivers) return null;
      return `${condition.condition || key}: ${condition.top_drivers}`;
    })
    .filter(Boolean)
    .join('\n') || null;
}

function isMissingEngineResultColumn(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === 'PGRST204' || /engine_result/i.test(error.message || '');
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  if (url.searchParams.get('health') === '1') {
    const colabUrl = process.env.COLAB_ENGINE_URL || 'http://localhost:5000';
    try {
      const check = await fetch(`${colabUrl}/healthz`, { signal: AbortSignal.timeout(4000) });
      return NextResponse.json({ online: check.ok });
    } catch {
      return NextResponse.json({ online: false });
    }
  }
  return NextResponse.json({ error: 'Method not supported' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const { visit, patient } = (await req.json()) as {
    visit?: VisitPayload;
    patient?: PatientPayload;
  };

  if (!visit || !patient) {
    return NextResponse.json({ error: 'visit and patient data contexts required' }, { status: 400 });
  }

  let scored = false;
  let engineResult: RiskEngineResult | null = null;
  
  // Use core server route path matching Flask's app route configuration
  const baseEngineUrl = process.env.COLAB_ENGINE_URL || 'http://localhost:5000';
  const targetRouteUrl = `${baseEngineUrl.replace(/\/$/, '')}/api/v1/uwa/score`;

  try {
    // Structural translation to standard FHIR Transaction Bundle
    const bundle = {
      resourceType: "Bundle",
      type: "transaction",
      entry: [
        {
          resource: {
            resourceType: "Patient",
            id: patient.id,
            birthDate: `${new Date().getFullYear() - patient.age}-01-01`,
            extension: [
              { url: "sickle-cell-genotype", valueCode: patient.scd },
              { url: "anc-booking-week", valueInteger: parseInt(String(patient.ancWeek)) || 12 },
              { url: "hiv-status", valueCode: patient.hiv },
              { url: "malaria-episodes", valueInteger: parseInt(patient.malaria) || 0 },
              { url: "prior-hypertension", valueBoolean: patient.htn === "1" },
              { url: "multiple-gestation", valueBoolean: patient.multiple === "1" },
              { url: "grand-multiparity", valueBoolean: patient.multiparity === "1" },
              { url: "gravidity", valueInteger: parseInt(String(patient.gravidity)) || 1 },
              { url: "facility-delivery", valueBoolean: patient.facility === "1" },
              { url: "iptp-doses", valueInteger: parseInt(patient.iptpDoses) || 0 }
            ]
          }
        },
        {
          resource: {
            resourceType: "Observation",
            code: { coding: [{ system: "http://loinc.org", code: "55284-4" }] },
            valueQuantity: [
              { value: visit.sbp, component: "systolic" },
              { value: visit.dbp, component: "diastolic" }
            ]
          }
        },
        {
          resource: {
            resourceType: "Observation",
            code: { coding: [{ system: "http://loinc.org", code: "2339-0" }] },
            valueQuantity: { value: visit.bs ?? 5.0 }
          }
        },
        {
          resource: {
            resourceType: "Observation",
            code: { coding: [{ system: "http://loinc.org", code: "8867-4" }] },
            valueQuantity: { value: visit.hr ?? 75.0 }
          }
        },
        {
          resource: {
            resourceType: "Observation",
            code: { coding: [{ system: "http://loinc.org", code: "8310-5" }] },
            valueQuantity: { value: visit.temp ?? 37.0 }
          }
        }
      ]
    };

    const engineRes = await fetch(targetRouteUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bundle),
      signal: AbortSignal.timeout(25000), 
    });

    if (engineRes.ok) {
      engineResult = (await engineRes.json()) as RiskEngineResult;
      scored = true;
    } else {
      console.warn(`ML Engine rejection status code: ${engineRes.status}`);
    }
  } catch (err) {
    console.warn('ML Engine background pipeline connection error:', err);
  }

  // Fallback defaults if engine is cold starting or processing timeouts
  const compositeScore = engineResult?.composite_score ?? 0;
  const rawColour = engineResult?.priority_colour ?? 'GREEN';
  const riskColour = normaliseColour(rawColour);
  const riskPriority = engineResult?.priority ?? 'LOW — Standard preventative antenatal routine';

  const scoredAt = scored ? new Date().toISOString() : null;
  const visitInsert = {
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
    notes: engineResult?.conditions?.Preeclamp?.top_drivers || visit.notes || null,
    oedema: visit.oedema ?? null,
    protein: visit.protein ?? null,
    risk_composite: compositeScore,
    risk_colour: riskColour,
    risk_priority: riskPriority,
    risk_pph: getConditionScore(engineResult, 'PPH'),
    risk_pre: getConditionScore(engineResult, 'Preeclamp'),
    risk_ptl: getConditionScore(engineResult, 'Preterm'),
    risk_drivers: getDriverSummary(engineResult),
    scored_at: scoredAt,
  };

  let { error: insertErr } = await supabase.from('visits').insert({
    ...visitInsert,
    engine_result: engineResult ?? null,
  });

  if (isMissingEngineResultColumn(insertErr)) {
    const retry = await supabase.from('visits').insert(visitInsert);
    insertErr = retry.error;
  }

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, scored, engineResult });
}

