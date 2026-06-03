import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  // Fetch patients and eagerly pull their relational visits ordered by date
  const { data, error } = await supabase
    .from('patients')
    .select(`
      *,
      visits (*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('GET /api/patients backend failure:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Remap DB snake_case records seamlessly into CamelCase expected by the front-end dashboard UI component
  const patients = (data ?? []).map((p: any) => ({
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
    visits: (p.visits ?? []).map((v: any) => ({
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
    })),
  }));

  return NextResponse.json(patients);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.name || !body.age || !body.week) {
    return NextResponse.json({ error: 'Missing mandatory client values: name, age, week.' }, { status: 400 });
  }

  // Insert securely straight down into relational snake_case mapping structure
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
