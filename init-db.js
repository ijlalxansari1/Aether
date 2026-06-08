const { neon } = require('@neondatabase/serverless');

const sql = neon("postgresql://neondb_owner:npg_TwvWK6hgSls8@ep-twilight-water-aqvudvwy-pooler.c-8.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require");

async function check() {
  try {
    const res = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`;
    console.log("Tables in database:", res.map(r => r.table_name));
    
    // If not created, create them!
    if (!res.some(r => r.table_name === 'users')) {
      console.log("Creating tables...");
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS workspaces (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          pipeline_state JSONB NOT NULL,
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      console.log("Created successfully!");
    }
  } catch (e) {
    console.error(e);
  }
}

check();
