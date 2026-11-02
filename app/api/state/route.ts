import {auth,state,json} from '../../../lib/server';
import {gameState} from '../../../lib/game-server';
export async function GET(req:Request){try{const p=await auth(req);return json(p?p.story_version===3?await gameState(p):await state(p):{me:null});}catch{return json({error:'Связь прервалась. Мы попробуем снова.'},503);}}
