import { NextResponse } from 'next/server';
import { BigQuery } from '@google-cloud/bigquery';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId, clientEmail, privateKey, query } = body;

    if (!projectId || !clientEmail || !privateKey || !query) {
      return NextResponse.json({ error: 'Missing connection details or query' }, { status: 400 });
    }

    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

    const bigquery = new BigQuery({
      projectId,
      credentials: {
        client_email: clientEmail,
        private_key: formattedPrivateKey
      }
    });

    const [job] = await bigquery.createQueryJob({ query });
    const [rows] = await job.getQueryResults();

    let fields: string[] = [];
    if (rows.length > 0) {
      fields = Object.keys(rows[0]);
    }

    return NextResponse.json({
      success: true,
      data: rows,
      rowCount: rows.length,
      fields
    });

  } catch (error: any) {
    console.error('BigQuery Ingest Error:', error);
    return NextResponse.json({ error: error.message || 'Database connection failed' }, { status: 500 });
  }
}
