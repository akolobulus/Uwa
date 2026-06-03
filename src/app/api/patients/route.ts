import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .order('createdAt', { ascending: false });

  if (error) {
    console.error('GET /api/patients error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Each row has a visits JSONB column — default to [] if null
  const patients = (data ?? []).map((p: any) => ({
    ...p,
    visits: p.visits ?? [],
  }));

  return NextResponse.json(patients);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Validate required fields
  if (!body.name || !body.age || !body.week) {
    return NextResponse.json(
      { error: 'name, age, and week are required' },
      { status: 400 }
    );
  }

  const { error } = await supabase.from('patients').insert({
    id: body.id,
    name: body.name,
    age: body.age,
    state: body.state ?? null,
    week: body.week,
    ancWeek: body.ancWeek ?? null,
    gravidity: body.gravidity ?? null,
    scd: body.scd,
    hiv: body.hiv,
    malaria: body.malaria,
    iptpDoses: body.iptpDoses,
    htn: body.htn,
    multiple: body.multiple,
    facility: body.facility,
    multiparity: body.multiparity,
    visits: [],
    createdAt: body.createdAt,
  });

  if (error) {
    console.error('POST /api/patients error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
