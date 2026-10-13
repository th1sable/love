import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const config=require('../app.config.js');
test('una chiave segreta viene bloccata prima della compilazione dell’app',()=>{
  const oldUrl=process.env.EXPO_PUBLIC_SUPABASE_URL,oldKey=process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  try{process.env.EXPO_PUBLIC_SUPABASE_URL='https://example.supabase.co';process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY='sb_secret_test';assert.throws(config,/publishable/);
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY='sb_publishable_test';assert.equal(config().name,'love');}
  finally{if(oldUrl===undefined)delete process.env.EXPO_PUBLIC_SUPABASE_URL;else process.env.EXPO_PUBLIC_SUPABASE_URL=oldUrl;if(oldKey===undefined)delete process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;else process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=oldKey;}
});
