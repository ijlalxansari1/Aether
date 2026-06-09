import { NextResponse } from 'next/server';
import snowflake from 'snowflake-sdk';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { account, username, password, warehouse, database, schema, role, query } = body;

    if (!account || !username || !password || !query) {
      return NextResponse.json({ error: 'Missing connection details or query' }, { status: 400 });
    }

    const connection = snowflake.createConnection({
      account,
      username,
      password,
      warehouse,
      database,
      schema,
      role
    });

    return new Promise<Response>((resolve) => {
      connection.connect((err, conn) => {
        if (err) {
          console.error('Snowflake connect error:', err);
          return resolve(NextResponse.json({ error: err.message }, { status: 500 }));
        }

        connection.execute({
          sqlText: query,
          complete: (err, stmt, rows) => {
            if (err) {
              console.error('Snowflake execute error:', err);
              return resolve(NextResponse.json({ error: err.message }, { status: 500 }));
            }
            
            const dataRows = rows || [];
            let fields: string[] = [];
            if (dataRows.length > 0) {
              fields = Object.keys(dataRows[0]);
            }

            resolve(NextResponse.json({
              success: true,
              data: dataRows,
              rowCount: dataRows.length,
              fields
            }));
          }
        });
      });
    });

  } catch (error: any) {
    console.error('Snowflake Ingest Error:', error);
    return NextResponse.json({ error: error.message || 'Database connection failed' }, { status: 500 });
  }
}
