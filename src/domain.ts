export const moods = ['😊 Felice', '😔 Triste', '😴 Stanco', '😣 Stressato', '🥺 Mi manchi', '🌿 Sereno'];
export const needs = ['💬 Parlare', '🫂 Un abbraccio', '💛 Compagnia', '🌙 Un po’ di spazio'];
export const gestures = ['💛 Ti penso', '🫂 Ti abbraccio', '😘 Un bacio', '🥺 Mi manchi'];
export const sections = ['Calendario', 'Promemoria', 'Liste', 'Idee per uscire', 'Obiettivi'] as const;
export type Section = typeof sections[number];
export type EventKind = 'status' | 'gesture' | 'diary' | 'calendar' | 'reminder' | 'list' | 'idea' | 'goal';
export const shouldNotifyPartner = (kind: EventKind) => kind === 'status' || kind === 'gesture';
export type Status = { mood: string; need: string; thought: string; updatedAt: string };
export type Page = { id: string; title: string; date: string; body: string; favorite: boolean };
export type Item = { id: string; section: Section; title: string; detail: string; done: boolean };
export type Gesture = { id: string; text: string; createdAt: string };
export type State = { name: string; partnerName: string; status: Status | null; pages: Page[]; items: Item[]; gestures: Gesture[] };
export const emptyState: State = { name: '', partnerName: '', status: null, pages: [], items: [], gestures: [] };
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
    Array.isArray(v.items) && v.items.every(i => i != null && typeof i.id === 'string' && sections.includes(i.section) && typeof i.title === 'string' && typeof i.detail === 'string' && typeof i.done === 'boolean') &&
    Array.isArray(v.gestures) && v.gestures.every(g => g != null && typeof g.id === 'string' && typeof g.text === 'string' && typeof g.createdAt === 'string');
}
