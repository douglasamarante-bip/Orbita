import {db,uid,brandAccess,respond,sameOrigin,fail,validatePost,config} from '@/lib/server';

export const POST=respond(async req=>{
  sameOrigin(req);
  const v=validatePost(await req.json());
  const a=await brandAccess(req,v.brand_id,true);
  const id=uid(),now=new Date().toISOString();
  if(!['draft','review'].includes(v.status))fail('Status inválido.');
  for(const m of v.media){
    if(typeof m!=='string'||!(await db().prepare('SELECT id FROM assets WHERE id=? AND brand_id=?').bind(m,v.brand_id).first()))fail('Mídia inválida.');
  }
  await db().prepare('INSERT INTO posts(id,brand_id,title,caption,platform,format,media,scheduled_at,status,history,created) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(id,v.brand_id,v.title.trim(),v.caption,v.platform,v.format,JSON.stringify(v.media),new Date(v.scheduled_at).toISOString(),v.status,JSON.stringify([{action:'Publicação criada',actor:a.user.email,at:now}]),now).run();
  return Response.json({id});
});

export const PATCH=respond(async req=>{
  sameOrigin(req);
  const v:any=await req.json();
  const p:any=await db().prepare('SELECT * FROM posts WHERE id=?').bind(v.id).first();
  if(!p)fail('Publicação não encontrada.',404);
  const a=await brandAccess(req,p.brand_id);
  if(p.revision!==v.revision)fail('Esta publicação mudou. Atualize a página antes de decidir.',409);
  let status=p.status,feedback=p.feedback,label='',revision=p.revision,vals:any=null;
  const publishingConnection=async()=>{
    if(p.platform==='instagram'){
      if(p.format==='reel')return db().prepare("SELECT id FROM connections WHERE brand_id=? AND provider='instagram'").bind(p.brand_id).first();
      return db().prepare("SELECT id FROM connections WHERE brand_id=? AND provider IN ('instagram_direct','instagram') ORDER BY CASE provider WHEN 'instagram_direct' THEN 0 ELSE 1 END LIMIT 1").bind(p.brand_id).first();
    }
    return db().prepare('SELECT id FROM connections WHERE brand_id=? AND provider=?').bind(p.brand_id,p.platform).first();
  };
  const canSchedule=async()=>{
    if(config().SCHEDULER_ENABLED!=='true')return false;
    if(p.format!=='text'&&config().MEDIA_DELIVERY_ENABLED!=='true')return false;
    if(new Date(p.scheduled_at).getTime()<=Date.now())return false;
    if(p.format!=='text'&&JSON.parse(p.media).length===0)return false;
    return Boolean(await publishingConnection());
  };

  if(v.action==='edit'){
    if(!a.isOwner||['published','publishing','scheduled'].includes(status))fail('Não é possível editar esta publicação.',409);
    validatePost(v);
    for(const m of v.media){
      if(!(await db().prepare('SELECT id FROM assets WHERE id=? AND brand_id=?').bind(m,p.brand_id).first()))fail('Mídia inválida.');
    }
    vals=v;status='review';revision++;feedback='';label='Conteúdo atualizado; nova aprovação solicitada';
  }else if(v.action==='approve'){
    if(status!=='review')fail('A publicação não está aguardando aprovação.',409);
    status='approved';label=a.isOwner?'Aprovado pela agência':'Aprovado pelo cliente';
    if(!a.isOwner&&await canSchedule()){
      status='scheduled';label='Aprovado pelo cliente e programado';
    }
  }else if(v.action==='reject'){
    if(status!=='review')fail('A publicação não está aguardando aprovação.',409);
    if(typeof v.feedback!=='string'||v.feedback.trim().length<3)fail('Descreva o ajuste solicitado.');
    feedback=v.feedback.trim().slice(0,2000);status='rejected';label='Alterações solicitadas';
  }else if(v.action==='review'){
    if(!a.isOwner||!['draft','rejected'].includes(status))fail('Ação não permitida.',403);
    status='review';label='Enviado para aprovação';
  }else if(v.action==='schedule'){
    if(!a.isOwner||status!=='approved')fail('Aprovação necessária.',409);
    if(config().SCHEDULER_ENABLED!=='true')fail('A publicação automática aguarda ativação do serviço de agendamento.',503);
    if(p.format!=='text'&&config().MEDIA_DELIVERY_ENABLED!=='true')fail('Ative a entrega de mídias para a Meta antes de programar.',503);
    if(!(await publishingConnection()))fail('Conecte a conta antes de programar.');
    if(new Date(p.scheduled_at).getTime()<=Date.now())fail('Atualize a data e solicite nova aprovação.');
    if(p.format!=='text'&&JSON.parse(p.media).length===0)fail('Adicione a mídia antes de programar.');
    status='scheduled';label='Publicação programada';
  }else if(v.action==='cancel'){
    if(!a.isOwner||status!=='scheduled')fail('Ação não permitida.',409);
    status='approved';label='Agendamento cancelado';
  }else fail('Ação inválida.');

  const history=JSON.parse(p.history);
  history.push({action:label,actor:a.user.email,at:new Date().toISOString()});
  const r=await db().prepare('UPDATE posts SET status=?,feedback=?,history=?,revision=?,title=?,caption=?,platform=?,format=?,media=?,scheduled_at=? WHERE id=? AND revision=? AND status=?').bind(status,feedback,JSON.stringify(history),revision,vals?.title??p.title,vals?.caption??p.caption,vals?.platform??p.platform,vals?.format??p.format,vals?JSON.stringify(vals.media):p.media,vals?new Date(vals.scheduled_at).toISOString():p.scheduled_at,p.id,p.revision,p.status).run();
  if(!r.meta.changes)fail('Outra pessoa atualizou a publicação. Recarregue.',409);
  return Response.json({ok:true});
});
