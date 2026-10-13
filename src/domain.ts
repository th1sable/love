export const moods = ['😊 Felice', '😔 Triste', '😴 Stanco', '😣 Stressato', '🥺 Mi manchi', '🌿 Sereno'];
export const needs = ['💬 Parlare', '🫂 Un abbraccio', '🤝 Compagnia', '🌙 Un po’ di spazio'];
export const gestures = ['💭 Ti penso', '🫂 Ti abbraccio', '😚 Un bacio', '🥺 Mi manchi'];
export const sections = ['Calendario', 'Liste', 'Idee per uscire', 'Obiettivi'] as const;
// Read old reminders without discarding users' saved content.
export type Section = typeof sections[number] | 'Promemoria';
export type EventKind = 'status' | 'gesture' | 'diary' | 'calendar' | 'reminder' | 'list' | 'idea' | 'goal';
export const shouldNotifyPartner = (kind: EventKind) => kind === 'status' || kind === 'gesture';
export type Status = { mood: string; need: string; thought: string; updatedAt: string };
export type Page = { id: string; title: string; date: string; body: string; favorite: boolean };
export type Item = { id: string; section: Section; title: string; detail: string; done: boolean; deadline?: string; notes?: string; time?: string };
export type Gesture = { id: string; text: string; createdAt: string };
export type Photo = { id:string; path:string; date:string; width:number; height:number };
export type Album = { id:string; title:string; date:string; photos:Photo[] };
export type State = { name: string; partnerName: string; status: Status | null; pages: Page[]; items: Item[]; gestures: Gesture[]; albums?:Album[] };
export const emptyState: State = { name: '', partnerName: '', status: null, pages: [], items: [], gestures: [], albums:[] };
export const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00`);
  return !Number.isNaN(parsed.getTime()) && parsed.getFullYear() === Number(value.slice(0,4)) && parsed.getMonth()+1 === Number(value.slice(5,7)) && parsed.getDate() === Number(value.slice(8,10));
}
export function isState(value: unknown): value is State {
  if (!value || typeof value !== 'object') return false;
  const v = value as State;
  return typeof v.name === 'string' && typeof v.partnerName === 'string' &&
    (v.status === null || (typeof v.status?.mood === 'string' && typeof v.status?.need === 'string' && typeof v.status?.thought === 'string' && typeof v.status?.updatedAt === 'string')) &&
    Array.isArray(v.pages) && v.pages.every(p => p != null && typeof p.id === 'string' && typeof p.title === 'string' && isValidDate(p.date) && typeof p.body === 'string' && typeof p.favorite === 'boolean') &&
    Array.isArray(v.items) && v.items.every(i => i != null && typeof i.id === 'string' && [...sections,'Promemoria'].includes(i.section) && typeof i.title === 'string' && typeof i.detail === 'string' && typeof i.done === 'boolean' && (i.deadline===undefined||isValidDate(i.deadline)) && (i.notes===undefined||typeof i.notes==='string') && (i.time===undefined||/^([01]\d|2[0-3]):[0-5]\d$/.test(i.time))) &&
    Array.isArray(v.gestures) && v.gestures.every(g => g != null && typeof g.id === 'string' && typeof g.text === 'string' && typeof g.createdAt === 'string') &&
    (v.albums===undefined||(Array.isArray(v.albums)&&v.albums.every(isAlbum)));
}
export function isAlbum(value:unknown):value is Album {
  if(!value||typeof value!=='object')return false;
  const a=value as Album;
  return typeof a.id==='string'&&typeof a.title==='string'&&a.title.trim().length>0&&a.title.length<=160&&isValidDate(a.date)&&Array.isArray(a.photos)&&a.photos.length<=60&&new Set(a.photos.map(p=>p?.id)).size===a.photos.length&&a.photos.every(p=>p&&typeof p.id==='string'&&typeof p.path==='string'&&/^(local:[a-f0-9-]{36}|[a-f0-9-]{36}\/[a-f0-9-]{36}\/[a-f0-9-]{36}\.jpg)$/.test(p.path)&&isValidDate(p.date)&&Number.isInteger(p.width)&&p.width>0&&Number.isInteger(p.height)&&p.height>0);
}
