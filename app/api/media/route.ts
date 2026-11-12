import { bucket, db, uid, brandAccess, respond, sameOrigin, fail } from '@/lib/server';
import { hasSupabaseStorage, isNetlifyRuntime, supabaseStorage } from '@/lib/storage';

const allowedTypes = ['image/jpeg', 'image/png', 'video/mp4'];
const maxSize = 50 * 1024 * 1024;

function validateFile(name: string, type: string, size: number) {
  if (!name || name.length > 240) fail('Nome de arquivo inválido.');
  if (!allowedTypes.includes(type)) fail('Use JPG, PNG ou vídeo MP4.');
  if (!Number.isFinite(size) || size <= 0 || size > maxSize) fail('Tamanho máximo: 50 MB.');
}

function resumableEndpoint() {
  const url = new URL(process.env.SUPABASE_URL!);
  const host = url.hostname.endsWith('.supabase.co')
    ? url.hostname.split('.')[0] + '.storage.supabase.co'
    : url.hostname;
  return url.protocol + '//' + host + (url.port ? ':' + url.port : '') + '/storage/v1/upload/resumable';
}

export const POST = respond(async req => {
  sameOrigin(req);
  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const value: any = await req.json();
    const brandId = String(value.brand_id || '');
    await brandAccess(req, brandId, true);

    if (!hasSupabaseStorage()) {
      if (isNetlifyRuntime()) fail('Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para habilitar o upload de mídia.', 503);
      if (value.action === 'prepare') return Response.json({ direct: false });
      fail('O Storage não está configurado.', 503);
    }

    if (value.action === 'prepare') {
      const name = String(value.name || '').trim();
      const type = String(value.type || '');
      const size = Number(value.size);
      validateFile(name, type, size);

      const id = uid();
      const result = await supabaseStorage().createSignedUploadUrl(id, { upsert: false });
      if (result.error || !result.data) fail(result.error?.message || 'Não foi possível preparar o upload.', 502);

      return Response.json({
        direct: true,
        id,
        token: result.data.token,
        signedUrl: result.data.signedUrl,
        endpoint: resumableEndpoint(),
      });
    }

    if (value.action === 'complete') {
      const id = String(value.id || '');
      const name = String(value.name || '').trim();
      const type = String(value.type || '');
      const size = Number(value.size);
      if (!/^[0-9a-f-]{36}$/i.test(id)) fail('Identificador de mídia inválido.');
      validateFile(name, type, size);

      const result = await supabaseStorage().info(id);
      if (result.error || !result.data) fail('O arquivo ainda não chegou ao Storage. Tente novamente.', 409);

      if (Number(result.data.size) !== size || result.data.mimetype !== type) {
        await supabaseStorage().remove([id]);
        fail('O arquivo enviado não corresponde aos dados informados.', 409);
      }

      await db().prepare('INSERT INTO assets(id,brand_id,name,type,size,share_key) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING')
        .bind(id, brandId, name, type, size, uid()).run();
      const saved: any = await db().prepare('SELECT brand_id,type,size FROM assets WHERE id=?').bind(id).first();
      if (!saved || saved.brand_id !== brandId || saved.type !== type || Number(saved.size) !== size) {
        fail('Esta mídia já está vinculada a outro arquivo ou cliente.', 409);
      }

      return Response.json({ id, type });
    }

    fail('Ação de mídia inválida.');
  }

  const form = await req.formData();
  const brandId = String(form.get('brand_id') || '');
  await brandAccess(req, brandId, true);
  const file = form.get('file');

  if (!(file instanceof File)) fail('Arquivo não recebido.');
  validateFile(file.name, file.type, file.size);

  if (hasSupabaseStorage()) {
    if (file.size > 5 * 1024 * 1024) fail('Atualize a página para usar o envio direto de vídeos grandes.', 413);
    const id = uid();
    const result = await supabaseStorage().upload(id, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      upsert: false,
      cacheControl: '3600',
    });
    if (result.error) fail(result.error.message, 502);
    await db().prepare('INSERT INTO assets(id,brand_id,name,type,size,share_key) VALUES(?,?,?,?,?,?)')
      .bind(id, brandId, file.name, file.type, file.size, uid()).run();
    return Response.json({ id, type: file.type });
  }

  if (isNetlifyRuntime()) fail('Configure o Supabase Storage para enviar mídias no Netlify.', 503);

  const id = uid();
  await bucket().put(id, await file.arrayBuffer());
  await db().prepare('INSERT INTO assets(id,brand_id,name,type,size,share_key) VALUES(?,?,?,?,?,?)')
    .bind(id, brandId, file.name, file.type, file.size, uid()).run();
  return Response.json({ id, type: file.type });
});

export const GET = respond(async req => {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) fail('Arquivo não encontrado.', 404);

  const asset: any = await db().prepare('SELECT * FROM assets WHERE id=?').bind(id).first();
  if (!asset) fail('Arquivo não encontrado.', 404);

  const key = url.searchParams.get('key');
  if (!key || key !== asset.share_key) await brandAccess(req, asset.brand_id);

  if (hasSupabaseStorage()) {
    const download = url.searchParams.get('download') === '1';
    const result = await supabaseStorage().createSignedUrl(asset.id, 4 * 60 * 60);
    if (result.error || !result.data) fail('Não foi possível abrir a mídia.', 502);
    const signedUrl = new URL(result.data.signedUrl);
    if (download) signedUrl.searchParams.set('download', asset.name);
    return new Response(null, {
      status: 302,
      headers: {
        Location: signedUrl.toString(),
        'Cache-Control': 'private, no-store',
      },
    });
  }

  if (isNetlifyRuntime()) fail('Configure o Supabase Storage para acessar as mídias.', 503);

  const file = await bucket().get(asset.id);
  if (!file) fail('Arquivo não encontrado.', 404);
  const headers: Record<string, string> = {
    'Content-Type': asset.type,
    'Cache-Control': 'private, max-age=300',
    'X-Content-Type-Options': 'nosniff',
  };
  if (url.searchParams.get('download') === '1') {
    headers['Content-Disposition'] = "attachment; filename*=UTF-8''" + encodeURIComponent(asset.name);
  }
  return new Response(file.body, { headers });
});
