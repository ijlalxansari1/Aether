import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const runtime = 'edge';

export async function GET() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return NextResponse.json({ error: 'DATABASE_URL is not set' }, { status: 500 });
    }

    const sql = neon(databaseUrl);
    
    // Test connection by checking the current time in Postgres
    const result = await sql`SELECT NOW()`;
    
    return NextResponse.json({ success: true, timestamp: result[0].now });
  } catch (err: any) {
    return NextResponse.json({ error: 'Database connection failed', details: err.message }, { status: 500 });
  }
}
