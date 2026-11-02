import {Camera,Check,Mail,MessageSquare,Music2,Palette,Radio,Type,ArrowUpRight,MapPin} from 'lucide-react';
import {places,mapKeys,colorFromBody,type Role,type PlaceId,type NoteKind} from '../lib/story';
import routeData from '../lib/route-data.json';
import type {Note} from '../lib/types';
export function Brand(){return <span className="brand"><span className="brand-mark"><Radio size={21}/></span><span>почти рядом<small>ПЕТЕРБУРГ · СООБЩЕНИЯ ЧЕРЕЗ ВРЕМЯ</small></span></span>}
export function KindIcon({kind,size=20}:{kind:NoteKind;size?:number}){const Icon=kind==='photo'?Camera:kind==='music'?Music2:kind==='color'?Palette:kind==='caption'?Type:kind==='choice'?Check:MessageSquare;return <Icon size={size}/>}
export const kindLabels:Record<NoteKind,string>={photo:'Фото',text:'Своими словами',color:'Цвет',caption:'Название кадра',music:'Песня',choice:'Быстрый ответ',reply:'Ответить'};
const project=(point:number[])=>[55+(point[0]-30.2943)*51000,35+(59.9275-point[1])*57000];
export function MapArt({role='A',active,visited=[],onSelect}:{role?:Role;active?:PlaceId;visited?:PlaceId[];onSelect?:(p:PlaceId)=>void}){
 const path=routeData.routes[role].geometry.map((p,i)=>{const [x,y]=project(p);return `${i?'L':'M'}${x.toFixed(1)},${y.toFixed(1)}`}).join(' ');
 return <svg className="city-map" viewBox="0 0 480 465" role="img" aria-label="Маршрут по пешеходным улицам Коломны на основе OpenStreetMap">
 <defs><pattern id={'street-'+role} width="60" height="54" patternTransform="rotate(-12)" patternUnits="userSpaceOnUse"><path d="M4 4h43v37H4z" fill="#e0e4d5"/><path d="M13 12h25v20H13z" fill="#ebede3"/></pattern></defs>
 <rect width="480" height="465" fill="#edf0e4"/><rect width="480" height="465" fill={'url(#street-'+role+')'}/>
 <path d="M-30 187 Q155 190 222 40 T490-20M-40 350Q105 390 230 325T510 100" stroke="#b3c9c0" strokeWidth="15" fill="none" opacity=".7"/>
 <path d={path} stroke="#fcfdf3" strokeWidth="12" fill="none" strokeLinejoin="round"/>
 <path d={path} stroke="#577b59" strokeWidth="2.5" strokeDasharray="5 4" fill="none" strokeLinejoin="round"/>
 {mapKeys.map((key,i)=>{const p=places[key],[x,y]=project(routeData.points[key]);const current=key===active;return <g key={key} className={onSelect?'map-point interactive':'map-point'} role={onSelect?'button':undefined} tabIndex={onSelect?0:undefined} aria-label={p.name} onClick={()=>onSelect?.(key)} onKeyDown={e=>{if(onSelect&&(e.key==='Enter'||e.key===' ')){e.preventDefault();onSelect(key)}}}>{current&&<circle className="map-pulse" cx={x} cy={y} r="21" fill="#588354" opacity=".2"/>}<circle cx={x} cy={y} r={current?12:9} fill={current||visited.includes(key)?'#365e43':'#f8faef'} stroke="#476e45" strokeWidth="1.5"/><text x={x} y={y+3} textAnchor="middle" fill={current||visited.includes(key)?'#fff':'#476e45'} fontSize="9" fontFamily="monospace">{key==='cafe'?'Ф':i+1}</text><text x={x>300?x-17:x+17} y={y-8} textAnchor={x>300?'end':'start'} className="map-label">{key==='cafe'?'Никольские ряды':key==='lendok'?'ЛЕНДОК':p.name}</text></g>})}
 <text x="20" y="444" className="map-caption">© OPENSTREETMAP · ПЕШЕХОДНЫЙ ПУТЬ</text><text x="20" y="459" className="map-caption">РЕАЛЬНЫЙ МАРШРУТ / ФОН СХЕМАТИЧЕСКИЙ</text>
 </svg>
}
export function PhonePreview(){return <div className="preview-phone"><div className="sms-status"><span>▂▄▆ GSM</span><span>17.09.2006</span><span>▰</span></div><div className="preview-contact"><Mail size={20}/><span>Маша<small>Новое сообщение</small></span></div><div className="preview-feed"><div className="sms incoming">привет :) выйдешь?<time>18:42</time></div><div className="sms incoming">Хочу увидеть город твоими глазами. Ты у какого моста?<time>18:43</time></div><div className="sms outgoing">Сейчас покажу.<time>18:43 ✓</time></div><div className="preview-photo"><Camera size={26}/><span>Прикрепить MMS</span><span className="pixel-cursor">▮</span></div><p>GPRS соединение установлено</p></div><div className="softkeys"><span>Функции</span><strong>Ответить</strong><span>Назад</span></div></div>}
export function NoteBubble({note,speaker,onReply,source}:{note:Note;speaker:string;onReply?:(n:Note)=>void;source?:Note}){return <article className={'sms note-message '+(note.mine?'outgoing':'incoming')}>
 <span className="bubble-author">{note.mine?'Ты':speaker}<span>{note.kind==='photo'?'MMS':note.kind==='music'?'♪':note.kind==='color'?'ЦВЕТ':'SMS'}</span></span>
 {source&&<blockquote>{source.photo?'Ответ на фотографию':source.body.slice(0,95)}</blockquote>}
 {note.photo&&<a href={note.photo} target="_blank" rel="noreferrer" aria-label="Открыть фотографию"><img src={note.photo} alt={note.body||'Фото из переписки'}/></a>}
 {note.kind==='color'&&<div className="received-color" style={{background:colorFromBody(note.body)}}><Palette size={24}/></div>}
 {note.body&&<p>{note.kind==='color'?note.body.replace(/\s*#[0-9a-fA-F]{6}/,''):note.body}</p>}
 {note.kind==='music'&&<a className="music-link" href={`https://music.yandex.ru/search?text=${encodeURIComponent(note.body)}`} target="_blank" rel="noreferrer"><Music2 size={14}/> Найти и послушать <ArrowUpRight size={13}/></a>}
 <div className="bubble-bottom"><time>{note.mine?'Доставлено ✓':'Получено'}</time>{!note.mine&&onReply&&<button className="reply-link" onClick={()=>onReply(note)}>Ответить ↗</button>}</div>
 </article>}
export function PlaceLine({place}:{place:PlaceId}){return <><MapPin size={14}/>{places[place].name}</>}
