import {randomBytes} from 'node:crypto';
import {db,respond,sameOrigin,brandAccess,fail} from '@/lib/server';
import {sha} from '@/lib/auth';
import {origin} from '@/lib/integrations';
export const POST=respond(async req=>{sameOrigin(req);const v:any=await req.json();const {brand}=await brandAccess(req,v.brand_id,true);if(!brand.email)fail('Cadastre o e-mail do cliente antes de criar um convite.');const token=randomBytes(32).toString('hex');await db().prepare('INSERT INTO invitations(token_hash,brand_id,email,expires) VALUES(?,?,?,?)').bind(sha(token),brand.id,brand.email,Date.now()+7*86400000).run();return Response.json({url:origin()+'/entrar?convite='+token+'&email='+encodeURIComponent(brand.email)})});
