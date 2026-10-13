const base=require('./app.json');
const deployment=require('./cloud.config.json');
module.exports=({config=base.expo}={})=>{
  const url=process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key=process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(Boolean(url)!==Boolean(key))throw new Error('Configura entrambe le variabili pubbliche Supabase, oppure lasciale entrambe vuote per usare il progetto love preconfigurato.');
  if(key&&!key.startsWith('sb_publishable_'))throw new Error('Nell’app e consentita soltanto una chiave Supabase publishable. Non usare chiavi secret o service_role.');
  if(!deployment.publishableKey.startsWith('sb_publishable_'))throw new Error('La configurazione del progetto deve contenere soltanto una chiave publishable.');
  if(url){const parsed=new URL(url);if(parsed.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(parsed.hostname))throw new Error('La connessione al servizio della coppia deve usare HTTPS.');}
  return {...config,android:{...config.android,...(process.env.GOOGLE_SERVICES_JSON?{googleServicesFile:process.env.GOOGLE_SERVICES_JSON}:{})}};
};
