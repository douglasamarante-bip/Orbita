import { runScheduledPosts } from '../../lib/scheduler';

export const config = {
  background: true,
};

export default async function handler(req: Request) {
  const secret = process.env.SCHEDULER_SECRET;
  if (!secret || req.headers.get('authorization') !== 'Bearer ' + secret) {
    console.error('Tentativa não autorizada de iniciar o agendador.');
    return;
  }
  if (process.env.SCHEDULER_ENABLED !== 'true') return;

  const result = await runScheduledPosts();
  console.log('Órbita scheduler:', JSON.stringify(result));
}
