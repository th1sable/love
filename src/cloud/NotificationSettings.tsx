import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, Text, View } from 'react-native';
import { enableSystemNotifications, disableSystemNotifications, getDeviceNotificationState } from './notifications';
import { fetchPushStatus } from './pushStatus';
import { type PushReadiness } from './pushReadiness';
import { useCloud } from './Provider';

export function NotificationSettings(){
  const cloud=useCloud(),actor=cloud.session?.user.id;
  const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[note,setNote]=useState('');
  const [status,setStatus]=useState<PushReadiness|null>(null);
  const [permission,setPermission]=useState<string>('unknown');
  const generation=useRef(0),alive=useRef(true),lock=useRef(false),actorRef=useRef(actor);
  const refresh=useCallback(async()=>{
    const request=++generation.current;setLoading(true);
    try{
      const device=await getDeviceNotificationState();
      const next=await fetchPushStatus(device.deviceId);
      if(alive.current&&actorRef.current===actor&&request===generation.current){setStatus(next);setPermission(device.permission);}
    }catch{
      if(alive.current&&actorRef.current===actor&&request===generation.current){setStatus(null);setNote('Non riesco a verificare le notifiche. Premi Aggiorna per riprovare.');}
    }finally{if(alive.current&&request===generation.current)setLoading(false);}
  },[actor]);
  useEffect(()=>{
    alive.current=true;const timer=setTimeout(()=>void refresh(),0);
    const foreground=AppState.addEventListener('change',state=>{if(state==='active')void refresh();});
    return()=>{alive.current=false;clearTimeout(timer);foreground.remove();};
  },[refresh]);
  async function change(enable:boolean){
    if(lock.current)return;lock.current=true;setBusy(true);setNote('');
    try{
      const message=enable?await enableSystemNotifications():(await disableSystemNotifications(),'Collegamento notifiche disattivato per questo dispositivo.');
      if(alive.current&&actorRef.current===actor){setNote(message);await refresh();}
    }catch(error){if(alive.current&&actorRef.current===actor)setNote(error instanceof Error?error.message:'Non riesco a modificare le notifiche. Riprova.');}
    finally{lock.current=false;if(alive.current)setBusy(false);}
  }
  return <View style={{marginTop:20}}>
    <Text style={{fontWeight:'700',color:'#433828',fontSize:17}}>Un pensiero sul tuo telefono</Text>
    <Text style={{color:'#8A7B62',lineHeight:23,marginTop:10}}>Collegate le notifiche su entrambi i telefoni per ricevere stati e gesti. Diario, album e organizzazione si aggiornano in silenzio.</Text>
    <View accessibilityLiveRegion="polite" style={{backgroundColor:'#FAF2D7',padding:15,borderRadius:14,marginTop:15,gap:8}}>
      {loading&&<ActivityIndicator accessibilityLabel="Controllo delle notifiche" color="#B38319"/>}
      {!loading&&status&&<>
        <Text style={{color:'#433828'}}>I tuoi telefoni collegati: {status.ownDevices}</Text>
        <Text style={{color:'#433828'}}>{status.paired?`Telefoni della tua persona: ${status.partnerDevices}`:'Invita la tua persona dal Profilo per condividere gli avvisi.'}</Text>
        <Text style={{color:'#78694F',lineHeight:22}}>{permission==='web'?'Questa è l’anteprima: gli avvisi arrivano nell’app installata.':permission==='expo-go'?'Per gli avvisi serve la versione installata di love.':permission==='denied'?'Le notifiche sono bloccate nelle impostazioni di questo telefono.':status.currentDevice&&permission==='granted'?'Questo telefono è collegato. La ricezione di un avviso va verificata sul dispositivo.':'Questo telefono deve ancora essere collegato.'}</Text>
        {!status.dispatchEnabled&&<Text style={{color:'#78694F'}}>Il servizio di invio non è disponibile al momento.</Text>}
      </>}
      {!loading&&!status&&<Text style={{color:'#78694F'}}>Stato delle notifiche non disponibile.</Text>}
    </View>
    <Pressable accessibilityRole="button" disabled={busy||loading} onPress={()=>{setNote('');void refresh();}} style={{paddingVertical:15}}><Text style={{color:'#78694F'}}>Aggiorna lo stato delle notifiche</Text></Pressable>
    <Text style={{color:'#8A7B62',lineHeight:22}}>Gli avvisi passano tramite Expo e Apple o Google. Expo riceve il nome del mittente, il testo dell’avviso e l’indirizzo del dispositivo usato per recapitarlo.</Text>
    <Pressable accessibilityRole="button" disabled={busy} onPress={()=>void change(true)} style={{padding:16,borderRadius:14,backgroundColor:'#F5D367',marginTop:15}}><Text style={{fontWeight:'700',color:'#51401B'}}>{busy?'Un momento…':'Attiva le notifiche su questo telefono'}</Text></Pressable>
    {!!note&&<Text accessibilityLiveRegion="polite" style={{color:'#78694F',lineHeight:23,marginTop:12}}>{note}</Text>}
    <Pressable accessibilityRole="button" disabled={busy} onPress={()=>void change(false)} style={{paddingVertical:15}}><Text style={{color:'#8A7B62'}}>Disattiva su questo dispositivo</Text></Pressable>
  </View>;
}
