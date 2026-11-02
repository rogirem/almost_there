import {db,hash,json} from './server';
import {routeFor,scriptFor,taskFor,walkLine,replyLine,canRead,defaults,alternative,yandexRoute,GAME_VERSION} from './game';
import type {Role,PlaceId} from './story';
export const LOST_AFTER=45000,IDLE_AFTER=180000;
const msg=(id:string,p:any,kind:string,body:string,at:number,noteId:string|null=null)=>db().prepare('INSERT OR IGNORE INTO messages(id,participant_id,stage,place,kind,body,note_id,deliver_at) VALUES(?,?,?,?,?,?,?,?)').bind(id,p.id,p.stage,p.current_place||routeFor(p)[p.stage],kind,body,noteId,at);
const msgForNote=(id:string,p:any,kind:string,body:string,at:number,guard:string,noteId:string|null=null)=>db().prepare('INSERT OR IGNORE INTO messages(id,participant_id,stage,place,kind,body,note_id,deliver_at) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM notes WHERE id=? AND participant_id=?)').bind(id,p.id,p.stage,p.current_place||routeFor(p)[p.stage],kind,body,noteId,at,guard,p.id);
export function signal(p:any,now=Date.now()){if(p.left_session)return 'left';if(p.finished)return 'finished';if(p.last_seen&&now-p.last_seen>LOST_AFTER)return 'offline';if(p.last_activity&&now-p.last_activity>IDLE_AFTER)return 'idle';return 'online';}
export async function sourceFor(p:any){const visit=await db().prepare('SELECT source_id FROM visits WHERE participant_id=? AND stage=?').bind(p.id,p.stage).first<any>();return visit?.source_id?db().prepare('SELECT * FROM notes WHERE id=? AND room_id=?').bind(visit.source_id,p.room_id).first<any>():null;}
async function ensureScene(p:any){
 const id=`${p.id}:${p.stage}`,now=Date.now(),place=routeFor(p)[p.stage];
 const existing=await db().prepare('SELECT * FROM visits WHERE id=?').bind(id).first<any>();
 if(!existing){const source=p.stage===5?null:await db().prepare("SELECT n.* FROM notes n JOIN participants a ON a.id=n.participant_id WHERE n.room_id=? AND n.participant_id<>? AND n.place=? AND n.kind<>'choice' AND (a.stage>n.stage OR a.phase IN ('travel','finished') OR a.left_session=1) ORDER BY CASE n.kind WHEN 'photo' THEN 0 WHEN 'music' THEN 1 WHEN 'color' THEN 2 ELSE 3 END,n.created_at LIMIT 1").bind(p.room_id,p.id,place).first<any>();
 await db().prepare('INSERT OR IGNORE INTO visits(id,participant_id,stage,place,source_id,started_at) VALUES(?,?,?,?,?,?)').bind(id,p.id,p.stage,place,source?.id||null,now).run();}
 const visit=await db().prepare('SELECT * FROM visits WHERE id=?').bind(id).first<any>();const source=visit.source_id?await db().prepare('SELECT * FROM notes WHERE id=?').bind(visit.source_id).first<any>():null;
 const last=p.stage===5?await db().prepare('SELECT body FROM notes WHERE participant_id=? AND stage=4 ORDER BY created_at DESC LIMIT 1').bind(p.id).first<any>():null;const lines=scriptFor(p.role,p.stage,place,p.name,source,last?.body);let time=visit.started_at+1500;const statements=[];
 for(let i=0;i<lines.length;i++){statements.push(msg(`${id}:s${i}`,p,'script',lines[i],time));time+=canRead(lines[i].length)+1500;}
 if(source){statements.push(msg(`${id}:relay`,p,'relay','',time,source.id));time+=2200;}
 statements.push(db().prepare('UPDATE participants SET reply_at=? WHERE id=?').bind(time-700,p.id));await db().batch(statements);
}
export async function pulse(p:any,interacting:boolean){
 const now=Date.now();await db().prepare('UPDATE participants SET last_seen=?,last_activity=CASE WHEN ?=1 OR last_activity=0 THEN ? ELSE last_activity END WHERE id=?').bind(now,interacting?1:0,now,p.id).run();
 p=await db().prepare('SELECT p.*,r.code,r.story_version FROM participants p JOIN rooms r ON r.id=p.room_id WHERE p.id=?').bind(p.id).first<any>();
 const peer=await db().prepare('SELECT * FROM participants WHERE room_id=? AND id<>?').bind(p.room_id,p.id).first<any>();
 if(!p.left_session&&peer){
 if(p.phase==='waiting'||p.phase==='travel'&&p.due_at<=now){
 const route=routeFor(p),target=route[p.stage],occupied=target!=='cafe'&&await db().prepare("SELECT id FROM participants WHERE room_id=? AND id<>? AND current_place=? AND phase='active' AND left_session=0 AND last_seen>? AND last_activity>?").bind(p.room_id,p.id,target,now-LOST_AFTER,now-IDLE_AFTER).first();
 if(!occupied){const updated=await db().prepare("UPDATE participants SET phase=?,current_place=?,arrived=1,finished=?,due_at=0 WHERE id=? AND stage=? AND phase IN ('travel','waiting') AND (?='cafe' OR NOT EXISTS(SELECT 1 FROM participants q WHERE q.room_id=? AND q.id<>? AND q.current_place=? AND q.phase='active' AND q.left_session=0 AND q.last_seen>? AND q.last_activity>?))").bind(p.stage===5?'finished':'active',target,p.stage===5?1:0,p.id,p.stage,target,p.room_id,p.id,target,now-LOST_AFTER,now-IDLE_AFTER).run();if(updated.meta.changes){await db().prepare("UPDATE participants SET phase='travel',current_place='',due_at=? WHERE room_id=? AND id<>? AND current_place=? AND phase='active' AND (last_seen<? OR last_activity<?)").bind(now+2000,p.room_id,p.id,target,now-LOST_AFTER,now-IDLE_AFTER).run();p={...p,phase:p.stage===5?'finished':'active',current_place:target,arrived:1,finished:p.stage===5?1:0};await ensureScene(p);}}
 else{await db().batch([msg(`${p.id}:${p.stage}:hold`,p,'script','Секунду, у перехода постою. Потом двинемся.',now),db().prepare('UPDATE participants SET due_at=? WHERE id=?').bind(now+2000,p.id)]);}
 }
 if(p.phase==='active'||p.phase==='finished')await ensureScene(p);
 const status=signal(peer,now);if(p.observed_signal!==status){if(status!=='online'&&status!=='finished')await msg(`${p.id}:signal:${now}`,p,'signal',status==='left'?'Сигнал потерян. Собеседник отключился.':status==='idle'?'Сигнал потерян. Давно нет ответа.':'Сигнал потерян. Телефон не в сети.',now).run();else if(p.observed_signal&&p.observed_signal!=='online')await msg(`${p.id}:signal:${now}`,p,'signal',status==='finished'?'Собеседник дошёл до места встречи.':'Связь восстановлена.',now).run();await db().prepare('UPDATE participants SET observed_signal=? WHERE id=?').bind(status,p.id).run();}
 }
 // Scene creation updates reply_at; return the persisted row so the client
 // cannot enable its composer using the previous scene's deadline.
 return db().prepare('SELECT p.*,r.code,r.story_version FROM participants p JOIN rooms r ON r.id=p.room_id WHERE p.id=?').bind(p.id).first<any>();
}
export async function canReadNote(p:any,note:any){if(note.participant_id===p.id)return true;const peer=await db().prepare('SELECT finished,consent,left_session FROM participants WHERE room_id=? AND id<>?').bind(p.room_id,p.id).first<any>();if(p.finished&&peer?.finished)return true;return !!await db().prepare('SELECT id FROM messages WHERE participant_id=? AND note_id=? AND deliver_at<=?').bind(p.id,note.id,Date.now()).first();}
export async function gameState(p:any){const now=Date.now(),peer=await db().prepare('SELECT * FROM participants WHERE room_id=? AND id<>?').bind(p.room_id,p.id).first<any>();const unlocked=!!(p.finished&&peer?.finished),mutual=unlocked&&p.consent==='yes'&&peer.consent==='yes'&&!p.left_session&&!peer.left_session;
 const raw=await db().prepare('SELECT * FROM messages WHERE participant_id=? AND deliver_at<=? ORDER BY deliver_at,id').bind(p.id,now).all<any>();
 const future=await db().prepare('SELECT kind,deliver_at FROM messages WHERE participant_id=? AND deliver_at>? ORDER BY deliver_at,id LIMIT 1').bind(p.id,now).first<any>();
 const result=await db().prepare('SELECT * FROM notes WHERE room_id=? ORDER BY created_at,id').bind(p.room_id).all<any>();const visible=new Set(raw.results.map(m=>m.note_id));
 const notes=result.results.filter(n=>n.participant_id===p.id||unlocked||visible.has(n.id)).map(n=>({id:n.id,stage:n.stage,place:n.place,kind:n.kind,body:n.body,photo:n.photo_key?`/api/photo/${n.id}`:null,mine:n.participant_id===p.id,reply_to:n.reply_to,created_at:n.created_at}));
 const source=await sourceFor(p),route=routeFor(p);return {storyVersion:GAME_VERSION,serverTime:now,code:p.code,me:{id:p.id,name:p.name,role:p.role,stage:p.stage,arrived:!!p.arrived,finished:!!p.finished,consent:p.consent,left:!!p.left_session,phase:p.phase,place:route[p.stage],route,replyAt:p.reply_at,dueAt:p.due_at},peer:peer?{joined:true,finished:!!peer.finished,left:!!peer.left_session,status:signal(peer,now),declined:unlocked&&peer.consent==='no',...(unlocked?{route:routeFor(peer),routeUrl:yandexRoute(routeFor(peer))}:{}),...(mutual?{name:peer.name,detail:peer.detail}:{} )}:null,unlocked,mutual,notes,messages:raw.results.map(m=>({id:m.id,kind:m.kind,body:m.body,noteId:m.note_id,place:m.place,stage:m.stage,at:m.deliver_at})),typing:future?.kind==='script'&&future.deliver_at-now<2400,task:p.phase==='active'&&p.stage<5?taskFor(p.role,p.stage,route[p.stage],source):null,sourceId:source?.id||null};}
export async function submit(p:any,b:any,file:File|null){
 const now=Date.now();if(p.left_session||p.finished)return json({error:'Прогулка уже закончена.'},409);
 if(typeof b.requestId!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(b.requestId))return json({error:'Обнови страницу и повтори ответ.'},400);
 const id=await hash(p.id+':'+b.requestId);if(await db().prepare('SELECT id FROM notes WHERE id=? AND participant_id=?').bind(id,p.id).first())return json({ok:true});
 if(p.phase!=='active'||b.stage!==p.stage||now<p.reply_at)return json({error:'Сообщение ещё печатается.'},409);
 const route=routeFor(p),place=route[p.stage],source=await sourceFor(p),task=taskFor(p.role,p.stage,place,source),kind=b.kind||task.kind;
 if(!task.options.includes(kind))return json({error:'Такой ответ здесь недоступен.'},400);
 let body=String(b.body||'').trim();if(body.length>600||!body&&kind!=='photo')return json({error:'Напиши ответ, до 600 символов.'},400);
 let chosenRoute=route;if(p.stage===1){const option=String(b.choiceId);if(!['default','alternate'].includes(option))return json({error:'Выбери, куда пойти.'},400);chosenRoute=option==='alternate'?[...alternative[p.role as Role]]:[...defaults[p.role as Role]];body=task.choices.find(c=>c.id===option)!.label;}
 if(kind==='color'&&!/^.+ #[0-9a-fA-F]{6}$/.test(body))return json({error:'Выбери цвет.'},400);
 let key:string|null=null;const bucket=(await import('./server')).bucket();
 if(kind==='photo'){if(!file||typeof file.arrayBuffer!=='function'||file.type!=='image/jpeg'||file.size>2000000||file.size<10)return json({error:'Нужен JPEG до 2 МБ.'},400);const bytes=await file.arrayBuffer(),v=new Uint8Array(bytes);if(v[0]!==255||v[1]!==216||v[2]!==255)return json({error:'Файл не похож на JPEG.'},400);key=`${p.room_id}/${id}.jpg`;await bucket.put(key,bytes,{httpMetadata:{contentType:'image/jpeg'}});}
 const response=replyLine(kind,body,p.role),departure=walkLine(place,chosenRoute[p.stage+1]),reactionAt=now+1700,walkAt=reactionAt+canRead(response.length)+1200,due=walkAt+canRead(departure.length)+3000;
 try{const results=await db().batch([
 db().prepare("INSERT OR IGNORE INTO notes(id,room_id,participant_id,stage,place,kind,body,photo_key,reply_to,created_at) SELECT ?,?,?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM participants WHERE id=? AND phase='active' AND stage=?)").bind(id,p.room_id,p.id,p.stage,place,kind,body,key,source?.id||null,now,p.id,p.stage),
 msgForNote(`${id}:own`,p,'human','',now,id,id),msgForNote(`${id}:reaction`,p,'script',response,reactionAt,id),msgForNote(`${id}:walk`,p,'script',departure,walkAt,id),
 db().prepare("UPDATE participants SET stage=stage+1,phase='travel',current_place='',arrived=0,route_json=?,due_at=?,last_activity=?,last_seen=? WHERE id=? AND stage=? AND phase='active'").bind(JSON.stringify(chosenRoute),due,now,now,p.id,p.stage)
 ]);if(!results[0].meta.changes){const exists=await db().prepare('SELECT id FROM notes WHERE id=?').bind(id).first();if(key&&!exists)await bucket.delete(key);return json(exists?{ok:true}:{error:'Ответ уже отправлен.'},exists?200:409);}}
 catch(e){if(key&&!await db().prepare('SELECT id FROM notes WHERE id=?').bind(id).first())await bucket.delete(key);throw e;}
 return json({ok:true});
}
