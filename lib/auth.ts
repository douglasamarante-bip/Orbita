import { randomBytes, createHash, scryptSync, timingSafeEqual } from 'node:crypto';
import { nodeDb } from './storage';

export const sha = (value: string) => createHash('sha256').update(value).digest('hex');

export async function sessionUser(req: Request) {
  const cookie = req.headers.get('cookie') || '';
  const token = cookie
    .split(';')
    .map(value => value.trim())
    .find(value => value.startsWith('orbita_session='))
    ?.slice('orbita_session='.length);

  if (!token) return null;

  return await nodeDb()
    .prepare('SELECT u.id,u.email,u.role FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token_hash=? AND s.expires>?')
    .bind(sha(token), Date.now())
    .first<{ id: string; email: string; role: string }>();
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  return salt + ':' + scryptSync(password, salt, 64).toString('hex');
}

export function checkPassword(password: string, value: string) {
  const [salt, hash] = value.split(':');
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const supplied = scryptSync(password, salt, 64);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export async function newSession(userId: string) {
  const token = randomBytes(32).toString('hex');
  await nodeDb()
    .prepare('INSERT INTO sessions(token_hash,user_id,expires) VALUES(?,?,?)')
    .bind(sha(token), userId, Date.now() + 14 * 86400000)
    .run();
  return token;
}

export function sessionCookie(token: string, remove = false) {
  return 'orbita_session=' + token +
    '; Path=/; HttpOnly; SameSite=Lax; Max-Age=' + (remove ? 0 : 14 * 86400) +
    (process.env.NODE_ENV === 'production' ? '; Secure' : '');
}

export async function rateLimit(key: string) {
  const d = nodeDb();
  await d.prepare('DELETE FROM auth_limits WHERE until<?').bind(Date.now()).run();
  await d.prepare('INSERT INTO auth_limits(key,count,until) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=auth_limits.count+1,until=excluded.until')
    .bind(key, Date.now() + 15 * 60000)
    .run();
  const row = await d.prepare('SELECT count FROM auth_limits WHERE key=?').bind(key).first<{ count: number }>();
  return Number(row?.count || 0) <= 15;
}
