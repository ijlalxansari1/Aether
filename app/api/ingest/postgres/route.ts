import { NextResponse } from 'next/server';
import { Client } from 'pg';

export async function POST(req: Request) {
  let client: Client | null = null;
  try {
    const body = await req.json();
    const { host, port, database, user, password, query } = body;

    if (!host || !user || !database || !query) {
      return NextResponse.json({ error: 'Missing connection details or query' }, { status: 400 });
    }

    client = new Client({
      host,
      port: Number(port) || 5432,
      database,
      user,
      password,
      connectionTimeoutMillis: 5000, // 5s timeout
    });

    await client.connect();
    
    // Execute the user's query
    const result = await client.query(query);
    
    return NextResponse.json({
      success: true,
      data: result.rows,
      rowCount: result.rowCount,
      fields: result.fields.map(f => f.name)
    });
  } catch (error: any) {
    console.error('Postgres Ingest Error:', error);
    return NextResponse.json({ error: error.message || 'Database connection failed' }, { status: 500 });
  } finally {
    if (client) {
      await client.end().catch(console.error);
    }
  }
}
