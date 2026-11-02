import {auth,db,bucket,json,routesFor} from '../../../../lib/server';
import type {Role} from '../../../../lib/story';
import {canReadNote} from '../../../../lib/game-server';
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){try{const p=await auth(req);if(!p)return json({error:'Нет доступа'},401);const {id}=await params;const n=await db().prepare('SELECT * FROM notes WHERE id=? AND room_id=?').bind(id,p.room_id).first<any>();if(!n?.photo_key)return json({error:'Фото не найдено'},404);
if(p.story_version===3&&!await canReadNote(p,n))return json({error:'Фото пока не открыто.'},403);
if(p.story_version!==3&&n.participant_id!==p.id){const peer=await db().prepare('SELECT finished FROM participants WHERE room_id=? AND id<>?').bind(p.room_id,p.id).first<any>();if(p.story_version!==2&&!(p.finished&&peer?.finished)&&!routesFor(p).slice(0,p.stage+(p.arrived?1:0)).includes(n.place))return json({error:'Фото пока не открыто'},403);}
const obj=await bucket().get(n.photo_key);if(!obj)return json({error:'Фото не найдено'},404);return new Response(obj.body,{headers:{'Content-Type':'image/jpeg','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}catch{return json({error:'Не удалось загрузить фото'},503);}}
