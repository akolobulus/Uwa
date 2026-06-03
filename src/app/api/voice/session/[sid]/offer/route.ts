import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Define type schema for Next.js 16+ where params is a Promise
type RouteContext = {
  params: Promise<{ sid: string }>;
};

export async function POST(req: NextRequest, context: RouteContext) {
  // 1. Explicitly unwrap the dynamic route parameters promise
  const { sid } = await context.params;
  const body = await req.json();

  // 2. Forward signaling details to Aethex using the unwrapped variable
  const res = await fetch(`https://api.aethexai.com/api/v1/conversation/${sid}/offer`, {
    method: 'POST',
    headers: {
      'X-API-Key': process.env.AETHEX_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  // INTERCEPT FUNCTION CALLS FROM MAYA IF PRESENT IN RESPONSE
  if (data.tool_calls) {
    for (const call of data.tool_calls) {
      const args = JSON.parse(call.arguments);

      if (call.name === 'search_patient') {
        const { data: matches } = await supabase
          .from('patients')
          .select('*')
          .ilike('name', `%${args.query}%`);
        call.output = JSON.stringify(matches ?? []);
      }

      else if (call.name === 'add_patient') {
        const { error } = await supabase.from('patients').insert({
          id: 'p_' + Date.now(),
          name: args.name,
          age: args.age,
          week: args.week,
          state: args.state ?? null,
          scd: 'AA',
          hiv: 'Negative',
          malaria: '0',
          iptp_doses: '0',
          htn: '0',
          multiple: '0',
          facility: '1',
          multiparity: '0',
        });
        call.output = JSON.stringify({ success: !error, error: error?.message });
      }

      else if (call.name === 'remove_patient') {
        const { error } = await supabase.from('patients').delete().eq('id', args.patient_id);
        call.output = JSON.stringify({ success: !error, error: error?.message });
      }
    }

    // Return the executed loop results back up into the audio pipeline execution stack
    const followUpRes = await fetch(`https://api.aethexai.com/api/v1/conversation/${sid}/tools-response`, {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.AETHEX_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tool_outputs: data.tool_calls }),
    });
    return NextResponse.json(await followUpRes.json());
  }

  return NextResponse.json(data, { status: res.status });
}

