import {sqlite} from '@/lib/storage';
export const runtime='nodejs';
export async function GET(){try{sqlite().prepare('SELECT 1').get();return Response.json({status:'ok',app:'orbita'})}catch{return Response.json({status:'unavailable'},{status:503})}}
