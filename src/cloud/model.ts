import { emptyState, isState, type State, type Status } from '../domain.ts';
export type Kind='status'|'gesture'|'diary'|'item'|'profile';
export type Entry={id:string;kind:Kind;payload:Record<string,unknown>;version:number;author_id:string;updated_at:string};
export type Member={user_id:string;display_name:string};
export type Space={id:string;members:Member[];entries:Entry[]};
export type Change={id:string;kind:Kind;payload:Record<string,unknown>;expected_version:number};
export function readSpace(value:unknown):Space|null {
  if(value===null)return null;
  if(!value||typeof value!=='object')throw new Error('Lo spazio ricevuto non e valido.');
  const v=value as Space;
  const kinds:Kind[]=['status','gesture','diary','item','profile'];
  if(typeof v.id!=='string'||!Array.isArray(v.members)||!Array.isArray(v.entries)||
    !v.members.every(m=>m&&typeof m.user_id==='string'&&typeof m.display_name==='string')||
    !v.entries.every(e=>e&&typeof e.id==='string'&&kinds.includes(e.kind)&&e.payload&&typeof e.payload==='object'&&
      Number.isInteger(e.version)&&e.version>0&&typeof e.author_id==='string'&&typeof e.updated_at==='string'))throw new Error('I dati ricevuti non sono validi.');
  return v;
}
export function projectSpace(space:Space,userId:string):{state:State;partnerStatus:Status|null} {
  const state:State={...emptyState,pages:[],items:[],gestures:[],name:space.members.find(m=>m.user_id===userId)?.display_name??'',partnerName:space.members.find(m=>m.user_id!==userId)?.display_name??''};
  let partnerStatus:Status|null=null;
  for(const e of space.entries){
    if(e.kind==='profile'){
      if(typeof e.payload.name!=='string')throw new Error('Nome ricevuto non valido.');
      if(e.id===userId)state.name=e.payload.name;else state.partnerName=e.payload.name;
    }else if(e.kind==='status'){
      const status={...e.payload,updatedAt:e.updated_at} as Status;
      if(!isState({...emptyState,status}))throw new Error('Stato ricevuto non valido.');
      if(e.id===userId)state.status=status;else partnerStatus=status;
    }else if(e.kind==='diary')state.pages.push({...e.payload,id:e.id} as State['pages'][number]);
    else if(e.kind==='item')state.items.push({...e.payload,id:e.id} as State['items'][number]);
    else if(e.kind==='gesture')state.gestures.push({id:e.id,text:String(e.payload.text??''),createdAt:e.updated_at});
  }
  if(!isState(state))throw new Error('I contenuti dello spazio non sono validi.');
  state.gestures.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  return {state,partnerStatus};
}
// There are no deletion operations yet. Keep newer versions when responses arrive out of order.
export function mergeSpace(previous:Space|null,incoming:Space):Space {
  if(!previous||previous.id!==incoming.id)return incoming;
  const records=new Map(previous.entries.map(e=>[`${e.kind}:${e.id}`,e]));
  for(const e of incoming.entries){const key=`${e.kind}:${e.id}`;if((records.get(key)?.version??0)<=e.version)records.set(key,e);}
  const members=new Map(previous.members.map(m=>[m.user_id,m]));for(const m of incoming.members)members.set(m.user_id,m);
  return {...incoming,members:[...members.values()],entries:[...records.values()]};
}
export function diffState(before:State,after:State,space:Space,userId:string):Change[]{
  const changes:Change[]=[];
  const add=(kind:Kind,id:string,payload:Record<string,unknown>)=>changes.push({kind,id,payload,expected_version:space.entries.find(e=>e.kind===kind&&e.id===id)?.version??0});
  if(before.name!==after.name)add('profile',userId,{name:after.name});
  if(JSON.stringify(before.status)!==JSON.stringify(after.status)&&after.status){const {mood,need,thought}=after.status;add('status',userId,{mood,need,thought});}
  for(const page of after.pages){if(JSON.stringify(before.pages.find(p=>p.id===page.id))!==JSON.stringify(page)){const {id,...payload}=page;add('diary',id,payload);}}
  for(const item of after.items){if(JSON.stringify(before.items.find(i=>i.id===item.id))!==JSON.stringify(item)){const {id,...payload}=item;add('item',id,payload);}}
  for(const gesture of after.gestures){if(!before.gestures.some(g=>g.id===gesture.id))add('gesture',gesture.id,{text:gesture.text});}
  return changes;
}
