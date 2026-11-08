'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {ArrowRight,ArrowUpRight,Camera,Check,Copy,Download,MapPin,Menu,Music2,Send,X,WifiOff,Volume2,VolumeX} from 'lucide-react';
import {Brand,KindIcon,kindLabels} from '../components/Ui';
import {character,places,yandexRoute} from '../lib/game';
import {palette,colorFromBody,type NoteKind} from '../lib/story';
import {emptyState,type SessionState,type Note} from '../lib/types';
import {copyText} from '../lib/clipboard';
import {saveCollage} from '../lib/collage';

async function compress(file: File) {
 const url=URL.createObjectURL(file);
 try {
  const img=new Image();img.src=url;await img.decode();
  const scale=Math.min(1,1300/Math.max(img.width,img.height)),canvas=document.createElement('canvas');
  canvas.width=img.width*scale;canvas.height=img.height*scale;canvas.getContext('2d')!.drawImage(img,0,0,canvas.width,canvas.height);
  return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error()),'image/jpeg',.82));
 } finally {URL.revokeObjectURL(url);}
}
export default function Home() {
 const [s,setS]=useState<SessionState>(emptyState),[loading,setLoading]=useState(true),[offline,setOffline]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const [entry,setEntry]=useState<'create'|'join'>('create'),[name,setName]=useState(''),[code,setCode]=useState(''),[agreed,setAgreed]=useState(false);
 const [text,setText]=useState(''),[kind,setKind]=useState<NoteKind>('text'),[photo,setPhoto]=useState<Blob|null>(null),[preview,setPreview]=useState('');
 const [menu,setMenu]=useState(false),[leave,setLeave]=useState(false),[copied,setCopied]=useState(false),[manual,setManual]=useState(false),[detail,setDetail]=useState(''),[sound,setSound]=useState(false),[toast,setToast]=useState('');
 const feed=useRef<HTMLDivElement>(null),file=useRef<HTMLInputElement>(null),composer=useRef<HTMLTextAreaElement>(null),dialog=useRef<HTMLElement>(null);
 const interacting=useRef(true),request=useRef<{key:string,id:string}|null>(null),pendingRefresh=useRef<Promise<void>|null>(null),scrollNear=useRef(true),audio=useRef<AudioContext|null>(null),lastCount=useRef(0);
 const me=s.me,role=me?.role??'A',legacy=s.storyVersion!==3,task=s.task,ready=me?.phase==='active'&&!!task&&s.serverTime>=me.replyAt&&!busy&&!offline;
 const refresh=useCallback(async(force=false)=>{
  if(pendingRefresh.current){await pendingRefresh.current;if(!force)return;}
  const job=(async()=>{
   try {
    const response=await fetch('/api/pulse',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({interacting:interacting.current}),signal:AbortSignal.timeout(12000)});
    const data=await response.json() as SessionState&{legacy?:boolean};if(!response.ok)throw Error();
    if(data.legacy){const r=await fetch('/api/state');setS({...emptyState,...await r.json() as SessionState});}else setS({...emptyState,...data});
    interacting.current=false;setOffline(false);
   } catch {setOffline(true);} finally {setLoading(false);}
  })();
  pendingRefresh.current=job;await job;if(pendingRefresh.current===job)pendingRefresh.current=null;
 },[]);
 useEffect(()=>{
  void refresh();const timer=setInterval(()=>{if(!document.hidden)void refresh();},1800);
  const touch=()=>{interacting.current=true;};
  const visibility=()=>{if(!document.hidden){interacting.current=true;void refresh();}};
  window.addEventListener('pointerdown',touch);window.addEventListener('keydown',touch);document.addEventListener('visibilitychange',visibility);
  return()=>{clearInterval(timer);window.removeEventListener('pointerdown',touch);window.removeEventListener('keydown',touch);document.removeEventListener('visibilitychange',visibility);};
 },[refresh]);
 useEffect(()=>{const c=new URLSearchParams(location.search).get('code');if(c){setCode(c);setEntry('join');history.replaceState({},'',location.pathname);}},[]);
 useEffect(()=>{setKind(s.task?.kind||'text');setText('');setPhoto(null);request.current=null;},[me?.stage,s.task?.kind]);
 useEffect(()=>{if(!photo){setPreview('');return;}const url=URL.createObjectURL(photo);setPreview(url);return()=>URL.revokeObjectURL(url);},[photo]);
 const scrollToEnd=useCallback(()=>{if(scrollNear.current&&feed.current)requestAnimationFrame(()=>feed.current?.scrollTo({top:feed.current.scrollHeight,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}));},[]);
 useEffect(()=>{
  scrollToEnd();
  if(s.messages.length>lastCount.current&&sound&&audio.current){const ctx=audio.current,o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.frequency.value=940;g.gain.value=.02;o.start();g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.15);o.stop(ctx.currentTime+.16);}
  lastCount.current=s.messages.length;
 },[s.messages.length,s.typing,s.unlocked,s.mutual,sound,scrollToEnd]);
 useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),3000);return()=>clearTimeout(timer);},[toast]);
 useEffect(()=>{if(composer.current){composer.current.style.height='auto';composer.current.style.height=Math.min(120,composer.current.scrollHeight)+'px';}},[text,ready]);
 useEffect(()=>{
  const viewport=window.visualViewport;if(!viewport)return;
  const resize=()=>document.documentElement.style.setProperty('--chat-height',viewport.height+'px');resize();viewport.addEventListener('resize',resize);
  return()=>{viewport.removeEventListener('resize',resize);document.documentElement.style.removeProperty('--chat-height');};
 },[]);
 useEffect(()=>{
  if(!menu)return;const previous=document.activeElement as HTMLElement;dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();
  const keys=(e:KeyboardEvent)=>{
   if(e.key==='Escape'){setMenu(false);setLeave(false);}
   if(e.key==='Tab'){
    const items=Array.from(dialog.current?.querySelectorAll<HTMLElement>('button,a,input')||[]).filter(el=>!el.hasAttribute('disabled'));
    if(e.shiftKey&&document.activeElement===items[0]){e.preventDefault();items.at(-1)?.focus();}
    else if(!e.shiftKey&&document.activeElement===items.at(-1)){e.preventDefault();items[0]?.focus();}
   }
  };
  document.addEventListener('keydown',keys);return()=>{document.removeEventListener('keydown',keys);previous?.focus();};
 },[menu]);
 async function post(url:string,body:unknown){
  if(busy)return false;setBusy(true);setError('');
  try {
   const r=await fetch(url,{method:'POST',headers:body instanceof FormData?{}:{'Content-Type':'application/json'},body:body instanceof FormData?body:JSON.stringify(body),signal:AbortSignal.timeout(25000)});
   const result=await r.json() as {error?:string};if(!r.ok)throw Error(result.error||'Не получилось отправить.');
   interacting.current=true;await refresh(true);return true;
  } catch(e){setError(e instanceof Error?e.message:'Не получилось отправить.');return false;} finally {setBusy(false);}
 }
 const act=(action:string,extra:Record<string,unknown>={})=>post('/api/action',{action,...extra});
 async function send(value=text,choiceId?:string){
  if(!me||!ready)return;const bodyText=value.trim(),key=JSON.stringify([kind,bodyText,choiceId,photo?.size]);
  if(request.current?.key!==key)request.current={key,id:crypto.randomUUID()};
  let payload:Record<string,unknown>|FormData={action:'note',stage:me.stage,kind,body:bodyText,choiceId,requestId:request.current.id};
  if(kind==='photo'){if(!photo)return;const f=new FormData();Object.entries(payload).forEach(([k,v])=>{if(v!==undefined)f.set(k,String(v));});f.set('photo',photo,'photo.jpg');payload=f;}
  scrollNear.current=true;if(await post('/api/action',payload)){setText('');setPhoto(null);request.current=null;}
 }
 async function copy(){const ok=await copyText(s.code);setCopied(ok);setManual(!ok);if(ok)setToast('Код скопирован');}
 async function toggleSound(){try{if(!sound){audio.current??=new AudioContext();await audio.current.resume();}setSound(!sound);}catch{setToast('Звук недоступен в этом браузере');}}
 async function download(){if(!me||!s.mutual||!s.peer?.route)return;setBusy(true);setError('');try{await saveCollage(s.notes,role,me.name,s.peer.name||'Второй участник',me.route,s.peer.route);}catch{setError('Не получилось собрать карту. Попробуй ещё раз.');}finally{setBusy(false);}}
 async function reset(){if(await act('logout')){setMenu(false);setLeave(false);setAgreed(false);setCopied(false);}}
 function noteContent(n:Note){return <>
  {n.photo&&<a href={n.photo} target="_blank" rel="noreferrer" aria-label="Открыть фотографию"><img src={n.photo} alt={n.body.slice(0,120)||'Фотография с этой точки'} loading="lazy" decoding="async" onLoad={scrollToEnd}/></a>}
  {n.kind==='color'&&<div className="v3-color" style={{background:colorFromBody(n.body)}} aria-label={n.body.replace(/\s*#[\da-fA-F]{6}/,'')}/>}
  {n.body&&<p>{n.body.replace(/\s*#[\da-fA-F]{6}/,'')}</p>}
  {n.kind==='music'&&<a className="v3-music" href={`https://music.yandex.ru/search?text=${encodeURIComponent(n.body)}`} target="_blank" rel="noreferrer"><Music2 size={16}/> Послушать <ArrowUpRight size={14}/></a>}
 </>;}
 const peerLost=s.peer&&['offline','idle','left'].includes(s.peer.status),finishedMessages=s.messages.some(m=>m.stage===5)&&s.serverTime>=(me?.replyAt||0);
 if(loading)return <div className="v3-boot"><Brand/><p>Подключаемся…</p></div>;
 if(!me)return <div className="v3-entry">
  <header><Brand/><span>ДЛЯ ДВУХ ТЕЛЕФОНОВ</span></header>
  <main><section><span className="v3-kicker">КОЛОМНА, ПЕТЕРБУРГ · 2006</span><h1>Ты где?<br/>Я у львов :)</h1><p>Незнакомый номер зовёт тебя на кофе.<br/>На другом конце провода 2006 год.</p>
   <div className="v3-cover-sms"><small>МАША · ВХОДЯЩЕЕ SMS</small><p>Я у Львиного. Есть полчаса пройтись?<br/>К Садовой выйдем, там и кофе найдём :)</p></div>
   <p className="v3-small">Играем за столом. По городу идти не нужно.<br/>Каждому нужен свой телефон. Около 7 минут на переписку.</p>
  </section><form onSubmit={e=>{e.preventDefault();void post('/api/room',{action:entry,name,code});}}>
   <div className="v3-entry-tabs"><button type="button" className={entry==='create'?'selected':''} onClick={()=>setEntry('create')}>Создать прогулку</button><button type="button" className={entry==='join'?'selected':''} onClick={()=>setEntry('join')}>Войти по коду</button></div>
   <label>Твоё имя<input required autoComplete="given-name" maxLength={40} value={name} onChange={e=>setName(e.target.value)} placeholder="Как к тебе обращаться?"/></label>
   {entry==='join'&&<label>Код прогулки<input required autoComplete="off" autoCapitalize="characters" spellCheck={false} value={code} onChange={e=>setCode(e.target.value.toUpperCase())} maxLength={15} placeholder="10 символов"/></label>}
   <label className="v3-check"><input type="checkbox" required checked={agreed} onChange={e=>setAgreed(e.target.checked)}/><span>Разрешаю показать мои фото и ответы второму участнику. Встречаться в конце необязательно.</span></label>
   <button className="v3-primary" disabled={!agreed||busy||offline}>{busy?'Подключаем…':'Начать'}<ArrowRight size={20}/></button>
   {error&&<p className="v3-error" role="alert">{error}</p>}{offline&&<p className="v3-error">Нет связи. <button type="button" onClick={()=>void refresh()}>Повторить</button></p>}
   <p className="v3-small">Если играете на одном компьютере, откройте второй<br/>сеанс в другом браузере или приватном окне.</p>
  </form></main>
 </div>;
 return <div className="v3-app"><aside className="v3-desktop"><Brand/><p>17 сентября<br/>2006</p><span>На связи {character(role)}.<br/>В конце встретимся у Садовой, 62.</span><button onClick={()=>setMenu(true)}>О прогулке <ArrowUpRight size={16}/></button></aside>
  <main className="v3-phone"><header className="v3-header"><span className={'v3-dot '+(peerLost||offline?'lost':'')}/><strong>{character(role)}</strong><small>{offline?'нет интернета':peerLost?'сигнал потерян':finishedMessages?'переписка завершена':s.typing?'печатает…':me.phase==='travel'?'идёт по улице':'SMS / 2006'}</small><button onClick={()=>void toggleSound()} aria-label={sound?'Выключить звук':'Включить звук'}>{sound?<Volume2 size={19}/>:<VolumeX size={19}/>}</button><button onClick={()=>setMenu(true)} aria-label="Меню прогулки"><Menu size={22}/></button></header>
   {offline&&<button className="v3-offline" onClick={()=>void refresh()}><WifiOff size={16}/> Нет интернета. Нажми, чтобы повторить.</button>}
   <div className="v3-feed" ref={feed} onScroll={()=>{if(feed.current)scrollNear.current=feed.current.scrollHeight-feed.current.scrollTop-feed.current.clientHeight<120;interacting.current=true;}}>
    {legacy?<section className="v3-inchat-card"><h2>Сценарий обновился</h2><p>Эта прогулка началась в старой версии. Можно начать новую.</p><button className="v3-primary" onClick={()=>void reset()}>Новая прогулка <ArrowRight size={18}/></button></section>
     :!s.peer?me.left?<section className="v3-inchat-card"><h2>Сигнал потерян</h2><p>Ты вышел из прогулки.</p><button className="v3-primary" onClick={()=>void reset()}>На главную <ArrowRight size={18}/></button></section>:<section className="v3-inchat-card v3-wait"><h2>Позови второго человека</h2><p>Пусть откроет этот сайт на своём телефоне<br/>и выберет «Войти по коду».</p><label>КОД ПРОГУЛКИ<input readOnly value={s.code} onFocus={e=>e.currentTarget.select()} aria-label="Код прогулки"/></label><button className="v3-primary" onClick={()=>void copy()}>{copied?<Check size={18}/>:<Copy size={18}/>} {copied?'Код скопирован':'Скопировать код'}</button>{manual&&<p>Браузер не разрешил копирование. Выдели код выше и нажми Ctrl+C или ⌘C.</p>}<small>Когда вы будете вдвоём, придёт первое SMS.</small></section>:<>
      {s.messages.map((m,index)=>{
       const n=m.noteId?s.notes.find(n=>n.id===m.noteId):undefined;if(m.noteId&&!n)return null;
       const human=n&&s.unlocked,previous=s.messages.slice(0,index).findLast(previous=>previous.kind!=='signal');
       return <div key={m.id}>{m.kind!=='signal'&&(!previous||previous.place!==m.place)&&<div className="v3-place-marker"><MapPin size={15}/><span>{places[m.place]?.name}</span></div>}
        {m.kind==='signal'?<p className="v3-signal"><span>▂▁</span>{m.body}</p>:<article className={'v3-bubble '+(m.kind==='human'?'out':'in')+(human?(n.mine?' real-mine':' real-peer'):'')} data-human={human?'true':undefined}>
         {n?noteContent(n):<p>{m.body}</p>}<small>{human?(n.mine?'Твоё сообщение':s.mutual?s.peer?.name:'Со второго телефона'):new Date(m.at).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Moscow'})}{m.kind==='human'?' ✓':''}</small>
        </article>}
       </div>;
      })}
      {s.typing&&<div className="v3-typing" role="status" aria-label="Собеседник печатает"><i/><i/><i/></div>}
      {me.left&&<section className="v3-inchat-card"><h2>Сигнал потерян</h2><p>Ты вышел из прогулки.</p><button className="v3-primary" onClick={()=>void reset()}>На главную <ArrowRight size={18}/></button></section>}
      {!me.left&&me.finished&&finishedMessages&&(!s.unlocked?<section className="v3-final"><p>Второй человек ещё в пути. Подождём его здесь.</p>{peerLost&&<p>Связь с ним потеряна. Можно подождать или выйти через меню.</p>}</section>:<section className="v3-final">
       <p className="v3-bubble in">Маша и Дима остались в 2006-м. А цветные сообщения присылали вы друг другу. Теперь можно познакомиться :)</p>
       <div className="v3-legend"><span className="mine">Твои сообщения</span><span className="peer">Со второго телефона</span></div>
       {s.mutual?<><h2>{s.peer.name}</h2><p>{s.peer.detail||'Можно убрать телефоны и поздороваться :)'}</p>{s.peer.left&&<p>Собеседник завершил прогулку. Общая карта всё ещё доступна.</p>}<button className="v3-primary" disabled={busy} onClick={()=>void download()}><Download size={19}/>{busy?'Собираем карту…':'Скачать общую карту PNG'}</button><a className="v3-route-link" href={s.peer.routeUrl} target="_blank" rel="noreferrer"><MapPin size={18}/> Маршрут второго участника<ArrowUpRight size={17}/></a></>
        :s.peer.left?<p>Второй человек вышел из прогулки. Переписка останется здесь.</p>
        :s.peer.declined||me.consent==='no'?<p>На этом закончим. Переписку можно перечитать выше.</p>
        :me.consent==='yes'?<><p>Твоё «да» отправлено. Ждём ответ.</p><button className="v3-text" disabled={busy} onClick={()=>void act('consent',{value:'no'})}>Передумать</button></>
        :<><h2>Встретимся?</h2><input value={detail} onChange={e=>setDetail(e.target.value)} maxLength={120} placeholder="Как тебя узнать? Например, зелёный свитер" aria-label="Как тебя узнать"/><small className="v3-hint">Примета по желанию. Её увидят только после двух «да».</small><div className="v3-choices"><button disabled={busy} onClick={()=>void act('consent',{value:'yes',detail})}>Да, давай :) <ArrowRight size={19}/></button><button disabled={busy} onClick={()=>void act('consent',{value:'no'})}>Закончу на этом</button></div></>}
       {s.peer.routeUrl&&!s.mutual&&<a className="v3-route-link" href={s.peer.routeUrl} target="_blank" rel="noreferrer">Маршрут второго участника <ArrowUpRight size={17}/></a>}
       <button className="v3-text" onClick={()=>void reset()}>Завершить прогулку</button>
      </section>)}
     </>}
   </div>
   {error&&<div className="v3-error" role="alert">{error}<button aria-label="Закрыть ошибку" onClick={()=>setError('')}><X size={17}/></button></div>}
   {ready&&!me.left&&task&&(kind==='choice'?<div className="v3-inline-choices">{task.choices.map(choice=><button key={choice.id} disabled={busy} onClick={()=>void send(choice.label,choice.id)}>{choice.label}<ArrowRight size={19}/></button>)}</div>
    :<div className="v3-compose">
     {preview&&<div className="v3-selected-photo"><img src={preview} alt="Выбранная фотография"/><button onClick={()=>setPhoto(null)} aria-label="Убрать фото"><X size={17}/></button></div>}
     {kind==='color'&&<div className="v3-palette">{palette.map(color=><button key={color.hex} style={{background:color.hex}} aria-label={color.name} aria-pressed={text.includes(color.hex)} onClick={()=>setText(color.name+' '+color.hex)}>{text.includes(color.hex)&&<Check size={20}/>}</button>)}</div>}
     <div className="v3-compose-row"><input className="v3-file" ref={file} type="file" accept="image/*" capture="environment" onChange={async e=>{const f=e.target.files?.[0];if(!f)return;setBusy(true);try{setPhoto(await compress(f));setKind('photo');}catch{setError('Не удалось открыть фото. Попробуй JPEG или PNG.');}finally{setBusy(false);e.target.value='';}}}/>
      {task.options.includes('photo')&&<button className={kind==='photo'&&!photo?'v3-camera-pulse':''} aria-label="Прикрепить фотографию" onClick={()=>{setKind('photo');file.current?.click();}}><Camera size={23}/></button>}
      <textarea ref={composer} value={text} onChange={e=>setText(e.target.value)} maxLength={600} placeholder={kind==='photo'?'Подпись к фото':task.placeholder||'Твоё сообщение'} aria-label="Твоё сообщение" rows={1}/>
      <button className="v3-send" disabled={kind==='photo'?!photo:!text.trim()} aria-label="Отправить" onClick={()=>void send()}><Send size={21}/></button>
     </div>
     {task.options.length>1&&<div className="v3-tools">{task.options.filter(k=>k!=='photo').map(k=><button key={k} aria-pressed={kind===k} className={kind===k?'selected':''} onClick={()=>{setKind(k);setText('');setPhoto(null);}}><KindIcon kind={k} size={15}/>{kindLabels[k]}</button>)}</div>}
    </div>)}
  </main>
  {menu&&<div className="v3-overlay" onClick={()=>{setMenu(false);setLeave(false);}}><section ref={dialog} className="v3-menu" role="dialog" aria-modal="true" aria-label="Меню прогулки" onClick={e=>e.stopPropagation()}>
   <button className="v3-close" aria-label="Закрыть меню" onClick={()=>setMenu(false)}><X size={24}/></button><h2>Прогулка</h2>
   <p>Играем за столом. Между SMS есть паузы. После ответа следующая точка откроется сама, нажимать ничего не нужно.</p>
   <p>Ты пишешь от своего имени. Фото, слова и музыку увидит второй человек, когда дойдёт до того же места.</p>
   <p>Если закрыть вкладку или три минуты ничего не делать, на другом телефоне появится «сигнал потерян». При возвращении связь восстановится.</p>
   {me.route&&<a className="v3-route-link" href={yandexRoute(me.route)} target="_blank" rel="noreferrer">Мой маршрут в Яндекс Картах <ArrowUpRight size={17}/></a>}
   {!me.finished&&!me.left&&(leave?<div className="v3-leave"><p>Выйти? Другой человек увидит, что связь оборвалась.</p><button className="v3-danger" disabled={busy} onClick={async()=>{if(await act('leave')){setMenu(false);setLeave(false);}}}>Да, выйти</button><button className="v3-text" onClick={()=>setLeave(false)}>Остаться</button></div>:<button className="v3-text" onClick={()=>setLeave(true)}>Выйти из прогулки</button>)}
  </section></div>}
  {toast&&<div className="v3-toast" role="status">{toast}</div>}
 </div>;
}
