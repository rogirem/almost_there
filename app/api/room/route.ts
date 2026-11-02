import {db,hash,token,json,checkOrigin,auth} from '../../../lib/server';
export async function POST(req:Request){try{
 checkOrigin(req); const b=await req.json() as {name:string;action:string;code?:string};
 if(typeof b.name!=='string'||b.name.trim().length<1||b.name.length>40)return json({error:'Напиши имя, до 40 символов'},400);
 const current=await auth(req);if(current&&!current.left_session&&!current.finished)return json({error:'Сначала заверши текущую прогулку'},409);
 const secret=token(),id=crypto.randomUUID();let roomId,code,role;
 if(b.action==='create'){
 roomId=crypto.randomUUID();code=Array.from(crypto.getRandomValues(new Uint8Array(10)),x=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[x%31]).join('');role='A';
 await db().batch([db().prepare('INSERT INTO rooms(id,code,created_at,story_version) VALUES(?,?,?,3)').bind(roomId,code,Date.now()),db().prepare('INSERT INTO participants(id,room_id,role,token_hash,name) VALUES(?,?,?,?,?)').bind(id,roomId,role,await hash(secret),b.name.trim())]);
 }else if(b.action==='join'){
 code=String(b.code||'').toUpperCase().replace(/[\s-]/g,'');const room=await db().prepare('SELECT id,story_version FROM rooms WHERE code=?').bind(code).first<any>();if(!room)return json({error:'Такого кода нет. Проверь его у второго участника.'},404);
 if(room.story_version!==3)return json({error:'Это код предыдущей версии. Создай новую прогулку.'},409);roomId=room.id;role='B';
 const result=await db().prepare("INSERT OR IGNORE INTO participants(id,room_id,role,token_hash,name) SELECT ?,?,'B',?,? WHERE EXISTS(SELECT 1 FROM participants WHERE room_id=? AND role='A' AND left_session=0 AND finished=0)").bind(id,roomId,await hash(secret),b.name.trim(),roomId).run();if(!result.meta.changes)return json({error:'В этой прогулке уже двое или она завершена. Создай новую.'},409);
 }else return json({error:'Неизвестное действие'},400);
 return Response.json({ok:true},{headers:{'Set-Cookie':`piter_session=${secret}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${new URL(req.url).protocol==='https:'?'; Secure':''}`,'Cache-Control':'no-store'}});
 }catch(e){console.error('room',e instanceof Error?e.message:'error');return json({error:'Не удалось войти. Попробуй ещё раз.'},500);}}
