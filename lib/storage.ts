import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync, readdirSync, existsSync, writeFileSync, renameSync, unlinkSync, createReadStream, statSync } from 'node:fs';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { getStore } from '@netlify/blobs';
import pg from 'pg';

const { Pool } = pg as any;
const root = process.env.DATA_DIR || join(process.cwd(), '.data');
let database: DatabaseSync | undefined;
let postgresPool: any;

function getPostgresPool() {
  if (!process.env.DATABASE_URL) throw new Error('Configure DATABASE_URL para usar o banco PostgreSQL.');
  if (!postgresPool) {
    postgresPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: Number(process.env.DATABASE_POOL_MAX || 1),
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 15000,
      keepAlive: true,
      ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
    });
  }
  return postgresPool;
}

function toPostgres(sql: string) {
  let index = 0;
  let single = false;
  let double = false;
  let output = '';

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    if (char === "'" && !double) {
      output += char;
      if (single && sql[i + 1] === "'") {
        output += sql[++i];
        continue;
      }
      single = !single;
      continue;
    }
    if (char === '"' && !single) {
      output += char;
      if (double && sql[i + 1] === '"') {
        output += sql[++i];
        continue;
      }
      double = !double;
      continue;
    }
    if (char === '?' && !single && !double) {
      output += '$' + (++index);
      continue;
    }
    output += char;
  }
  return output;
}

export function sqlite() {
  if (database) return database;
  mkdirSync(root, { recursive: true });
  const d = new DatabaseSync(join(root, 'orbita.sqlite'));
  d.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
  d.exec('CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY)');
  const folder = process.env.MIGRATIONS_DIR || join(process.cwd(), 'drizzle');
  if (!existsSync(folder)) throw new Error('Migration directory missing');

  for (const name of readdirSync(folder).filter(n => n.endsWith('.sql')).sort()) {
    if (d.prepare('SELECT name FROM _migrations WHERE name=?').get(name)) continue;
    d.exec('BEGIN IMMEDIATE');
    try {
      d.exec(readFileSync(join(folder, name), 'utf8'));
      d.prepare('INSERT INTO _migrations(name) VALUES(?)').run(name);
      d.exec('COMMIT');
    } catch (error) {
      d.exec('ROLLBACK');
      throw error;
    }
  }
  database = d;
  return d;
}

function sqliteDb(connection: DatabaseSync = sqlite()): any {
  return {
    prepare(query: string) {
      const bound = (values: any[] = []) => ({
        async first<T = any>(): Promise<T | null> {
          return (connection.prepare(query).get(...values) as T) ?? null;
        },
        async all<T = any>(): Promise<{ results: T[] }> {
          return { results: connection.prepare(query).all(...values) as T[] };
        },
        async run() {
          const result = connection.prepare(query).run(...values);
          return { meta: { changes: Number(result.changes), last_row_id: Number(result.lastInsertRowid) } };
        },
        bind(...next: any[]) {
          return bound(next);
        },
      });
      return bound();
    },
    async transaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
      const current = sqlite();
      current.exec('BEGIN IMMEDIATE');
      try {
        const result = await fn(sqliteDb(current));
        current.exec('COMMIT');
        return result;
      } catch (error) {
        current.exec('ROLLBACK');
        throw error;
      }
    },
  };
}

function postgresDb(executor: any = getPostgresPool()): any {
  return {
    prepare(query: string) {
      const bound = (values: any[] = []) => ({
        async first<T = any>(): Promise<T | null> {
          const result = await executor.query(toPostgres(query), values);
          return (result.rows?.[0] as T) ?? null;
        },
        async all<T = any>(): Promise<{ results: T[] }> {
          const result = await executor.query(toPostgres(query), values);
          return { results: result.rows as T[] };
        },
        async run() {
          const result = await executor.query(toPostgres(query), values);
          return { meta: { changes: Number(result.rowCount || 0), last_row_id: null } };
        },
        bind(...next: any[]) {
          return bound(next);
        },
      });
      return bound();
    },
    async transaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
      const client = await getPostgresPool().connect();
      try {
        await client.query('BEGIN');
        const result = await fn(postgresDb(client));
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },
  };
}

export function nodeDb() {
  return process.env.DATABASE_URL ? postgresDb() : sqliteDb();
}

export function nodeBucket() {
  const validKey = (key: string) => {
    if (!/^[a-zA-Z0-9_-]+$/.test(key)) throw new Error('Invalid media key');
    return key;
  };
  const isNetlify = process.env.NETLIFY === 'true' || Boolean(process.env.NETLIFY_SITE_ID);

  if (isNetlify) {
    const store = getStore('orbita-media');
    return {
      async put(key: string, bytes: ArrayBuffer, options?: any) {
        validKey(key);
        await store.set(key, bytes, {
          metadata: { contentType: options?.httpMetadata?.contentType || 'application/octet-stream' },
        });
        return { key };
      },
      async get(key: string) {
        validKey(key);
        const body = await store.get(key, { type: 'stream', consistency: 'strong' });
        return body ? { body, size: 0 } : null;
      },
      async delete(key: string) {
        validKey(key);
        await store.delete(key);
      },
    };
  }

  const path = (key: string) => join(root, 'uploads', validKey(key));
  return {
    async put(key: string, bytes: ArrayBuffer) {
      mkdirSync(join(root, 'uploads'), { recursive: true });
      const file = path(key);
      const tmp = file + '.tmp';
      writeFileSync(tmp, Buffer.from(bytes));
      renameSync(tmp, file);
      return { key };
    },
    async get(key: string) {
      const file = path(key);
      if (!existsSync(file)) return null;
      return { body: Readable.toWeb(createReadStream(file)) as ReadableStream<Uint8Array>, size: statSync(file).size };
    },
    async delete(key: string) {
      const file = path(key);
      if (existsSync(file)) unlinkSync(file);
    },
  };
}
