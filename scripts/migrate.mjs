import pg from 'pg';
import { readFile } from 'node:fs/promises';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  if (process.env.CONTEXT === 'production') {
    throw new Error('Configure DATABASE_URL no Netlify antes de publicar o Órbita.');
  }
  console.log('DATABASE_URL ausente fora de produção; migração PostgreSQL ignorada.');
  process.exit(0);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  connectionTimeoutMillis: 15000,
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
});

try {
  const sql = await readFile(
    new URL('../supabase/migrations/20261110000000_orbita_netlify.sql', import.meta.url),
    'utf8',
  );
  const statements = sql.split(';').map(statement => statement.trim()).filter(Boolean);
  for (const statement of statements) await pool.query(statement);
  console.log('Banco PostgreSQL do Órbita preparado com sucesso.');
} finally {
  await pool.end();
}
