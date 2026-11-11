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
  } catch (error) {
    const details = error instanceof Error
      ? { name: error.name, message: error.message }
      : { message: String(error) };
    console.error('[orbita:health] database check failed', details);
    return Response.json({ status: 'unavailable' }, { status: 503 });
  }
}
