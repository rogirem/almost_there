import {auth,json,checkOrigin} from '../../../lib/server';
import {pulse,gameState} from '../../../lib/game-server';
export async function POST(req:Request){try{checkOrigin(req);const p=await auth(req);if(!p)return json({me:null});if(p.story_version!==3)return json({legacy:true});const body=await req.json() as {interacting?:boolean};return json(await gameState(await pulse(p,body.interacting===true)));}catch(e){console.error('pulse',e instanceof Error?e.message:e);return json({error:'Нет связи с сервером.'},503);}}
