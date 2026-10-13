const base=require('./app.json');
module.exports=()=>{
  const url=process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key=process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(Boolean(url)!==Boolean(key))throw new Error('Configura entrambe le variabili pubbliche Supabase, oppure lasciale entrambe vuote per la versione locale.');
  if(key&&!key.startsWith('sb_publishable_'))throw new Error('Nell’app e consentita soltanto una chiave Supabase publishable. Non usare chiavi secret o service_role.');
  if(url){const parsed=new URL(url);if(parsed.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(parsed.hostname))throw new Error('La connessione al servizio della coppia deve usare HTTPS.');}
  return base.expo;
};
