begin;
do $test$
declare a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); c uuid:=gen_random_uuid(); pair uuid; token text; req uuid:=gen_random_uuid(); snap jsonb; rejected boolean;
begin
  insert into auth.users(id,email,email_confirmed_at,is_sso_user,is_anonymous) values
    (a,'love-check-'||a||'@example.invalid',now(),false,false),
    (b,'love-check-'||b||'@example.invalid',now(),false,false),
    (c,'love-check-'||c||'@example.invalid',now(),false,false);
  perform set_config('request.jwt.claim.sub',a::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
  set local role authenticated;
  pair:=public.create_space('Test A');
  token:=public.issue_invite();
  perform set_config('request.jwt.claim.sub',b::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
  if public.accept_invite(token,'Test B')<>pair then raise exception 'pairing failed'; end if;
  perform set_config('request.jwt.claim.sub',c::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',c,'role','authenticated')::text,true);
  rejected:=false;
  begin perform public.accept_invite(token,'Test C'); exception when others then rejected:=true; end;
  if not rejected then raise exception 'third member accepted'; end if;
  if (select count(*) from public.couple_members)<>0 then raise exception 'membership leaked'; end if;
  if public.get_space() is not null then raise exception 'space leaked'; end if;
  perform set_config('request.jwt.claim.sub',a::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
  snap:=public.save_entries(pair,a,req,jsonb_build_array(jsonb_build_object('kind','status','id',a::text,'expected_version',0,'payload',jsonb_build_object('mood','Felice','need','Parlare','thought','Test'))));
  perform public.save_entries(pair,a,req,jsonb_build_array(jsonb_build_object('kind','status','id',a::text,'expected_version',0,'payload',jsonb_build_object('mood','Felice','need','Parlare','thought','Test'))));
  perform public.save_entries(pair,a,gen_random_uuid(),'[{"kind":"diary","id":"live-check-page","expected_version":0,"payload":{"title":"Test","body":"Temporary","date":"2026-10-13","favorite":false}}]'::jsonb);
  perform set_config('request.jwt.claim.sub',b::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
  snap:=public.get_space();
  if jsonb_array_length(snap->'entries')<>2 then raise exception 'partner cannot see changes'; end if;
  perform public.save_entries(pair,b,gen_random_uuid(),'[{"kind":"diary","id":"live-check-page","expected_version":1,"payload":{"title":"Test","body":"Partner edit","date":"2026-10-13","favorite":false}}]'::jsonb);
  perform set_config('request.jwt.claim.sub',a::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
  rejected:=false;
  begin perform public.save_entries(pair,a,gen_random_uuid(),'[{"kind":"diary","id":"live-check-page","expected_version":1,"payload":{"title":"Test","body":"Stale edit","date":"2026-10-13","favorite":false}}]'::jsonb); exception when serialization_failure then rejected:=true; end;
  if not rejected then raise exception 'stale edit accepted'; end if;
  perform set_config('request.jwt.claim.sub',c::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',c,'role','authenticated')::text,true);
  if (select count(*) from public.entries)<>0 then raise exception 'content leaked'; end if;
  reset role;
  if (select count(*) from private.notification_jobs where couple_id=pair)<>1 then raise exception 'notification rule/idempotency failed'; end if;
end $test$;
rollback;
select true as real_database_checks_passed, (select count(*) from auth.users where email like 'love-check-%@example.invalid') as remaining_test_users;
