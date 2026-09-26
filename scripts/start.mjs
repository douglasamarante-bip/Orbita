import {spawn} from 'node:child_process';
const port=process.env.PORT||'3000';
if(process.env.NODE_ENV==='production'&&(!process.env.DATA_DIR||!process.env.APP_ORIGIN||!process.env.TOKEN_ENCRYPTION_KEY)){console.error('Set DATA_DIR, APP_ORIGIN and TOKEN_ENCRYPTION_KEY before starting.');process.exit(1)}
const child=spawn(process.execPath,['.next/standalone/server.js'],{stdio:'inherit',env:{...process.env,PORT:port,HOSTNAME:'0.0.0.0'}});
let active=false;async function tick(){if(active||process.env.SCHEDULER_ENABLED!=='true'||!process.env.SCHEDULER_SECRET)return;active=true;try{const r=await fetch(`http://127.0.0.1:${port}/api/jobs`,{method:'POST',headers:{Authorization:'Bearer '+process.env.SCHEDULER_SECRET},signal:AbortSignal.timeout(180000)});if(!r.ok&&r.status!==503)console.error('Scheduler HTTP',r.status)}catch{console.error('Scheduler unavailable')}finally{active=false}}
const timer=setInterval(tick,30000);process.on('SIGTERM',()=>{clearInterval(timer);child.kill('SIGTERM')});process.on('SIGINT',()=>{clearInterval(timer);child.kill('SIGINT')});child.on('exit',code=>{clearInterval(timer);process.exit(code||0)});
