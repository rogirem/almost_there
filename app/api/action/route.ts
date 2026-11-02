import {auth,db,bucket,json,checkOrigin,routes,taskKinds,hash} from '../../../lib/server';
import {tasks,type Role,type NoteKind} from '../../../lib/story';
import {submit} from '../../../lib/game-server';
export async function POST(req:Request){try{
 checkOrigin(req);const p=await auth(req);if(!p)return json({error:'Сначала войди в прогулку'},401);
 const isFile=req.headers.get('content-type')?.includes('multipart/form-data');let b:any,file:File|null=null;
 if(isFile){const form=await req.formData();b=Object.fromEntries(form.entries());file=form.get('photo') as File|null;b.stage=Number(b.stage);}else b=await req.json();
 if(b.action==='logout'){await db().prepare('UPDATE participants SET left_session=1 WHERE id=?').bind(p.id).run();return Response.json({ok:true},{headers:{'Set-Cookie':'piter_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'}});}
 if(p.left_session)return json({error:'Эта прогулка завершена'},409);
 if(b.action==='leave'){await db().prepare('UPDATE participants SET left_session=1 WHERE id=?').bind(p.id).run();return json({ok:true});}
 const peer=await db().prepare('SELECT id,finished,left_session,consent FROM participants WHERE room_id=? AND id<>?').bind(p.room_id,p.id).first<any>();
 if(b.action==='consent'){
 if(!p.finished||!peer?.finished)return json({error:'Дождёмся обоих в финале'},409);
 if(!['yes','no'].includes(b.value))return json({error:'Выбери ответ'},400);
 const detail=String(b.detail||'').trim();if(detail.length>120)return json({error:'Описание должно быть короче 120 символов'},400);
 await db().prepare('UPDATE participants SET consent=?,detail=? WHERE id=?').bind(b.value,detail,p.id).run();return json({ok:true});
 }
 if(p.story_version===3){if(b.action!=='note')return json({error:'Действие недоступно.'},400);return await submit(p,b,file);}
 if(p.story_version!==2)return json({error:'Эта прогулка начата в предыдущей версии. Создай новую.'},409);
 if(!peer||peer.left_session)return json({error:peer?'Другой участник завершил прогулку':'Ждём второго участника'},409);
 if(p.finished)return json({error:'Ты уже в финале'},409);
 if(b.stage!==p.stage)return json({error:'Этап уже изменился. Обнови страницу.'},409);
 if(b.action==='arrive'){
 await db().prepare('UPDATE participants SET arrived=1,finished=? WHERE id=? AND stage=?').bind(p.stage===5?1:0,p.id,p.stage).run();return json({ok:true});}
 if(b.action==='next'){
 if(!p.arrived)return json({error:'Сначала отметь прибытие'},409);
 await db().prepare('UPDATE participants SET stage=stage+1,arrived=0 WHERE id=? AND stage=? AND stage<5').bind(p.id,p.stage).run();return json({ok:true});}
 if(b.action!=='note'||!p.arrived||p.stage>=5)return json({error:'Сейчас нельзя отправить заметку'},400);
 let kind:NoteKind=b.kind||taskKinds[p.role as Role][p.stage];let replyTo=null;
 if(kind!=='reply'&&!tasks[p.role as Role][p.stage].options.includes(kind))return json({error:'Этот ответ сейчас недоступен'},400);
 if(b.replyTo){const source=await db().prepare('SELECT * FROM notes WHERE id=? AND room_id=? AND participant_id<>?').bind(b.replyTo,p.room_id,p.id).first<any>();if(!source)return json({error:'Сообщение пока недоступно'},400);if(kind!=='caption'&&!(kind==='photo'&&source.kind==='color'))kind='reply';if(kind==='caption'&&source.kind!=='photo')return json({error:'Название можно дать фотографии'},400);replyTo=source.id;}
 const body=String(b.body||'').trim();if(body.length>600)return json({error:'Не больше 600 символов'},400);
 if(kind!=='photo'&&!body)return json({error:'Добавь несколько слов'},400);
 if(kind==='color'&&!/#[0-9a-fA-F]{6}/.test(body))return json({error:'Выбери цвет в палитре'},400);
 if(kind!=='reply'){const existing=await db().prepare('SELECT id FROM notes WHERE participant_id=? AND stage=? AND kind=?').bind(p.id,p.stage,kind).first();if(existing)return json({ok:true});}
 else if(!replyTo)return json({error:'Выбери сообщение для ответа'},400);
 let key:string|null=null;const id=typeof b.requestId==='string'&&/^[a-zA-Z0-9-]{16,80}$/.test(b.requestId)?await hash(p.id+':'+b.requestId):crypto.randomUUID();
 if(kind==='photo'){
 if(!file||typeof file.arrayBuffer!=='function'||file.size>2_000_000||file.size<10||file.type!=='image/jpeg')return json({error:'Нужна фотография JPEG до 2 МБ'},400);
 const data=await file.arrayBuffer(),bytes=new Uint8Array(data);if(bytes[0]!==255||bytes[1]!==216||bytes[2]!==255)return json({error:'Не удалось прочитать фотографию'},400);
 key=`${p.room_id}/${id}.jpg`;await bucket().put(key,data,{httpMetadata:{contentType:'image/jpeg'}});
 }
 try{const res=await db().prepare('INSERT OR IGNORE INTO notes(id,room_id,participant_id,stage,place,kind,body,photo_key,reply_to,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(id,p.room_id,p.id,p.stage,routes[p.role as Role][p.stage],kind,body,key,replyTo,Date.now()).run();if(!res.meta.changes&&key)await bucket().delete(key);}catch(e){if(key)await bucket().delete(key);throw e;}
 return json({ok:true});
 }catch(e){console.error('action',e instanceof Error?e.message:'error');return json({error:'Не получилось сохранить. Попробуй ещё раз.'},500);}}
