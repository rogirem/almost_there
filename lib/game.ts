import {places, character, type PlaceId, type Role, type NoteKind} from './story';
export {places, character};
export const GAME_VERSION = 3;
export const defaults: Record<Role, PlaceId[]> = {
 A: ['lion','torgovy','lendok','sobor','sevens','cafe'],
 B: ['sobor','sevens','lion','torgovy','lendok','cafe'],
};
export const alternative: Record<Role, PlaceId[]> = {
 A: ['lion','torgovy','sevens','sobor','lendok','cafe'],
 B: ['sobor','sevens','torgovy','lion','lendok','cafe'],
};
export function routeFor(p: any): PlaceId[] {
 try {
  const route = JSON.parse(p.route_json);
  if (Array.isArray(route) && route.length === 6 && route.every(k => Object.hasOwn(places,k)) && new Set(route.slice(0,5)).size === 5 && route[5] === 'cafe') return route;
 } catch {}
 return defaults[p.role as Role];
}
export function yandexRoute(route: PlaceId[]) {
 const coordinates: Record<PlaceId,string> = {lion:'59.926905,30.301405',torgovy:'59.92457,30.29562',lendok:'59.924118,30.296854',sobor:'59.922566,30.299943',sevens:'59.92191,30.29872',cafe:'59.92092,30.30156',holland:'59.929643,30.289633'};
 return 'https://yandex.ru/maps/?mode=routes&rtt=pd&rtext=' + route.map(k => coordinates[k]).join('~');
}
export function routeOptions(role: Role) {
 return role === 'A'
  ? [{id:'default',label:'К киностудии',detail:'Сначала вдоль Крюкова канала'},{id:'alternate',label:'К семи мостам',detail:'Сначала к Пикалову мосту'}]
  : [{id:'default',label:'Сначала ко львам',detail:'Вдоль канала Грибоедова'},{id:'alternate',label:'Сначала к фонарям',detail:'Через Торговый мост'}];
}
export function taskFor(role: Role, stage: number, place: PlaceId, source?: any) {
 if (stage === 1) return {kind:'choice' as NoteKind,options:['choice'] as NoteKind[],prompt:'Куда пойдём?',placeholder:'',choices:routeOptions(role).map(({id,label}) => ({id,label}))};
 if (stage === 4) return {kind:'text' as NoteKind,options:['text','choice'] as NoteKind[],prompt:'Что закажешь?',placeholder:'Мне, пожалуйста…',choices:[{id:'tea',label:'Чай, пожалуйста.'},{id:'coffee',label:'Кофе. И что-нибудь поесть :)'}]};
 if (source?.kind === 'photo') return {kind:'caption' as NoteKind,options:['caption','text'] as NoteKind[],prompt:'Как назовёшь этот кадр?',placeholder:'Я бы назвал это…',choices:[]};
 if (source?.kind === 'music') return {kind:'music' as NoteKind,options:['music','text'] as NoteKind[],prompt:'Что поставим следом?',placeholder:'Исполнитель, песня или ответ',choices:[]};
 if (source?.kind === 'color') return {kind:'photo' as NoteKind,options:['photo','text'] as NoteKind[],prompt:'Найди этот цвет рядом',placeholder:'Где ты его заметил?',choices:[]};
 if (stage === 0 && role === 'B') return {kind:'music' as NoteKind,options:['music','color','text'] as NoteKind[],prompt:'Что включить, пока ждём?',placeholder:'Исполнитель и название',choices:[]};
 if (stage === 0) return {kind:'photo' as NoteKind,options:['photo','text'] as NoteKind[],prompt:'Покажи, где ты',placeholder:'Подпись к фото',choices:[]};
 if (place === 'lendok') return {kind:'photo' as NoteKind,options:['photo','text'] as NoteKind[],prompt:'Сними деталь у входа',placeholder:'На что смотреть?',choices:[]};
 if (place === 'sobor') return {kind:'music' as NoteKind,options:['music','color','text'] as NoteKind[],prompt:'Какую песню сюда поставим?',placeholder:'Исполнитель и название',choices:[]};
 return {kind:'text' as NoteKind,options:['text','photo','music'] as NoteKind[],prompt:'Что ты заметил?',placeholder:'Я здесь заметил…',choices:[]};
}
function relayIntro(source: any) {
 if (source.kind === 'photo') return 'Вот мой кадр отсюда. Сейчас пришлю.';
 if (source.kind === 'music') return 'Я здесь обычно включаю вот это.';
 if (source.kind === 'color') return 'У меня здесь всё вот такого цвета. Смотри.';
 return 'Записка про это место у меня сохранилась. Вот:';
}
function sourceQuestion(source: any) {
 if (source.kind === 'photo') return 'Как бы ты назвал этот снимок? У меня пока просто «вечер» :)';
 if (source.kind === 'music') return 'Что поставим следом? Можно совсем другое, я не обижусь :)';
 if (source.kind === 'color') return 'А рядом с тобой есть что-нибудь такого цвета? Покажи. Или напиши, если снимать неудобно.';
 return 'А ты что здесь первым делом замечаешь?';
}
export function scriptFor(role: Role, stage: number, place: PlaceId, name: string, source?: any, lastAnswer?: string): string[] {
 if (stage === 5) {
  const drink = /чай/i.test(lastAnswer || '') ? 'Чай помню.' : /кофе/i.test(lastAnswer || '') ? 'Кофе помню.' : '';
  return [`Я у Садовой, 62. ${drink} Телефон убираю, а то опять мимо друг друга пройдём. До встречи :)`];
 }
 const branch = role === 'A'
  ? 'Отсюда можно к киностудии или к Пикалову. Куда сначала? Выбирай, я сегодня никуда не спешу.'
  : 'Теперь решай: вдоль канала ко львам или к фонарям Торгового? Я пойду за тобой :)';
 const coffee = 'Дальше уже к Садовой, 62. Адрес больше не меняем. Ты за чаем или за кофе?';
 if (stage === 1) return [source ? relayIntro(source) : role === 'A' ? 'Я у Торгового. Перешла мост и поняла, что нужно было остаться на том берегу. Бывает :D' : 'На Пикаловом насчитали семь мостов. У меня выходит шесть. Один, видимо, прячется.', branch];
 if (stage === 4) return [source ? relayIntro(source) : role === 'A' ? 'Уже руки мёрзнут. Я за кофе и за то, чтобы наконец сесть.' : 'До кафе совсем немного. Я бы уже сел, если честно :)', coffee];
 if (stage === 0) return role === 'A'
  ? [`Привет, ${name}. Это Маша. Я у Львиного моста. Есть полчаса пройтись до Садовой? Потом зайдём на кофе.`, 'Я с фотоаппаратом, но плёнку жалко тратить :) Покажи, что у тебя перед глазами. С телефона тоже можно.']
  : [`Привет, ${name}, это Дима. Я у Никольского. Пойдём через Коломну на Садовую? У меня диск для тебя и свободный вечер.`, 'Пока стою у ограды, плеер заело на одной песне. Что поставить вместо неё? Название запишу.'];
 const starts: Record<PlaceId,string> = {
  lion:'Я у львов. Тут всё время хочется трогать цепь. Каждый раз себя останавливаю :)',
  torgovy:'На Торговом включили фонари. Теперь, по крайней мере, видно, куда наступать.',
  lendok:'Киностудия, Крюков канал, 12. У входа кто-то тащит штатив. Кажется, я мешаю.',
  sobor:'У Никольского тихо. Можно минуту посидеть у ограды. Я пока не двигаюсь.',
  sevens:'Я на Пикаловом. Лодка сейчас чуть не задела мост крышей. Все на берегу разом втянули головы :D',
  cafe:'Я на месте.',holland:'Я у канала.',
 };
 const first = starts[place] + (source ? ' ' + relayIntro(source) : '');
 const next = source ? sourceQuestion(source) : place === 'lendok'
  ? 'Сними здесь какую-нибудь мелочь. Ручку, табличку, окно. Хочу потом сверить, на что мы вообще смотрим.'
  : place === 'sobor' ? 'Какую песню сюда поставить? Можно назвать цвет, если с музыкой ничего не приходит.'
  : 'Что тебе здесь первым бросилось в глаза? Можно парой слов, можно кадром.';
 return [first,next];
}
export type SceneItem = {kind:'script'|'relay'|'signal';body:string;delay:number};
export function sceneFor(role: Role, stage: number, place: PlaceId, name: string, source?: any, lastAnswer?: string): SceneItem[] {
 const lines = scriptFor(role,stage,place,name,source,lastAnswer);
 const items: SceneItem[] = [{kind:'script',body:lines[0],delay:1500}];
 // Keep an attachment next to its introduction, before the next question.
 if (source && stage !== 5) items.push({kind:'relay',body:'',delay:2500});
 if (lines[1]) items.push({kind:'script',body:lines[1],delay:source ? 12000 : Math.max(12000,Math.min(22000,lines[0].length*80))});
 if (stage === 5) items.push({kind:'signal',body:'Сигнал 2006 года потерян.',delay:canRead(lines[0].length)+3000});
 return items;
}
export function replyLine(kind: string, body: string, role: Role, stage?: number) {
 const short = body.replace(/\s+/g,' ').slice(0,75) + (body.length > 75 ? '…' : '');
 if (stage === 4) return /чай/i.test(body) ? 'Чай так чай. Я спрошу, есть ли у них что-нибудь к чаю.' : /кофе/i.test(body) ? 'Кофе. И мне тоже, а то я уже засыпаю на ходу :)' : 'Ладно, у стойки ещё раз посмотрим, что у них есть.';
 if (kind === 'choice') return body.includes('киностудии') ? 'К киностудии. Давно хотела туда заглянуть :)' : body.includes('семи') ? 'Хорошо, сначала к Пикалову. Может, на этот раз все семь найду.' : body.includes('львам') ? 'Ко львам, значит. Там хоть точно знаю, где поворачивать.' : 'Давай к фонарям. Только берег не перепутай, я уже перепутал :D';
 if (kind === 'photo') return role === 'A' ? 'MMS дошло! Я бы на это даже не посмотрела. Подожди, ещё раз открою.' : 'MMS пришло. Вот эту деталь я и пропустил. Спасибо за кадр :)';
 if (kind === 'music') return `${role === 'A' ? 'Записала' : 'Записал'}: «${short}». На диске как раз осталось место для одной песни.`;
 if (kind === 'color') return 'Ага, теперь и я замечаю его на каждом шагу :)';
 if (kind === 'caption') return `«${short}». Да, пусть так и будет. Подпишу кадр.`;
 if (/холод|м[её]рз|зам[её]рз/i.test(body)) return 'Мне тоже холодно. До Садовой дойдём и первым делом закажем горячее.';
 if (/счита|шест|седьм|семь мост/i.test(body)) return 'У меня тоже каждый раз новое число получается :D При встрече сравним.';
 if (/тихо|вод[ау]|слуш|ветер/i.test(body)) return 'Сейчас тоже послушаю. Смотрю в телефон и половину всего пропускаю.';
 return role==='A' ? (stage===0?'Ага, представила :) Всё, теперь можем идти.':'Я бы, наверное, мимо прошла. Сейчас ещё раз посмотрю.') : (stage===0?'Ладно, пока без плеера. Тут и так есть что послушать.':'Ага. Я на другом берегу стою, попробую оттуда посмотреть.');
}
export function walkLine(from: PlaceId, to: PlaceId) {
 const lines: Partial<Record<PlaceId,string>> = {
  lion:'Идём к Львиному. По Грибоедова до четырёх белых львов. Там снова напишу.',
  torgovy:'Теперь к Торговому мосту, у Союза Печатников. Ориентир: четыре круглых фонаря.',
  lendok:'Заглянем к киностудии. Крюков канал, дом 12, рядом с Торговым. Напишу от входа.',
  sobor:'Пойдём к Никольскому собору. Там можно посидеть в сквере. Сейчас дойду и напишу.',
  sevens:'Дальше к Пикалову мосту. Хочу всё-таки найти седьмой. Буду там, напишу.',
  cafe:'Всё, к Садовой, 62. Встречаемся у входа, потом найдём столик.',
 };
 return lines[to] || 'Сейчас дойду и напишу.';
}
export function canRead(characters: number) { return Math.min(9000,Math.max(2200,characters*40)); }
