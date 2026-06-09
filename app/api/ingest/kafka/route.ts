import { NextResponse } from 'next/server';
import { Kafka } from 'kafkajs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { brokers, topic, groupId } = body;

    if (!brokers || !topic) {
      return NextResponse.json({ error: 'Missing brokers or topic' }, { status: 400 });
    }

    const brokerList = brokers.split(',').map((b: string) => b.trim());

    const kafka = new Kafka({
      clientId: 'aether-ingest',
      brokers: brokerList,
    });

    const consumer = kafka.consumer({ groupId: groupId || 'aether-group-' + Date.now() });
    
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: true });

    const messages: any[] = [];
    
    // We will consume messages for up to 3 seconds or 100 messages
    return new Promise<Response>((resolve) => {
      let timeoutId: NodeJS.Timeout;
      
      const finish = async () => {
        clearTimeout(timeoutId);
        await consumer.disconnect();
        
        let fields: string[] = [];
        if (messages.length > 0) {
          fields = Object.keys(messages[0]);
        }
        
        resolve(NextResponse.json({
          success: true,
          data: messages,
          rowCount: messages.length,
          fields
        }));
      };

      timeoutId = setTimeout(() => {
        finish();
      }, 3000);

      consumer.run({
        eachMessage: async ({ message }) => {
          try {
            if (message.value) {
              const parsed = JSON.parse(message.value.toString());
              messages.push(parsed);
            }
          } catch (e) {
            // Ignore non-json messages for now
          }
          if (messages.length >= 100) {
            finish();
          }
        },
      }).catch((err) => {
        clearTimeout(timeoutId);
        resolve(NextResponse.json({ error: err.message }, { status: 500 }));
      });
    });

  } catch (error: any) {
    console.error('Kafka Ingest Error:', error);
    return NextResponse.json({ error: error.message || 'Connection failed' }, { status: 500 });
  }
}
