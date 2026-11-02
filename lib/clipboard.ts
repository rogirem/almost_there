/** Keep the synchronous copy inside the click gesture for desktop Safari and embedded browsers. */
export async function copyText(value:string):Promise<boolean>{
 const previous=document.activeElement as HTMLElement|null;
 const area=document.createElement('textarea');area.value=value;area.readOnly=true;
 Object.assign(area.style,{position:'fixed',top:'0',left:'0',width:'2px',height:'2px',opacity:'0'});
 document.body.appendChild(area);area.focus();area.select();area.setSelectionRange(0,value.length);
 const onCopy=(event:ClipboardEvent)=>{if(event.clipboardData){event.clipboardData.setData('text/plain',value);event.preventDefault();}};
 document.addEventListener('copy',onCopy);
 let copied=false;try{copied=document.execCommand('copy');}catch{/* Use the standard API below when supported. */}finally{document.removeEventListener('copy',onCopy);area.remove();previous?.focus();}
 if(copied)return true;
 try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(value);return true;}}catch{/* The always-visible code field provides manual copy. */}
 return false;
}
