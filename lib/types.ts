import type {Role,PlaceId,NoteKind} from './story';
export type Note={id:string;stage:number;place:PlaceId;kind:NoteKind;body:string;photo:string|null;mine:boolean;reply_to:string|null;created_at:number};
export type Message={id:string;kind:string;body:string;noteId:string|null;place:PlaceId;stage:number;at:number};
export type Task={kind:NoteKind;options:NoteKind[];prompt:string;placeholder:string;choices:{id:string;label:string}[]};
export type SessionState={storyVersion:number;serverTime:number;me:null|{id:string;name:string;role:Role;stage:number;arrived:boolean;finished:boolean;consent:string;left:boolean;phase:string;place:PlaceId;route:PlaceId[];replyAt:number;dueAt:number};code:string;peer:null|{joined:boolean;finished:boolean;left:boolean;status:string;declined:boolean;name?:string;detail?:string;route?:PlaceId[];routeUrl?:string};notes:Note[];unlocked:boolean;mutual:boolean;messages:Message[];typing:boolean;task:Task|null;sourceId:string|null};
export const emptyState:SessionState={storyVersion:3,serverTime:0,me:null,code:'',peer:null,notes:[],unlocked:false,mutual:false,messages:[],typing:false,task:null,sourceId:null};
