import { randomUUID } from 'node:crypto';
import { db, respond, fail, sameOrigin } from '@/lib/server';
import { sha, hashPassword, checkPassword, newSession, sessionCookie, sessionUser, rateLimit } from '@/lib/auth';

export const runtime = 'nodejs';

export const POST = respond(async req => {
  sameOrigin(req);
  const value: any = await req.json();

  if (value.action === 'logout') {
    const token = req.headers.get('cookie')?.split(';').map(part => part.trim())
      .find(part => part.startsWith('orbita_session='))?.slice('orbita_session='.length);
    if (token) await db().prepare('DELETE FROM sessions WHERE token_hash=?').bind(sha(token)).run();
    return Response.json({ ok: true }, { headers: { 'Set-Cookie': sessionCookie('', true) } });
  }

  const email = String(value.email || '').trim().toLowerCase();
  const password = String(value.password || '');
  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email) || password.length < 10 || password.length > 200) {
    fail('Use um e-mail válido e uma senha de 10 a 200 caracteres.');
  }
  if (!(await rateLimit('auth:' + email))) fail('Muitas tentativas. Aguarde 15 minutos.', 429);

  let user: any;

  if (value.action === 'register') {
    const setupValid = Boolean(value.setupToken && process.env.SETUP_TOKEN &&
      sha(String(value.setupToken)) === sha(process.env.SETUP_TOKEN));

    try {
      user = await db().transaction(async tx => {
        let role = 'client';
        if (setupValid) {
          const agency = await tx.prepare("SELECT id FROM users WHERE role='agency'").first();
          if (agency) fail('A agência já foi configurada.', 409);
          role = 'agency';
        } else {
          const invite = await tx.prepare('SELECT * FROM invitations WHERE token_hash=? AND email=? AND used=0 AND expires>?')
            .bind(sha(String(value.invite || '')), email, Date.now()).first();
          if (!invite) fail('Convite inválido ou expirado.', 403);
        }

        const existing = await tx.prepare('SELECT id FROM users WHERE email=?').bind(email).first();
        if (existing) fail('Este e-mail já possui acesso. Entre com sua senha.', 409);

        const id = randomUUID();
        await tx.prepare('INSERT INTO users(id,email,password_hash,role,created) VALUES(?,?,?,?,?)')
          .bind(id, email, hashPassword(password), role, new Date().toISOString()).run();

        if (role === 'client') {
          const consumed = await tx.prepare('UPDATE invitations SET used=1 WHERE token_hash=? AND email=? AND used=0 AND expires>? RETURNING token_hash')
            .bind(sha(String(value.invite || '')), email, Date.now()).first();
          if (!consumed) fail('Convite já utilizado ou expirado.', 409);
        }
        return { id, email, role };
      });
    } catch (error: any) {
      if (error?.code === '23505') fail('A agência já foi configurada ou este e-mail já possui acesso.', 409);
      throw error;
    }
  } else if (value.action === 'login') {
    const stored: any = await db().prepare('SELECT * FROM users WHERE email=?').bind(email).first();
    if (!stored || !checkPassword(password, stored.password_hash)) fail('E-mail ou senha incorretos.', 401);
    user = { id: stored.id, email: stored.email, role: stored.role };
  } else {
    fail('Ação inválida.');
  }

  const token = await newSession(user.id);
  return Response.json({ ok: true }, {
    headers: { 'Set-Cookie': sessionCookie(token), 'Cache-Control': 'no-store' },
  });
});

export async function GET(req: Request) {
  if (new URL(req.url).searchParams.get('action') === 'logout') {
    return new Response(
      '<!doctype html><html lang="pt-BR"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sair do Órbita</title><body style="background:#101211;color:#eaf4df;font:16px system-ui;padding:40px"><h1>Sair da conta?</h1><button id="out" style="padding:14px 30px;background:#c2f970;border:0;border-radius:8px">Sair</button><script>document.getElementById("out").onclick=async()=>{await fetch("/api/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"logout"})});location.href="/entrar"}</script></body></html>',
      { headers: { 'Content-Type': 'text/html;charset=utf-8', 'Cache-Control': 'no-store' } },
    );
  }
  return Response.json({ user: await sessionUser(req) }, { headers: { 'Cache-Control': 'no-store' } });
}
