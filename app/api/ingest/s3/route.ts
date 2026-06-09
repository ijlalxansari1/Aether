import { NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { parse } from 'csv-parse/sync';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { accessKeyId, secretAccessKey, region, bucket, key } = body;

    if (!accessKeyId || !secretAccessKey || !region || !bucket || !key) {
      return NextResponse.json({ error: 'Missing connection details or object key' }, { status: 400 });
    }

    const s3 = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key
    });

    const response = await s3.send(command);
    if (!response.Body) throw new Error('Empty file received');
    
    const str = await response.Body.transformToString();
    const records = parse(str, { columns: true, skip_empty_lines: true });

    let fields: string[] = [];
    if (records.length > 0) {
      fields = Object.keys(records[0]);
    }

    return NextResponse.json({
      success: true,
      data: records,
      rowCount: records.length,
      fields
    });

  } catch (error: any) {
    console.error('S3 Ingest Error:', error);
    return NextResponse.json({ error: error.message || 'Database connection failed' }, { status: 500 });
  }
}
