import { supabase } from './client';
export const APP_ORIGIN='https://love-prova-cuore-giallo.thisable.chatgpt.site';
export const authRedirect=`${APP_ORIGIN}/auth/confirm`;
export async function completeAuthLink(raw:string):Promise<{recovery:boolean}> {
  if(!supabase)throw new Error('Collegamento non disponibile.');
  const url=new URL(raw);const query=url.searchParams;const hash=new URLSearchParams(url.hash.slice(1));
  if(query.has('error')||hash.has('error'))throw new Error('Questo collegamento è scaduto o è già stato usato. Richiedine uno nuovo.');
  const type=query.get('type')||hash.get('type');const recovery=type==='recovery';
  let error;
  if(query.get('token_hash')&&['signup','email','recovery'].includes(type??'')){
    ({error}=await supabase.auth.verifyOtp({token_hash:query.get('token_hash')!,type:type as 'signup'|'email'|'recovery'}));
  }else if(query.get('code')){
    ({error}=await supabase.auth.exchangeCodeForSession(query.get('code')!));
  }else if(hash.get('access_token')&&hash.get('refresh_token')){
    ({error}=await supabase.auth.setSession({access_token:hash.get('access_token')!,refresh_token:hash.get('refresh_token')!}));
  }else throw new Error('Il collegamento non contiene una conferma valida. Torna all’accesso e richiedi una nuova email.');
  if(error)throw new Error('Il collegamento è scaduto o non è valido. Richiedi una nuova email.');
  return {recovery};
}
