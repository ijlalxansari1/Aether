import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export const runtime = 'edge';

const secretKey = new TextEncoder().encode(
  process.env.API_SECRET_KEY || 'default_fallback_secret_key_change_me_in_production'
);

async function getUserFromRequest() {
  const token = cookies().get('auth_token')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as { userId: number; email: string };
  } catch (err) {
    return null;
  }
}

// GET all workspaces or a specific one for the logged in user
export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
    const sql = neon(databaseUrl);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const workspaces = await sql`
        SELECT id, name, pipeline_state, last_updated 
        FROM workspaces 
        WHERE user_id = ${user.userId} AND id = ${id}
        LIMIT 1
      `;
      if (workspaces.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({ success: true, workspace: workspaces[0] });
    }

    const workspaces = await sql`
      SELECT id, name, last_updated 
      FROM workspaces 
      WHERE user_id = ${user.userId} 
      ORDER BY last_updated DESC
    `;

    return NextResponse.json({ success: true, workspaces });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

// POST to save or update a workspace
export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, name, pipeline_state } = await request.json();

    if (!name || !pipeline_state) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
    const sql = neon(databaseUrl);

    if (id) {
      // Update existing
      const result = await sql`
        UPDATE workspaces
        SET pipeline_state = ${pipeline_state}, last_updated = CURRENT_TIMESTAMP
        WHERE id = ${id} AND user_id = ${user.userId}
        RETURNING id
      `;
      if (result.length === 0) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
      return NextResponse.json({ success: true, id: result[0].id });
    } else {
      // Create new
      const result = await sql`
        INSERT INTO workspaces (user_id, name, pipeline_state)
        VALUES (${user.userId}, ${name}, ${pipeline_state})
        RETURNING id
      `;
      return NextResponse.json({ success: true, id: result[0].id });
    }
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
