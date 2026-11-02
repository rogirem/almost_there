import { env } from 'cloudflare:workers';
import { routes, taskKinds, type Role } from './story';
import {routeFor} from './game';
import {routes as legacyRoutes} from './story-v1';
export const routesFor=(p:any)=>p.story_version===3?routeFor(p):(p.story_version===2?routes:legacyRoutes)[p.role as Role];
export const db=()=>{if(!env.DB)throw new Error('База временно недоступна');return env.DB;};
export const bucket=()=>{if(!env.BUCKET)throw new Error('Хранилище временно недоступно');return env.BUCKET;};
export async function hash(v:string){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
export function token(){return crypto.randomUUID()+crypto.randomUUID();}
export function json(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store'}});}
export function checkOrigin(req:Request){const origin=req.headers.get('origin');if(origin && origin!==new URL(req.url).origin)throw new Error('Недопустимый источник запроса');}
export async function auth(req:Request){const t=req.headers.get('cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith('piter_session='))?.slice(14);if(!t)return null;return db().prepare('SELECT p.*, r.code, r.story_version FROM participants p JOIN rooms r ON r.id=p.room_id WHERE p.token_hash=?').bind(await hash(t)).first<any>();}
export async function state(p:any){
 const peer=await db().prepare('SELECT id,role,name,detail,stage,arrived,finished,consent,left_session FROM participants WHERE room_id=? AND id<>?').bind(p.room_id,p.id).first<any>();
 const unlocked=!!(p.finished && peer?.finished);
 const mutual=unlocked && p.consent==='yes' && peer.consent==='yes' && !p.left_session && !peer.left_session;
 const all=await db().prepare('SELECT id,participant_id,stage,place,kind,body,photo_key,reply_to,created_at FROM notes WHERE room_id=? ORDER BY created_at,id').bind(p.room_id).all<any>();
 const visited=new Set(routesFor(p).slice(0,p.stage+(p.arrived?1:0)));
 return {storyVersion:p.story_version,me:{id:p.id,name:p.name,role:p.role,stage:p.stage,arrived:!!p.arrived,finished:!!p.finished,consent:p.consent,left:!!p.left_session},code:p.code,unlocked,mutual,peer:peer?{joined:true,finished:!!peer.finished,left:!!peer.left_session,declined:unlocked&&peer.consent==='no',...(mutual?{name:peer.name,detail:peer.detail}:{} )}:null,notes:all.results.filter((n:any)=>p.story_version===2||n.participant_id===p.id||unlocked||visited.has(n.place)).map((n:any)=>({...n,mine:n.participant_id===p.id,photo: n.photo_key?`/api/photo/${n.id}`:null,photo_key:undefined,participant_id:undefined}))};
}
export {routes,taskKinds};
