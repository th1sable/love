import { supabase } from './client';
import { readPushReadiness } from './pushReadiness';
export async function fetchPushStatus(deviceId:string|null=null){
  if(!supabase)throw new Error('Accedi prima al tuo account.');
  const actor=(await supabase.auth.getSession()).data.session?.user.id;
  if(!actor)throw new Error('Accedi prima al tuo account.');
  const timeout=new AbortController();const timer=setTimeout(()=>timeout.abort(),8000);
  let result;
  try{result=await supabase.rpc('get_push_status',{p_device_id:deviceId}).abortSignal(timeout.signal);}
  finally{clearTimeout(timer);}
  if((await supabase.auth.getSession()).data.session?.user.id!==actor)throw new Error('Il tuo account è cambiato. Riprova.');
  if(result.error)throw new Error('Non riesco a verificare le notifiche. Premi Aggiorna per riprovare.');
  return readPushReadiness(result.data);
}
