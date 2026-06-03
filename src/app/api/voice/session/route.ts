import { NextRequest, NextResponse } from 'next/server';

export async function POST() {
  try {
    const res = await fetch('https://api.aethexai.com/api/v1/conversation/connect', {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.AETHEX_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ agent_id: process.env.AETHEX_AGENT_ID! }),
    });

    if (!res.ok) throw new Error('Aethex handshaking rejection');
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
