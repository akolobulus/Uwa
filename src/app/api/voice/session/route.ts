import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Auth check: validate bearer token against internal secret
  const authHeader = req.headers.get('authorization');
  const expectedToken = `Bearer ${process.env.INTERNAL_API_SECRET}`;
  
  if (authHeader !== expectedToken && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const res = await fetch('https://api.aethexai.com/api/v1/conversation/connect', {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.AETHEX_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ agent_id: process.env.AETHEX_AGENT_ID! }),
      signal: AbortSignal.timeout(8000), // Prevent indefinite hangs
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Aethex rejected handshake: ${res.status} — ${body}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
