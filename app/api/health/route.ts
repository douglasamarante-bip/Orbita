import { db } from '@/lib/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await db().prepare('SELECT 1').first();
    return Response.json({
      status: 'ok',
      app: 'orbita',
      database: process.env.DATABASE_URL ? 'postgres' : 'sqlite-local',
    });
  } catch {
    return Response.json({ status: 'unavailable' }, { status: 503 });
  }
}
