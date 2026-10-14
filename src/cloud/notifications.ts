export async function enableSystemNotifications():Promise<string>{return 'Le notifiche di sistema funzioneranno nella versione installata per iPhone e Android. Questa anteprima web non può riceverle.';}
export async function disableSystemNotifications():Promise<void>{}
export async function getDeviceNotificationState(){return {deviceId:null,permission:'web' as const};}
