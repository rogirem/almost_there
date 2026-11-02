import {places} from './game';
import {colorFromBody,type PlaceId,type Role} from './story';
import type {Note} from './types';
import geo from './route-data.json';
export async function saveCollage(notes:Note[],role:Role,ownName:string,otherName:string,myRoute:PlaceId[],otherRoute:PlaceId[]){
 await document.fonts.ready;const canvas=document.createElement('canvas');canvas.width=1800;let c=canvas.getContext('2d')!;
 const colors={A:'#39728B',B:'#B37343'},mine=colors[role],theirs=colors[role==='A'?'B':'A'];
 function lines(text:string,width:number){const out:string[]=[];let line='';for(const word of text.split(/\s+/)){if(c.measureText(line+word).width>width&&line){out.push(line.trim());line='';}if(c.measureText(word).width>width){for(const letter of word){if(c.measureText(line+letter).width>width){out.push(line);line='';}line+=letter;}line+=' ';}else line+=word+' ';}if(line)out.push(line.trim());return out;}
 const keys=[...new Set([...myRoute,...otherRoute])],actualPlaces=keys.filter(k=>k!=='cafe');c.font='24px "Golos Text",Arial';
 const rows=actualPlaces.map(place=>{const pair=[true,false].map(side=>{const n=notes.find(n=>n.place===place&&n.mine===side),text=n?.body.replace(/\s*#[0-9a-fA-F]{6}/,'')||'Здесь без сообщения';const l=lines(text,n?.photo?505:n?.kind==='color'?590:745);return {n,lines:l,height:Math.max(265,95+l.length*31)};});return {place,pair,height:75+Math.max(...pair.map(p=>p.height))};});
 canvas.height=880+rows.reduce((total,row)=>total+row.height,0);c=canvas.getContext('2d')!;
 c.fillStyle='#F1F0E5';c.fillRect(0,0,1800,canvas.height);c.fillStyle='#253E2C';c.font='600 62px "Golos Text",Arial';c.fillText('Питер FM / наша прогулка',75,115);c.font='24px "Golos Text",Arial';c.fillStyle=mine;c.fillText(ownName,80,167);c.fillStyle=theirs;c.fillText(otherName,930,167);
 c.fillStyle='#E1E7D8';c.fillRect(70,215,1660,530);
 const point=(key:PlaceId)=>{const coords=(geo.points as Record<string,number[]>)[key];return [180+(coords[0]-30.2943)*180000,255+(59.9275-coords[1])*61000];};
 const drawRoute=(route:PlaceId[],color:string,offset:number)=>{c.strokeStyle=color;c.lineWidth=4;c.setLineDash([10,7]);c.beginPath();route.forEach((key,i)=>{const [x,y]=point(key);i?c.lineTo(x+offset,y):c.moveTo(x+offset,y)});c.stroke();c.setLineDash([]);};
 drawRoute(myRoute,mine,-5);drawRoute(otherRoute,theirs,5);
 keys.forEach((key,i)=>{const [x,y]=point(key);c.fillStyle='#f8faef';c.strokeStyle='#68805e';c.lineWidth=2;c.beginPath();c.arc(x,y,15,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#365532';c.font='17px Arial';c.textAlign='center';c.fillText(String(i+1),x,y+6);c.textAlign=x>1200?'right':'left';c.font='21px "Golos Text",Arial';c.fillText(places[key].name,x+(x>1200?-23:23),y-18);});c.textAlign='left';c.fillStyle='#71816A';c.font='16px Arial';c.fillText('Схема по координатам. Линии показывают порядок мест, а не пешеходную дорогу.',90,725);
 let y=790;for(const {place,pair,height} of rows){const number=keys.indexOf(place)+1;c.fillStyle='#536B48';c.font='500 25px "Golos Text",Arial';c.fillText(`${number}. ${places[place].name}`,80,y+25);
 for(let side=0;side<2;side++){const x=side===0?80:930,color=side===0?mine:theirs,{n,lines:l}=pair[side];c.fillStyle='#FAFAF1';c.fillRect(x,y+45,790,height-65);c.strokeStyle=color;c.lineWidth=3;c.strokeRect(x,y+45,790,height-65);c.fillStyle=color;c.font='17px "Golos Text",Arial';c.fillText(side===0?ownName:otherName,x+20,y+75);let textX=x+20;
 if(n?.photo){const img=new Image();img.src=n.photo;await img.decode();const crop=Math.max(220/img.width,190/img.height);c.save();c.beginPath();c.rect(x+20,y+95,220,190);c.clip();c.drawImage(img,x+20,y+95,img.width*crop,img.height*crop);c.restore();textX=x+260;}
 if(n?.kind==='color'){c.fillStyle=colorFromBody(n.body);c.fillRect(x+20,y+95,120,100);textX=x+165;}
 c.fillStyle=n?'#304229':'#87937B';c.font='24px "Golos Text",Arial';l.forEach((line,j)=>c.fillText(line,textX,y+120+j*31));
 }y+=height;}
 c.fillStyle='#71816A';c.font='18px Arial';c.fillText('Фото, музыка и слова в цветных рамках отправлены участниками.',80,canvas.height-35);
 const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('Не удалось собрать PNG');const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='piter-fm-nasha-progulka.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
