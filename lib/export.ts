import {places,type PlaceId} from './story';
type ExportNote={body:string;photo:string|null;mine:boolean;place:PlaceId;kind:string};
export async function saveAlbum(notes:ExportNote[]){
 await document.fonts.ready;
 const canvas=document.createElement('canvas'),c=canvas.getContext('2d')!;canvas.width=1400;
 const wrap=(text:string,width:number)=>{const words=text.split(/\s+/);const lines:string[]=[];let line='';for(const word of words){if(c.measureText(line+word).width>width&&line){lines.push(line.trim());line='';}if(c.measureText(word).width>width){for(const ch of word){if(c.measureText(line+ch).width>width){lines.push(line);line=''}line+=ch;}line+=' ';}else line+=word+' ';}if(line)lines.push(line.trim());return lines;};
 c.font='25px "PT Serif", Georgia';
 const cards=notes.map(n=>{const lines=wrap(n.body||'Без подписи. Просто запомнить.',535);return {n,lines,height:Math.max(200,105+lines.length*33+(n.photo?260:0))};});
 const rows:number[]=[];for(let i=0;i<cards.length;i+=2)rows.push(Math.max(cards[i].height,cards[i+1]?.height||0)+30);
 canvas.height=890+rows.reduce((a,b)=>a+b,0);c.fillStyle='#eeecdf';c.fillRect(0,0,1400,canvas.height);c.fillStyle='#284c3b';c.font='68px "PT Serif",Georgia';c.fillText('Мы были почти рядом.',80,115);c.font='18px "IBM Plex Mono",monospace';c.fillText('ПЕТЕРБУРГ / ДВА ВЗГЛЯДА НА ОДИН ГОРОД',85,166);
 c.fillStyle='#e1e4d5';c.fillRect(80,210,1240,550);c.strokeStyle='#f7f5e9';c.lineWidth=12;for(let x=100;x<1300;x+=90){c.beginPath();c.moveTo(x,210);c.lineTo(x+120,760);c.stroke();}for(let y=250;y<760;y+=80){c.beginPath();c.moveTo(80,y);c.lineTo(1320,y-70);c.stroke();}
 c.strokeStyle='#aabfba';c.lineWidth=17;c.beginPath();c.moveTo(80,570);c.bezierCurveTo(480,700,690,300,1320,360);c.stroke();c.beginPath();c.moveTo(340,210);c.lineTo(580,760);c.stroke();
 const points=Object.entries(places);c.setLineDash([6,9]);c.strokeStyle='#6f886d';c.lineWidth=2;c.beginPath();points.forEach(([,p],i)=>{const x=150+p.x*12,y=220+p.y*6;i?c.lineTo(x,y):c.moveTo(x,y)});c.stroke();c.setLineDash([]);
 points.forEach(([id,p],i)=>{const x=150+p.x*12,y=220+p.y*6;c.fillStyle='#41664e';c.beginPath();c.arc(x,y,17,0,Math.PI*2);c.fill();c.fillStyle='#fff';c.font='15px sans-serif';c.textAlign='center';c.fillText(String(i+1),x,y+5);c.textAlign=p.x>60?'right':'left';c.fillStyle='#34533e';c.font='20px "Golos Text",sans-serif';c.fillText(p.name,x+(p.x>60?-26:26),y+6);const count=notes.filter(n=>n.place===id).length;if(count){c.font='13px sans-serif';c.fillText(`${count} ${count===1?'след':'следа'} от вас`,x+(p.x>60?-26:26),y+27);}});
 c.textAlign='left';c.font='14px "IBM Plex Mono",monospace';c.fillStyle='#839078';c.fillText('СХЕМА ВОСПОМИНАНИЙ / РАСПОЛОЖЕНИЕ УСЛОВНОЕ',100,740);
 let y=810;for(let i=0;i<cards.length;i++){const {n,lines,height}=cards[i],x=80+(i%2)*640;c.fillStyle=n.mine?'#faf9f0':'#e3ead7';c.fillRect(x,y,600,height);c.fillStyle='#718468';c.font='15px "Golos Text",sans-serif';c.fillText(places[n.place].name.toUpperCase(),x+22,y+33);c.font='13px "IBM Plex Mono",monospace';c.fillText(n.mine?'ТВОЙ ВЗГЛЯД':'ДРУГОЙ ВЗГЛЯД',x+22,y+57);let ty=y+100;
 if(n.photo){const img=new Image();img.src=n.photo;await img.decode();const scale=Math.min(555/img.width,235/img.height);c.drawImage(img,x+22,y+76,img.width*scale,img.height*scale);ty+=260;}
 c.fillStyle='#314a36';c.font='25px "PT Serif",Georgia';lines.forEach((line,j)=>c.fillText(line,x+22,ty+j*33));if(i%2===1)y+=rows[Math.floor(i/2)];}
 if(!notes.length){c.font='27px "PT Serif",Georgia';c.fillStyle='#526647';c.fillText('Иногда достаточно просто пройти этот путь.',85,825);}
 const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('Export failed');const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='pochti-ryadom.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
