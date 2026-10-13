import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';

test('Postgres: coppia privata, invito singolo, conflitti e regole delle notifiche',async(t)=>{
  const db=new PGlite(); t.after(()=>db.close());
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key,email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid; $$;`);
  const a=randomUUID(),b=randomUUID(),c=randomUUID(),unconfirmed=randomUUID();
  await db.query('insert into auth.users values($1,now()),($2,now()),($3,now()),($4,null)',[a,b,c,unconfirmed]);
  await db.exec(await readFile(new URL('../supabase/schema.sql',import.meta.url),'utf8'));
  await db.exec(await readFile(new URL('../supabase/hardening.sql',import.meta.url),'utf8'));
  let currentActor='';
  async function actor(id:string){currentActor=id;await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec('set role authenticated');}
  const scalar=async(sql:string,args:unknown[]=[])=>{const result=await db.query<Record<string,unknown>>(sql,args);return Object.values(result.rows[0])[0];};
  await actor(unconfirmed);await assert.rejects(scalar('select public.create_space($1)',['No']));
  await actor(a);const couple=await scalar('select public.create_space($1)',['A']);assert.equal(await scalar('select public.create_space($1)',['A']),couple);
  const first=await scalar('select public.issue_invite()') as string;
  const token=await scalar('select public.issue_invite()') as string;assert.notEqual(first,token);
  await actor(b);await assert.rejects(scalar('select public.accept_invite($1,$2)',[first,'B']));assert.equal(await scalar('select public.accept_invite($1,$2)',[token,'B']),couple);
  await actor(c);await assert.rejects(scalar('select public.accept_invite($1,$2)',[token,'C']));assert.equal(await scalar('select count(*) from public.entries'),0);assert.equal(await scalar('select count(*) from public.couple_members'),0);
  await assert.rejects(db.query('insert into public.couple_members values($1,$2,$3)',[c,couple,'C']));
  await assert.rejects(db.query('select * from private.notification_jobs'));
  const status={kind:'status',id:a,expected_version:0,payload:{mood:'Felice',need:'Parlare',thought:'Ciao'}};
  async function publish(changes:unknown[],id=randomUUID()){return scalar('select public.save_entries($1,$2,$3,$4::jsonb)',[couple,currentActor,id,JSON.stringify(changes)]);}
  await assert.rejects(publish([status]));
  await actor(a);const request=randomUUID();await publish([status],request);await publish([status],request);
  await assert.rejects(publish([{...status,id:b}]));
  const page={kind:'diary',id:'page',expected_version:0,payload:{title:'Noi',body:'Ricordo',date:'2026-10-13',favorite:false}};
  await publish([page]);await actor(b);
  await assert.rejects(scalar('select public.save_entries($1,$2,$3,$4::jsonb)',[couple,a,randomUUID(),JSON.stringify([{...page,expected_version:1}])]));
  await publish([{...page,expected_version:1,payload:{...page.payload,body:'Il mio ricordo'}}]);
  await actor(a);await assert.rejects(publish([{...page,expected_version:1,payload:{...page.payload,body:'Vecchia modifica'}}]));
  const snapshot=await scalar('select public.get_space()') as {entries:{kind:string;payload:{body:string};version:number}[]};
  assert.equal(snapshot.entries.find(e=>e.kind==='diary')?.payload.body,'Il mio ricordo');assert.equal(snapshot.entries.find(e=>e.kind==='diary')?.version,2);
  await assert.rejects(publish([{...page,id:'bad',payload:{...page.payload,date:'2026-02-30'}}]));
  await publish([{kind:'gesture',id:'hug',expected_version:0,payload:{text:'Ti abbraccio'}}]);
  await db.exec('reset role');const jobs=await db.query<{kind:string;recipient_id:string}>('select kind,recipient_id from private.notification_jobs order by created_at');
  assert.deepEqual(jobs.rows.map(j=>j.kind),['status','gesture']);assert.ok(jobs.rows.every(j=>j.recipient_id===b));
  assert.equal((await db.query<{count:number}>('select count(*) from public.couple_members')).rows[0].count,2);

});
