import { config, respond, fail } from '@/lib/server';
import { runScheduledPosts } from '@/lib/scheduler';

export const POST = respond(async req => {
  const secret = config().SCHEDULER_SECRET;
  if (!secret || req.headers.get('authorization') !== 'Bearer ' + secret) fail('Não autorizado.', 401);
  if (config().SCHEDULER_ENABLED !== 'true') fail('Agendador não ativado.', 503);
  return Response.json(await runScheduledPosts());
});
