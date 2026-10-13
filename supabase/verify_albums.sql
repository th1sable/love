-- Temporary metadata only; no image is uploaded, no email or notification is sent.
begin;
do $test$
declare a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); c uuid:=gen_random_uuid(); photo uuid:=gen_random_uuid(); pair uuid; invite text; path text; rejected boolean; snap jsonb;
begin
  insert into auth.users(id,email,email_confirmed_at,is_sso_user,is_anonymous) values
    (a,'love-album-check-'||a||'@example.invalid',now(),false,false),
    (b,'love-album-check-'||b||'@example.invalid',now(),false,false),
    (c,'love-album-check-'||c||'@example.invalid',now(),false,false);
  perform set_config('request.jwt.claim.sub',a::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
  set local role authenticated;
  pair:=public.create_space('Album test A');invite:=public.issue_invite();path:=pair::text||'/'||a::text||'/'||photo::text||'.jpg';
  insert into storage.objects(bucket_id,name) values('couple-photos',path);
  perform public.save_entries(pair,a,gen_random_uuid(),jsonb_build_array(jsonb_build_object('kind','album','id','live-album-check','expected_version',0,'payload',jsonb_build_object('title','Test album','date','2026-10-13','photos',jsonb_build_array(jsonb_build_object('id',photo,'path',path,'date','2026-10-13','width',1200,'height',800))))));
  perform set_config('request.jwt.claim.sub',b::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
  perform public.accept_invite(invite,'Album test B');
  if (select count(*) from storage.objects where bucket_id='couple-photos' and name=path)<>1 then raise exception 'partner cannot read photo metadata'; end if;
  snap:=public.get_space();if jsonb_array_length(snap->'entries')<>1 then raise exception 'partner cannot read album'; end if;
  perform set_config('request.jwt.claim.sub',c::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',c,'role','authenticated')::text,true);
  if (select count(*) from storage.objects where bucket_id='couple-photos' and name=path)<>0 then raise exception 'photo metadata leaked'; end if;
  rejected:=false;begin insert into storage.objects(bucket_id,name) values('couple-photos',pair::text||'/'||c::text||'/'||gen_random_uuid()::text||'.jpg');exception when insufficient_privilege then rejected:=true;end;
  if not rejected then raise exception 'outsider uploaded into couple';end if;
  reset role;
  if exists(select 1 from private.notification_jobs where couple_id=pair) then raise exception 'album caused notification'; end if;
  if (select public from storage.buckets where id='couple-photos') then raise exception 'public photo bucket'; end if;
end $test$;
rollback;
select true as private_album_checks_passed,(select count(*) from auth.users where email like 'love-album-check-%@example.invalid') as remaining_test_users;
