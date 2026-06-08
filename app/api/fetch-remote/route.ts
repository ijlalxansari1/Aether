import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { url, headers } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // SSRF Protection: Enforce HTTPS
    if (!url.startsWith('https://')) {
      return NextResponse.json(
        { error: 'Security Violation: Only HTTPS connections are allowed.' },
        { status: 403 }
      );
    }

    // SSRF Protection: Block internal IPs/localhost
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname;
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.endsWith('.local')
      ) {
        return NextResponse.json(
          { error: 'Security Violation: Cannot fetch from internal or local networks (SSRF Blocked).' },
          { status: 403 }
        );
      }
    } catch (e) {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Perform secure fetch
    const response = await fetch(url, {
      method: 'GET',
      headers: headers || {},
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Remote API returned status: ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json({ data });
    } else {
      const text = await response.text();
      return NextResponse.json({ data: text, type: 'text' });
    }

  } catch (error: any) {
    console.error('Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch remote API' }, { status: 500 });
  }
}
