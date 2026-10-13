-- Schema for a dedicated love project. Apply once, after verification.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.couples (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now());
create table public.couple_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  couple_id uuid not null references public.couples(id) on delete cascade,
  display_name text not null check (length(display_name) between 1 and 80)
);
create index members_couple_idx on public.couple_members(couple_id);
create table private.invites (
  token_hash text primary key, couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null references auth.users(id), expires_at timestamptz not null, accepted_at timestamptz
);
create table public.entries (
  couple_id uuid not null references public.couples(id) on delete cascade,
  kind text not null check(kind in ('status','gesture','diary','item','profile')),
  id text not null check(length(id) between 1 and 200), author_id uuid not null references auth.users(id),
  payload jsonb not null, version integer not null default 1 check(version > 0),
  updated_at timestamptz not null default clock_timestamp(),
  primary key(couple_id,kind,id)
);
create table private.requests (
  user_id uuid not null references auth.users(id) on delete cascade, request_id uuid not null,
  created_at timestamptz not null default now(), primary key(user_id,request_id)
);
create table private.notification_jobs (
  id uuid primary key default gen_random_uuid(), couple_id uuid not null references public.couples(id),
  recipient_id uuid not null references auth.users(id), author_id uuid not null references auth.users(id),
  kind text not null check(kind in ('status','gesture')), entity_id text not null, version integer not null,
  created_at timestamptz not null default now(), delivered_at timestamptz,
  unique(couple_id,kind,entity_id,version,recipient_id)
);
alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.entries enable row level security;
alter table private.invites enable row level security;
alter table private.requests enable row level security;
alter table private.notification_jobs enable row level security;
revoke all on public.couples, public.couple_members, public.entries from anon, authenticated;
grant select on public.couples, public.couple_members, public.entries to authenticated;

-- Internal lookup avoids recursive membership policies. No editable JWT metadata is used.
create function private.is_member(space_id uuid) returns boolean language sql stable security definer set search_path='' as $$
  select auth.uid() is not null and exists(select 1 from public.couple_members m where m.user_id=auth.uid() and m.couple_id=space_id);
$$;
revoke all on function private.is_member(uuid) from public;
grant execute on function private.is_member(uuid) to authenticated;
create policy couple_read on public.couples for select to authenticated using(private.is_member(id));
create policy member_read on public.couple_members for select to authenticated using(private.is_member(couple_id));
create policy entry_read on public.entries for select to authenticated using(private.is_member(couple_id));

create function private.require_user() returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid := auth.uid();
begin
  if actor is null or not exists(select 1 from auth.users where id=actor and email_confirmed_at is not null) then
    raise exception 'Accedi con un indirizzo email confermato.' using errcode='42501';
  end if;
  return actor;
end; $$;
revoke all on function private.require_user() from public;

create function private.create_space(p_name text) returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.require_user(); space_id uuid;
begin
  -- Serializes all pairing actions for one account, including concurrent creation.
  perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
  select couple_id into space_id from public.couple_members where user_id=actor;
  if space_id is not null then return space_id; end if;
  if length(trim(p_name)) not between 1 and 80 then raise exception 'Inserisci il tuo nome.'; end if;
  insert into public.couples default values returning id into space_id;
  insert into public.couple_members(user_id,couple_id,display_name) values(actor,space_id,trim(p_name));
  return space_id;
end; $$;
create function private.issue_invite() returns text language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.require_user(); space_id uuid; token text;
begin
  select couple_id into space_id from public.couple_members where user_id=actor;
  if space_id is null then raise exception 'Crea prima il vostro spazio.'; end if;
  perform 1 from public.couples where id=space_id for update;
  if (select count(*) from public.couple_members where couple_id=space_id)>=2 then raise exception 'Siete gia collegati.'; end if;
  update private.invites set expires_at=now() where couple_id=space_id and accepted_at is null;
  token:=replace(gen_random_uuid()::text,'-','');
  insert into private.invites values(encode(sha256(convert_to(token,'UTF8')),'hex'),space_id,actor,now()+interval '24 hours',null);
  return token;
end; $$;
create function private.accept_invite(p_code text,p_name text) returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.require_user(); invitation private.invites; space_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
  if exists(select 1 from public.couple_members where user_id=actor) then raise exception 'Il tuo account e gia collegato.'; end if;
  if length(trim(p_name)) not between 1 and 80 then raise exception 'Inserisci il tuo nome.'; end if;
  select * into invitation from private.invites where token_hash=encode(sha256(convert_to(lower(trim(p_code)),'UTF8')),'hex');
  if invitation.couple_id is null then raise exception 'Invito non valido o scaduto.'; end if;
  space_id:=invitation.couple_id;
  perform 1 from public.couples where id=space_id for update;
  select * into invitation from private.invites where token_hash=invitation.token_hash for update;
  if invitation.accepted_at is not null or invitation.expires_at<=now() or invitation.created_by=actor or
    (select count(*) from public.couple_members where couple_id=space_id)>=2 then raise exception 'Invito non valido o scaduto.'; end if;
  insert into public.couple_members values(actor,space_id,trim(p_name));
  update private.invites set accepted_at=now() where token_hash=invitation.token_hash;
  return space_id;
end; $$;

create function private.valid_payload(k text,p jsonb) returns boolean language plpgsql immutable set search_path='' as $$
begin
  if jsonb_typeof(p)<>'object' or length(p::text)>30000 then return false; end if;
  if k='status' then
    return jsonb_typeof(p->'mood')='string' and length(p->>'mood') between 1 and 160
      and jsonb_typeof(p->'need')='string' and length(p->>'need')<=160
      and jsonb_typeof(p->'thought')='string' and length(p->>'thought')<=5000;
  elsif k='profile' then return jsonb_typeof(p->'name')='string' and length(trim(p->>'name')) between 1 and 80;
  elsif k='gesture' then return jsonb_typeof(p->'text')='string' and length(p->>'text') between 1 and 160;
  elsif k='diary' then
    return jsonb_typeof(p->'title')='string' and length(trim(p->>'title')) between 1 and 160
      and jsonb_typeof(p->'body')='string' and length(p->>'body') between 1 and 5000
      and jsonb_typeof(p->'favorite')='boolean' and (p->>'date')~'^\d{4}-\d{2}-\d{2}$'
      and to_char((p->>'date')::date,'YYYY-MM-DD')=p->>'date';
  elsif k='item' then
    return jsonb_typeof(p->'title')='string' and length(trim(p->>'title')) between 1 and 160
      and jsonb_typeof(p->'detail')='string' and length(p->>'detail')<=160 and jsonb_typeof(p->'done')='boolean'
      and p->>'section' in ('Calendario','Promemoria','Liste','Idee per uscire','Obiettivi')
      and (p->>'section'<>'Calendario' or ((p->>'detail')~'^\d{4}-\d{2}-\d{2}$' and to_char((p->>'detail')::date,'YYYY-MM-DD')=p->>'detail'));
  end if;
  return false;
exception when others then return false;
end; $$;
revoke all on function private.valid_payload(text,jsonb) from public;

create function private.get_space() returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.require_user(); space_id uuid;
begin
  select couple_id into space_id from public.couple_members where user_id=actor;
  if space_id is null then return null; end if;
  return jsonb_build_object('id',space_id,
    'members',(select coalesce(jsonb_agg(to_jsonb(m)),'[]'::jsonb) from public.couple_members m where couple_id=space_id),
    'entries',(select coalesce(jsonb_agg(to_jsonb(e) order by e.updated_at,e.id),'[]'::jsonb) from public.entries e where couple_id=space_id));
end; $$;
create function private.save_entries(p_space_id uuid,p_actor_id uuid,p_request_id uuid,p_changes jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.require_user(); space_id uuid; change jsonb; k text; entity text; content jsonb; expected integer; changed integer; next_version integer;
begin
  select couple_id into space_id from public.couple_members where user_id=actor;
  if space_id is null then raise exception 'Collega prima il vostro spazio.'; end if;
  if actor is distinct from p_actor_id or space_id is distinct from p_space_id then raise exception 'Il tuo account o spazio e cambiato. Accedi di nuovo.' using errcode='42501'; end if;
  if p_request_id is null or p_changes is null or jsonb_typeof(p_changes)<>'array' or jsonb_array_length(p_changes) not between 1 and 100 then raise exception 'Aggiornamento non valido.'; end if;
  insert into private.requests(user_id,request_id) values(actor,p_request_id) on conflict do nothing;
  get diagnostics changed=row_count;
  if changed=0 then return private.get_space(); end if;
  for change in select value from jsonb_array_elements(p_changes) loop
    k:=change->>'kind'; entity:=change->>'id'; content:=change->'payload'; expected:=(change->>'expected_version')::integer;
    if entity is null or length(entity) not between 1 and 200 or expected is null or expected<0
      or not coalesce(private.valid_payload(k,content),false) then raise exception 'Contenuto non valido.'; end if;
    if k in ('status','profile') and entity<>actor::text then raise exception 'Puoi aggiornare solo il tuo stato e nome.' using errcode='42501'; end if;
    if k='gesture' and expected<>0 then raise exception 'Un gesto gia inviato non si modifica.'; end if;
    if expected=0 then
      insert into public.entries(couple_id,kind,id,author_id,payload) values(space_id,k,entity,actor,content) on conflict do nothing;
      get diagnostics changed=row_count; next_version:=1;
    else
      update public.entries set payload=content,version=version+1,updated_at=clock_timestamp()
        where couple_id=space_id and kind=k and id=entity and version=expected;
      get diagnostics changed=row_count; next_version:=expected+1;
    end if;
    if changed<>1 then raise exception 'Questo contenuto e appena cambiato. Aggiorna e riprova.' using errcode='40001'; end if;
    if k='profile' then update public.couple_members set display_name=trim(content->>'name') where user_id=actor; end if;
    if k in ('status','gesture') then
      insert into private.notification_jobs(couple_id,recipient_id,author_id,kind,entity_id,version)
        select space_id,m.user_id,actor,k,entity,next_version from public.couple_members m where m.couple_id=space_id and m.user_id<>actor;
    end if;
  end loop;
  return private.get_space();
end; $$;

-- Public wrappers are invokers; the authenticated, checked implementations stay private.
revoke all on function private.create_space(text),private.issue_invite(),private.accept_invite(text,text),private.get_space(),private.save_entries(uuid,uuid,uuid,jsonb) from public;
grant execute on function private.create_space(text),private.issue_invite(),private.accept_invite(text,text),private.get_space(),private.save_entries(uuid,uuid,uuid,jsonb) to authenticated;
create function public.create_space(p_name text) returns uuid language sql security invoker set search_path='' as $$ select private.create_space(p_name); $$;
create function public.issue_invite() returns text language sql security invoker set search_path='' as $$ select private.issue_invite(); $$;
create function public.accept_invite(p_code text,p_name text) returns uuid language sql security invoker set search_path='' as $$ select private.accept_invite(p_code,p_name); $$;
create function public.get_space() returns jsonb language sql security invoker set search_path='' as $$ select private.get_space(); $$;
create function public.save_entries(p_space_id uuid,p_actor_id uuid,p_request_id uuid,p_changes jsonb) returns jsonb language sql security invoker set search_path='' as $$ select private.save_entries(p_space_id,p_actor_id,p_request_id,p_changes); $$;
revoke all on function public.create_space(text),public.issue_invite(),public.accept_invite(text,text),public.get_space(),public.save_entries(uuid,uuid,uuid,jsonb) from public,anon;
grant execute on function public.create_space(text),public.issue_invite(),public.accept_invite(text,text),public.get_space(),public.save_entries(uuid,uuid,uuid,jsonb) to authenticated;

do $$ begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') then
    alter publication supabase_realtime add table public.entries,public.couple_members;
  end if;
end $$;
