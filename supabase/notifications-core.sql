-- Devices are private. A client can register or remove only its own installation.
create table private.push_devices (
  device_id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
  token text unique not null check(token ~ '^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$'),
  platform text not null check(platform in ('ios','android')), enabled boolean not null default true,
  updated_at timestamptz not null default now()
);
create index push_devices_user_idx on private.push_devices(user_id);
alter table private.push_devices enable row level security;
create policy device_no_direct_access on private.push_devices as restrictive for all to authenticated using(false) with check(false);
revoke all on private.push_devices from public,anon,authenticated;
create function private.register_push_device(p_device_id uuid,p_token text,p_platform text) returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.require_user();
begin
  if not exists(select 1 from public.couple_members where user_id=actor) then raise exception 'Collega prima il vostro spazio.'; end if;
  if p_device_id is null or p_token is null or p_token !~ '^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$' or length(p_token)>250 or p_platform not in ('ios','android') then raise exception 'Dispositivo non valido.'; end if;
  if exists(select 1 from private.push_devices where device_id=p_device_id and user_id<>actor and enabled) then raise exception 'Esci prima dal vecchio account su questo telefono.'; end if;
  if (select count(*) from private.push_devices where user_id=actor and enabled and device_id<>p_device_id)>=5 then raise exception 'Hai già collegato cinque telefoni.'; end if;
  insert into private.push_devices(device_id,user_id,token,platform) values(p_device_id,actor,p_token,p_platform)
    on conflict(device_id) do update set user_id=actor,token=excluded.token,platform=excluded.platform,enabled=true,updated_at=now();
end; $$;
create function private.unregister_push_device(p_device_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.require_user();
begin update private.push_devices set enabled=false,updated_at=now() where device_id=p_device_id and user_id=actor; end; $$;
revoke all on function private.register_push_device(uuid,text,text),private.unregister_push_device(uuid) from public;
grant execute on function private.register_push_device(uuid,text,text),private.unregister_push_device(uuid) to authenticated;
create function public.register_push_device(p_device_id uuid,p_token text,p_platform text) returns void language sql security invoker set search_path='' as $$ select private.register_push_device(p_device_id,p_token,p_platform); $$;
create function public.unregister_push_device(p_device_id uuid) returns void language sql security invoker set search_path='' as $$ select private.unregister_push_device(p_device_id); $$;
revoke all on function public.register_push_device(uuid,text,text),public.unregister_push_device(uuid) from public,anon;
grant execute on function public.register_push_device(uuid,text,text),public.unregister_push_device(uuid) to authenticated;

create table private.push_deliveries (
  job_id uuid not null references private.notification_jobs(id) on delete cascade,
  device_id uuid not null references private.push_devices(device_id) on delete cascade,
  token text not null, message jsonb not null,
  status text not null default 'pending' check(status in ('pending','sending','accepted','receipting','delivered','failed','skipped')),
  attempts integer not null default 0, request_id bigint, ticket_id text,
  next_attempt_at timestamptz not null default now(), requested_at timestamptz,
  accepted_at timestamptz, last_error text,
  primary key(job_id,device_id)
);
create index deliveries_device_idx on private.push_deliveries(device_id);
create index deliveries_pending_idx on private.push_deliveries(next_attempt_at) where status in ('pending','sending','accepted','receipting');
alter table private.push_deliveries enable row level security;
create policy deliveries_no_direct_access on private.push_deliveries as restrictive for all to authenticated using(false) with check(false);
revoke all on private.push_deliveries from public,anon,authenticated;

-- Snapshot the exact event; later changes must not rewrite already queued notifications.
create function private.queue_notification() returns trigger language plpgsql security definer set search_path='' as $$
declare content jsonb; author text; message_body text;
begin
  select payload into content from public.entries where couple_id=new.couple_id and kind=new.kind and id=new.entity_id and version=new.version;
  select display_name into author from public.couple_members where user_id=new.author_id and couple_id=new.couple_id;
  if content is null then return new; end if;
  if new.kind='gesture' then message_body:=content->>'text';
  else message_body:=concat_ws(' · ',nullif(content->>'mood',''),nullif(content->>'need',''),nullif(left(content->>'thought',350),'')); end if;
  insert into private.push_deliveries(job_id,device_id,token,message)
    select new.id,d.device_id,d.token,jsonb_build_object('to',d.token,'title',coalesce(author,'La tua persona')||' 💛','body',message_body,'sound','default','priority','high','channelId','love','ttl',600,'collapseId',new.id::text,'data',jsonb_build_object('url','/','kind',new.kind,'eventId',new.id))
    from private.push_devices d where d.user_id=new.recipient_id and d.enabled;
  return new;
end; $$;
revoke all on function private.queue_notification() from public,anon,authenticated;
create trigger queue_partner_notification after insert on private.notification_jobs for each row execute function private.queue_notification();

-- Additional calendar fields and goal deadlines. Preserve old reminders on read.
alter function private.valid_payload(text,jsonb) rename to valid_payload_v1;
create function private.valid_payload(k text,p jsonb) returns boolean language plpgsql immutable set search_path='' as $$
begin
  if not coalesce(private.valid_payload_v1(k,p),false) then return false; end if;
  if k='item' then
    if p ? 'deadline' and (jsonb_typeof(p->'deadline')<>'string' or (p->>'deadline') !~ '^\d{4}-\d{2}-\d{2}$' or to_char((p->>'deadline')::date,'YYYY-MM-DD')<>p->>'deadline') then return false; end if;
    if p ? 'time' and (jsonb_typeof(p->'time')<>'string' or (p->>'time') !~ '^([01]\d|2[0-3]):[0-5]\d$') then return false; end if;
    if p ? 'notes' and (jsonb_typeof(p->'notes')<>'string' or length(p->>'notes')>5000) then return false; end if;
  end if;
  return true;
exception when others then return false;
end; $$;
revoke all on function private.valid_payload(text,jsonb) from public;
