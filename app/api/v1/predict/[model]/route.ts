import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ model: string }> }
) {
  try {
    const body = await request.json();
    const { model: modelId } = await params;

    // Simulate network and inference latency
    await new Promise(resolve => setTimeout(resolve, 800));

    if (!body.data || !Array.isArray(body.data)) {
      return NextResponse.json(
        { error: "Invalid payload format. Expected { data: [...] }" },
        { status: 400 }
      );
    }

    // Mock inference logic
    const predictions = body.data.map((item: any, idx: number) => {
      // Create a deterministic but fake prediction score based on the item properties
      const score = (Math.sin(idx + Object.keys(item).length) + 1) / 2;
      return {
        id: idx,
        prediction: score > 0.5 ? 1 : 0,
        confidence: parseFloat((0.5 + (score * 0.49)).toFixed(4)),
        version: "v1.0.3"
      };
    });

    return NextResponse.json({
      model: modelId,
      status: "success",
      latency_ms: Math.floor(Math.random() * 50) + 150,
      predictions: predictions
    });

  } catch (err: any) {
    return NextResponse.json(
      { error: "Internal Server Error", message: err.message },
      { status: 500 }
    );
  }
}
