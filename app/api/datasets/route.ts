import { NextResponse } from 'next/server';
import { saveDataset, listDatasets } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    await saveDataset(data);
    return NextResponse.json({ success: true, id: data.id });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const datasets = await listDatasets();
    return NextResponse.json({ success: true, datasets });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
