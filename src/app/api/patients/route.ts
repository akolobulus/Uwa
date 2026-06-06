import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import type { RiskEngineResult } from '@/app/api/risk-narrative/route';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type VisitRow = {
  id: string;
  date: string;
  week: number | null;
  sbp: number;
  dbp: number;
  hr: number | null;
  bs: number | null;
  temp: number | null;
  weight: number | null;
  notes: string | null;
  oedema: string | null;
  protein: string | null;
  risk_composite: number | null;
  risk_colour: string | null;
  risk_priority: string | null;
  risk_pph?: number | null;
  risk_pre?: number | null;
  risk_ptl?: number | null;
  risk_drivers?: string | null;
  engine_result?: RiskEngineResult | null;
  scored_at: string | null;
};

type PatientRow = {
  id: string;
  name: string;
  age: number;
  state: string | null;
  week: number;
  anc_week: number | null;
  gravidity: number | null;
  scd: string;
  hiv: string;
  malaria: string;
  iptp_doses: string;
  htn: string;
  multiple: string;
  facility: string;
  multiparity: string;
  created_at: string;
  visits?: VisitRow[] | null;
};

type PatientPostBody = {
  id: string;
  name: string;
  age: number;
  state?: string | null;
  week: number;
  ancWeek?: number | null;
  gravidity?: number | null;
  scd: string;
  hiv: string;
  malaria: string;
  iptpDoses: string;
  htn: string;
  multiple: string;
  facility: string;
  multiparity: string;
  createdAt?: string;
};

export async function GET() {
  const { data, error } = await supabase
    .from('patients')
    .select(`
      *,
      visits (*)
    `)
    .order('created_at', { ascending: false });
    // BUG FIX 1: Supabase nested selects don't support .order() on the relation
    // directly in the parent query. We sort visits in JS below instead.

  if (error) {
    console.error('GET /api/patients backend failure:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as PatientRow[];

  const patients = rows.map((p) => ({
    id: p.id,
    name: p.name,
    age: p.age,
    state: p.state,
    week: p.week,
    ancWeek: p.anc_week,
    gravidity: p.gravidity,
    scd: p.scd,
    hiv: p.hiv,
    malaria: p.malaria,
    iptpDoses: p.iptp_doses,
    htn: p.htn,
    multiple: p.multiple,
    facility: p.facility,
    multiparity: p.multiparity,
    createdAt: p.created_at,
    visits: (p.visits ?? [])
      // BUG FIX 2: Sort visits by date descending here so the frontend
      // "latest visit" logic is always consistent regardless of insert order
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((v) => ({
        id: v.id,
        date: v.date,
        week: v.week,
        sbp: v.sbp,
        dbp: v.dbp,
        hr: v.hr,
        bs: v.bs,
        temp: v.temp,
        weight: v.weight,
        notes: v.notes,
        oedema: v.oedema,
        protein: v.protein,
        riskComposite: v.risk_composite,
        // BUG FIX 3: Normalise colour to lowercase so it matches the frontend's
        // switch() cases: "critical" | "high" | "moderate" | "low"
        // The DB may store "GREEN", "AMBER", "RED" from the ML engine default.
        riskColour: normaliseColour(v.risk_colour),
        riskPriority: v.risk_priority,
        riskPph: v.risk_pph,
        riskPre: v.risk_pre,
        riskPtl: v.risk_ptl,
        riskDrivers: v.risk_drivers,
        engineResult: v.engine_result ?? null,
        scoredAt: v.scored_at,
      })),
  }));

  return NextResponse.json(patients);
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<PatientPostBody>;

  if (!body.name || !body.age || !body.week) {
    return NextResponse.json(
      { error: 'Missing mandatory client values: name, age, week.' },
      { status: 400 }
    );
  }

  const { error } = await supabase.from('patients').insert({
    id: body.id,
    name: body.name,
    age: body.age,
    state: body.state ?? null,
    week: body.week,
    anc_week: body.ancWeek ?? null,
    gravidity: body.gravidity ?? null,
    scd: body.scd,
    hiv: body.hiv,
    malaria: body.malaria,
    iptp_doses: body.iptpDoses,
    htn: body.htn,
    multiple: body.multiple,
    facility: body.facility,
    multiparity: body.multiparity,
    created_at: body.createdAt || new Date().toISOString(),
  });

  if (error) {
    console.error('Database Patient Generation Failure:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * BUG FIX 3 (detail): The ML engine on Render returns colour as uppercase strings
 * like "GREEN", "AMBER", "RED", "ORANGE". The frontend getRiskColor() switch
 * expects lowercase: "low" | "moderate" | "high" | "critical".
 * This function normalises both directions so the badge colours render correctly.
 */
function normaliseColour(raw: string | null | undefined): string {
  if (!raw) return 'low';
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
