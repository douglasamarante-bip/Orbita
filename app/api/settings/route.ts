import {db,identity,respond,sameOrigin,fail,crypt} from '@/lib/server';
import {metaCredentials} from '@/lib/integrations';

export const runtime='nodejs';

async function requireAgency(req:Request){
  const user=await identity(req);
  if(user.role!=='agency')fail('Apenas o administrador pode alterar as credenciais.',403);
  return user;
}

export const GET=respond(async req=>{
  await requireAgency(req);
  const current=await metaCredentials();
  return Response.json({appId:current.appId||'',configured:Boolean(current.appId&&current.appSecret),hasAppSecret:Boolean(current.appSecret)},{headers:{'Cache-Control':'no-store'}});
});

export const POST=respond(async req=>{
  sameOrigin(req);
  await requireAgency(req);
  const value:any=await req.json();
  if(value.clear===true){
    await db().prepare("DELETE FROM integration_settings WHERE key IN ('META_APP_ID','META_APP_SECRET')").run();
    return Response.json({ok:true,configured:false});
  }
  const current=await metaCredentials();
  const appId=String(value.appId||'').trim()||current.appId;
  const appSecret=String(value.appSecret||'').trim()||current.appSecret;
  if(!/^\\d{5,30}$/.test(appId))fail('Informe um Meta App ID válido.');
  if(appSecret.length<16||appSecret.length>256)fail('Informe um Meta App Secret válido.');
  const now=new Date().toISOString();
  await db().prepare('INSERT INTO integration_settings(key,value,updated) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated=excluded.updated').bind('META_APP_ID',await crypt(appId),now).run();
  await db().prepare('INSERT INTO integration_settings(key,value,updated) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated=excluded.updated').bind('META_APP_SECRET',await crypt(appSecret),now).run();
  return Response.json({ok:true,appId,configured:true,hasAppSecret:true});
});
