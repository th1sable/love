export type PushReadiness={paired:boolean;ownDevices:number;partnerDevices:number;currentDevice:boolean;dispatchEnabled:boolean};
export function readPushReadiness(value:unknown):PushReadiness {
  if(!value||typeof value!=='object')throw new Error('Stato notifiche non disponibile. Riprova.');
  const r=value as Record<string,unknown>;
  if(typeof r.paired!=='boolean'||typeof r.currentDevice!=='boolean'||typeof r.dispatchEnabled!=='boolean'||
    !Number.isInteger(r.ownDevices)||!Number.isInteger(r.partnerDevices)||Number(r.ownDevices)<0||Number(r.partnerDevices)<0)
    throw new Error('Stato notifiche non disponibile. Riprova.');
  return {paired:r.paired,ownDevices:Number(r.ownDevices),partnerDevices:Number(r.partnerDevices),currentDevice:r.currentDevice,dispatchEnabled:r.dispatchEnabled};
}
export function pushSaveNotice(kind:'status'|'gesture',status:PushReadiness|null):string {
  const saved=kind==='gesture'?'Gesto salvato.':'Stato aggiornato.';
  if(!status)return `${saved} Non riesco a verificare il collegamento delle notifiche: controlla il Profilo.`;
  if(!status.paired)return `${saved} Invita prima la tua persona dal Profilo per condividere gli avvisi.`;
  if(!status.dispatchEnabled)return `${saved} Il servizio di invio degli avvisi non è disponibile al momento.`;
  if(status.partnerDevices===0)return `${saved} La tua persona deve collegare le notifiche sul suo telefono dal Profilo.`;
  return `${saved} La tua persona ha un telefono collegato alle notifiche. La ricezione resta da verificare sul dispositivo.`;
}
