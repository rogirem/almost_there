import {Camera,Check,MessageSquare,Music2,Palette,Radio,Type} from 'lucide-react';
import type {NoteKind} from '../lib/story';
export function Brand(){return <span className="brand"><span className="brand-mark"><Radio size={21}/></span><span>почти рядом<small>ПЕТЕРБУРГ · SMS ИЗ 2006-ГО</small></span></span>;}
export function KindIcon({kind,size=20}:{kind:NoteKind;size?:number}){const Icon=kind==='photo'?Camera:kind==='music'?Music2:kind==='color'?Palette:kind==='caption'?Type:kind==='choice'?Check:MessageSquare;return <Icon size={size}/>;}
export const kindLabels:Record<NoteKind,string>={photo:'Фото',text:'Своими словами',color:'Цвет',caption:'Название кадра',music:'Песня',choice:'Выбрать ответ',reply:'Ответить'};
