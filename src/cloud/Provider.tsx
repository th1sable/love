import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { type Session } from '@supabase/supabase-js';
import { randomUUID } from 'expo-crypto';
import { emptyState, type State, type Status } from '../domain';
import { configured, supabase } from './client';
import { diffState, mergeSpace, projectSpace, readSpace, type Space } from './model';
type Cloud={configured:boolean;active:boolean;ready:boolean;session:Session|null;space:Space|null;data:State;partnerStatus:Status|null;connected:boolean;error:string;reload:()=>Promise<void>;save:(next:State)=>Promise<void>};
const Context=createContext<Cloud|null>(null);
export function explain(error:unknown):string {
  const e=error as {code?:string;message?:string};
  if(e?.code==='40001')return 'L’altra persona ha appena modificato questo contenuto. Aggiorna e riprova: il tuo testo resta qui.';
  if(e?.code==='invalid_credentials')return 'Email o password non corrette.';
  if(e?.code==='email_not_confirmed')return 'Conferma prima il tuo indirizzo email.';
  if(e?.code==='P0001')return e.message??'Operazione non riuscita.';
  return 'Non riesco a collegarmi. Controlla la connessione e riprova.';
}
export function CloudProvider({children}:React.PropsWithChildren){
  const [session,setSession]=useState<Session|null>(null),[space,setSpace]=useState<Space|null>(null);
  const [ready,setReady]=useState(!configured),[error,setError]=useState(''),[connected,setConnected]=useState(false);
  const actorRef=useRef<string|null>(null);
  const aliveRef=useRef(true);
  const reload=useCallback(async()=>{
    if(!supabase||!session)return;
    const actor=session.user.id;
    try{const result=await supabase.rpc('get_space');if(result.error)throw result.error;const next=readSpace(result.data);if(!aliveRef.current||actorRef.current!==actor)return;setSpace(previous=>next?mergeSpace(previous,next):null);setError('');}
    catch(e){if(aliveRef.current&&actorRef.current===actor)setError(explain(e));}
    finally{if(aliveRef.current&&actorRef.current===actor)setReady(true);}
  },[session]);
  useEffect(()=>{
    aliveRef.current=true;if(!supabase)return;
    const accept=(next:Session|null)=>{if(!aliveRef.current)return;if(actorRef.current!==next?.user.id){actorRef.current=next?.user.id??null;setSpace(null);setError('');setReady(!next);}setSession(next);};
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>accept(next));
    supabase.auth.getSession().then(({data,error:e})=>{if(e){if(aliveRef.current){setError(explain(e));setReady(true);}}else accept(data.session);}).catch(e=>{if(aliveRef.current){setError(explain(e));setReady(true);}});
    const foreground=AppState.addEventListener('change',state=>{if(state==='active')supabase?.auth.startAutoRefresh();else supabase?.auth.stopAutoRefresh();});
    supabase.auth.startAutoRefresh();
    return()=>{aliveRef.current=false;subscription.unsubscribe();foreground.remove();supabase?.auth.stopAutoRefresh();};
  },[]);
  useEffect(()=>{if(!session)return;const timer=setTimeout(()=>void reload(),0);return()=>clearTimeout(timer);},[session,reload]);
  useEffect(()=>{
    if(!supabase||!session||!space?.id)return;
    const client=supabase;
    const channel=client.channel(`couple:${space.id}`).on('postgres_changes',{event:'*',schema:'public',table:'entries',filter:`couple_id=eq.${space.id}`},()=>void reload()).on('postgres_changes',{event:'*',schema:'public',table:'couple_members',filter:`couple_id=eq.${space.id}`},()=>void reload()).subscribe(status=>{setConnected(status==='SUBSCRIBED');if(status==='SUBSCRIBED')void reload();});
    const timer=setInterval(()=>{if(AppState.currentState==='active')void reload();},30000);
    const foreground=AppState.addEventListener('change',state=>{if(state==='active')void reload();});
    return()=>{clearInterval(timer);foreground.remove();void client.removeChannel(channel);setConnected(false);};
  },[session,space?.id,reload]);
  const projected=useMemo(()=>space&&session?projectSpace(space,session.user.id):{state:emptyState,partnerStatus:null},[space,session]);
  async function save(next:State){
    if(!supabase||!session||!space)throw new Error('Spazio non collegato.');
    const actor=session.user.id;
    const changes=diffState(projected.state,next,space,actor);if(changes.length===0)return;
    const requestId=randomUUID();
    const result=await supabase.rpc('save_entries',{p_space_id:space.id,p_actor_id:actor,p_request_id:requestId,p_changes:changes});
    if(result.error){void reload();throw result.error;}
    const saved=readSpace(result.data);if(!saved)throw new Error('Salvataggio non confermato.');
    if(aliveRef.current&&actorRef.current===actor){setSpace(previous=>mergeSpace(previous,saved));setError('');}
  }
  const value:Cloud={configured,active:configured&&Boolean(session&&space),ready,session,space,data:projected.state,partnerStatus:projected.partnerStatus,connected,error,reload,save};
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useCloud(){const context=useContext(Context);if(!context)throw new Error('CloudProvider mancante.');return context;}
