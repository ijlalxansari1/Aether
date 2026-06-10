import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { url, method, headers } = await req.json();

    if (!url) {
      return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 });
    }

    const res = await fetch(url, {
      method: method || 'GET',
      headers: headers || {},
    });

    if (!res.ok) {
      throw new Error(`API returned status ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('REST API proxy error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
