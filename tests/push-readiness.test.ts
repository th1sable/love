import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { readPushReadiness, pushSaveNotice } from '../src/cloud/pushReadiness.ts';

test('avvisi: distinguere salvataggio, partner assente e telefoni non collegati',()=>{
  const status={paired:true,ownDevices:1,partnerDevices:0,currentDevice:true,dispatchEnabled:true};
  assert.match(pushSaveNotice('gesture',status),/deve collegare/);
  assert.match(pushSaveNotice('status',{...status,paired:false}),/Invita prima/);
  assert.match(pushSaveNotice('gesture',{...status,dispatchEnabled:false}),/non è disponibile/);
  assert.match(pushSaveNotice('status',{...status,partnerDevices:1}),/ricezione resta da verificare/);
  assert.match(pushSaveNotice('gesture',null),/Non riesco a verificare/);
  assert.throws(()=>readPushReadiness({...status,partnerDevices:-1}));
  assert.throws(()=>readPushReadiness({...status,paired:'true'}));
});

test('stato notifiche: accesso riservato, conteggi della coppia e compatibilità dei salvataggi',async t=>{
  const db=new PGlite();t.after(()=>db.close());
  await db.exec(`create role anon;create role authenticated;create schema auth;
    create table auth.users(id uuid primary key,email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid; $$;`);
  for(const name of ['schema.sql','hardening.sql','notifications-core.sql','notification-status.sql'])
    await db.exec(await readFile(new URL('../supabase/'+name,import.meta.url),'utf8'));
  const a=randomUUID(),b=randomUUID(),c=randomUUID(),unconfirmed=randomUUID(),aPhone=randomUUID(),bPhone=randomUUID();
  await db.query('insert into auth.users values($1,now()),($2,now()),($3,now()),($4,null)',[a,b,c,unconfirmed]);
  const scalar=async(sql:string,args:unknown[]=[])=>Object.values((await db.query<Record<string,unknown>>(sql,args)).rows[0])[0];
  async function actor(id:string){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec('set role authenticated');}
  await db.exec('set role anon');await assert.rejects(scalar('select public.get_push_status()'));
  await actor(unconfirmed);await assert.rejects(scalar('select public.get_push_status()'));
  await actor(a);const space=await scalar('select public.create_space($1)',['A']);
  assert.deepEqual(await scalar('select public.get_push_status()'),{paired:false,ownDevices:0,partnerDevices:0,currentDevice:false,dispatchEnabled:false});
  const invite=await scalar('select public.issue_invite()');
  await actor(b);await scalar('select public.accept_invite($1,$2)',[invite,'B']);
  await scalar('select public.register_push_device($1,$2,$3)',[bPhone,'ExpoPushToken[readiness_B]','ios']);
  await actor(c);await assert.rejects(scalar('select public.get_push_status($1)',[bPhone]));
  await scalar('select public.create_space($1)',['C']);
  assert.equal((await scalar('select public.get_push_status($1)',[bPhone]) as {partnerDevices:number}).partnerDevices,0);
  await actor(a);await scalar('select public.register_push_device($1,$2,$3)',[aPhone,'ExpoPushToken[readiness_A]','android']);
  assert.deepEqual(await scalar('select public.get_push_status($1)',[aPhone]),{paired:true,ownDevices:1,partnerDevices:1,currentDevice:true,dispatchEnabled:false});
  assert.equal((await scalar('select public.get_push_status($1)',[bPhone]) as {currentDevice:boolean}).currentDevice,false);
  await assert.rejects(scalar('select count(*) from private.push_devices'));
  await db.exec(`reset role;create schema cron;create table cron.job(jobname text,active boolean);
    insert into cron.job values('love-push-dispatch',true);
    create function private.process_push_queue() returns void language plpgsql as $$ begin return; end; $$;`);
  await actor(a);
  const saved=await scalar('select public.save_entries($1,$2,$3,$4::jsonb)',[space,a,randomUUID(),JSON.stringify([{kind:'gesture',id:'test',expected_version:0,payload:{text:'Ti penso'}}])]) as {entries:unknown[];pushStatus:unknown};
  assert.equal(saved.entries.length,1);
  assert.deepEqual(saved.pushStatus,{paired:true,ownDevices:1,partnerDevices:1,currentDevice:false,dispatchEnabled:true});
  assert.doesNotMatch(JSON.stringify(saved.pushStatus),/ExpoPushToken|readiness_|device_id|user_id/);
  await scalar('select public.unregister_push_device($1)',[aPhone]);
  assert.equal((await scalar('select public.get_push_status($1)',[aPhone]) as {currentDevice:boolean}).currentDevice,false);
});
