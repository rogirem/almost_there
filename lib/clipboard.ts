/** Start the standard clipboard write in the original click gesture. */
export async function copyText(value:string):Promise<boolean>{
 if(navigator.clipboard?.writeText){
  try{await navigator.clipboard.writeText(value);return true;}catch{}
 }
 // Older SMS-style webviews may only support the synchronous copy command.
 const previous=document.activeElement as HTMLElement|null;
 const area=document.createElement('textarea');area.value=value;area.readOnly=true;
 Object.assign(area.style,{position:'fixed',top:'0',left:'0',width:'2px',height:'2px',opacity:'0'});
 document.body.appendChild(area);area.focus();area.select();area.setSelectionRange(0,value.length);
 const onCopy=(event:ClipboardEvent)=>{if(event.clipboardData){event.clipboardData.setData('text/plain',value);event.preventDefault();}};
 document.addEventListener('copy',onCopy);
 try{return document.execCommand('copy');}catch{return false;}
 finally{document.removeEventListener('copy',onCopy);area.remove();previous?.focus();}
}
