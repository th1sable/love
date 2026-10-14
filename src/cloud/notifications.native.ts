import * as Notifications from 'expo-notifications';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { randomUUID } from 'expo-crypto';
import { supabase } from './client';
Notifications.setNotificationHandler({handleNotification:async()=>({shouldShowBanner:true,shouldShowList:true,shouldPlaySound:true,shouldSetBadge:false})});
const KEY='love.push.installation';
async function installation(){let id=await SecureStore.getItemAsync(KEY);if(!id){id=randomUUID();await SecureStore.setItemAsync(KEY,id);}return id;}
export async function enableSystemNotifications():Promise<string>{
  if(!supabase)throw new Error('Accedi prima al tuo account.');
  const actor=(await supabase.auth.getSession()).data.session?.user.id;
  if(!actor)throw new Error('Accedi prima al tuo account.');
  if(Constants.executionEnvironment===ExecutionEnvironment.StoreClient)return 'Per ricevere notifiche devi usare la versione installata di love. Expo Go non basta.';
  const projectId=Constants.expoConfig?.extra?.eas?.projectId??Constants.easConfig?.projectId;
  if(!projectId)return 'La versione installabile e le chiavi Apple/Google devono ancora essere configurate. Non posso attivare le notifiche in questa build.';
  if(Platform.OS==='android')await Notifications.setNotificationChannelAsync('love',{name:'Un pensiero per te',importance:Notifications.AndroidImportance.HIGH,sound:'default',vibrationPattern:[0,180,100,180],lightColor:'#F5D367'});
  let permission=await Notifications.getPermissionsAsync();
  if(!permission.granted)permission=await Notifications.requestPermissionsAsync();
  if(!permission.granted)return 'Le notifiche sono disattivate nelle impostazioni del telefono. Puoi abilitarle da lì.';
  const token=(await Notifications.getExpoPushTokenAsync({projectId})).data;
  if((await supabase.auth.getSession()).data.session?.user.id!==actor)throw new Error('Il tuo account è cambiato. Riprova.');
  const result=await supabase.rpc('register_push_device',{p_device_id:await installation(),p_token:token,p_platform:Platform.OS});
  if(result.error)throw new Error('Non riesco a collegare le notifiche al tuo account. Riprova.');
  return 'Questo telefono è collegato per ricevere notifiche. La consegna va ancora verificata su entrambi i telefoni.';
}
export async function disableSystemNotifications(){
  if(!supabase)return;const id=await SecureStore.getItemAsync(KEY);if(!id)return;
  const result=await supabase.rpc('unregister_push_device',{p_device_id:id});
  if(result.error)throw new Error('Non riesco a disattivare il collegamento delle notifiche. Riprova.');
}
