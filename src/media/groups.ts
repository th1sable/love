import type { Album, Photo } from '../domain';
export type GalleryMode='Album'|'Giorni'|'Mesi'|'Anni';
export function albumGroups(albums:Album[],mode:GalleryMode){
  const sorted=[...albums].sort((a,b)=>b.date.localeCompare(a.date)||a.title.localeCompare(b.title));
  const result=new Map<string,Album[]>();
  for(const a of sorted){const key=mode==='Anni'?a.date.slice(0,4):mode==='Mesi'?a.date.slice(0,7):a.date;result.set(key,[...(result.get(key)??[]),a]);}
  return [...result].map(([key,albums])=>({key,albums}));
}
export function decodePhoto(base64:string):Uint8Array{
  // Works on Hermes as well as browsers, without assuming a global atob polyfill.
  if(base64.length%4||!/^[A-Za-z0-9+/]*={0,2}$/.test(base64))throw new Error('La foto non contiene dati validi.');
  const padding=base64.endsWith('==')?2:base64.endsWith('=')?1:0;
  const result=new Uint8Array(base64.length/4*3-padding);const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let bits=0,value=0,index=0;for(const c of base64){if(c==='=')break;value=(value<<6)|alphabet.indexOf(c);bits+=6;if(bits>=8){bits-=8;result[index++]=(value>>bits)&255;value&=(1<<bits)-1;}}
  return result;
}
export function photoGroups(albums:Album[],mode:Exclude<GalleryMode,'Album'>){
  const photos=[...new Map(albums.flatMap(a=>a.photos).map(p=>[p.id,p])).values()].sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
  const result=new Map<string,Photo[]>();for(const p of photos){const key=mode==='Anni'?p.date.slice(0,4):mode==='Mesi'?p.date.slice(0,7):p.date;result.set(key,[...(result.get(key)??[]),p]);}
  return [...result].map(([key,photos])=>({key,photos}));
}
