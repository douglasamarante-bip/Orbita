import { randomUUID } from 'node:crypto';
import { db } from './server';
import { publishPost } from './integrations';

export async function runScheduledPosts() {
  const token = randomUUID();
  const now = Date.now();
  const lock = await db()
    .prepare('INSERT INTO scheduler_locks(id,token,expires_at) VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET token=excluded.token,expires_at=excluded.expires_at WHERE scheduler_locks.expires_at<? RETURNING token')
    .bind(token, now + 20 * 60 * 1000, now).first();

  if (!lock) return { results: [], skipped: 'already_running' };
  const results: any[] = [];

  try {
    const rows = (await db()
      .prepare("SELECT * FROM posts WHERE status='scheduled' AND scheduled_at<=? ORDER BY scheduled_at LIMIT 5")
      .bind(new Date().toISOString()).all()).results as any[];

    for (const post of rows) {
      const claimed = await db().prepare("UPDATE posts SET status='publishing' WHERE id=? AND status='scheduled'")
        .bind(post.id).run();
      if (!claimed.meta.changes) continue;

      if (post.poll_question) {
        const history = JSON.parse(post.history || '[]');
        history.push({
          action: 'Horário atingido; enquete aguardando finalização manual no Instagram',
          actor: 'Órbita',
          at: new Date().toISOString(),
        });
        await db().prepare("UPDATE posts SET status='needs_action',error=?,history=? WHERE id=? AND status='publishing'")
          .bind('Adicione o adesivo de enquete no Instagram e publique a mídia manualmente.', JSON.stringify(history), post.id).run();
        results.push({ id: post.id, status: 'needs_action' });
        continue;
      }

      try {
        const remote = await publishPost(post);
        if (typeof remote === 'object' && remote.pending) {
          await db().prepare("UPDATE posts SET status='scheduled' WHERE id=? AND status='publishing'").bind(post.id).run();
          results.push({ id: post.id, status: 'processing' });
          continue;
        }
        await db().prepare("UPDATE posts SET status='published',remote_id=?,error=NULL WHERE id=? AND status='publishing'")
          .bind(remote, post.id).run();
        results.push({ id: post.id, status: 'published' });
      } catch (error: any) {
        await db().prepare("UPDATE posts SET status='failed',error=? WHERE id=? AND status='publishing'")
          .bind('Publicação não confirmada: ' + String(error.message).slice(0, 350) + '. Confira a rede antes de tentar novamente.', post.id).run();
        results.push({ id: post.id, status: 'failed' });
      }
    }
    return { results };
  } finally {
    await db().prepare('DELETE FROM scheduler_locks WHERE id=1 AND token=?').bind(token).run();
  }
}
