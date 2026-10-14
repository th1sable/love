-- Readiness only: never expose tokens, installation IDs or private messages.
create function private.get_push_status(p_device_id uuid default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare actor uuid:=private.require_user(); space_id uuid; partner uuid; dispatcher boolean:=false;
begin
  select couple_id into space_id from public.couple_members where user_id=actor;
  if space_id is null then raise exception 'Collega prima il vostro spazio.' using errcode='42501'; end if;
  select user_id into partner from public.couple_members where couple_id=space_id and user_id<>actor;
  if to_regclass('cron.job') is not null and to_regprocedure('private.process_push_queue()') is not null then
    execute 'select exists(select 1 from cron.job where jobname=''love-push-dispatch'' and active)' into dispatcher;
  end if;
  return jsonb_build_object(
    'paired',partner is not null,
    'ownDevices',(select count(*) from private.push_devices where user_id=actor and enabled),
    'partnerDevices',(select count(*) from private.push_devices where user_id=partner and enabled),
    'currentDevice',exists(select 1 from private.push_devices where device_id=p_device_id and user_id=actor and enabled),
    'dispatchEnabled',dispatcher
  );
end; $$;
revoke all on function private.get_push_status(uuid) from public,anon;
grant execute on function private.get_push_status(uuid) to authenticated;
create function public.get_push_status(p_device_id uuid default null)
returns jsonb language sql stable security invoker set search_path='' as $$
  select private.get_push_status(p_device_id);
$$;
revoke all on function public.get_push_status(uuid) from public,anon;
grant execute on function public.get_push_status(uuid) to authenticated;

-- Return readiness with the existing save, avoiding a second network round trip.
-- Existing clients ignore this additional property and remain compatible.
create or replace function public.save_entries(p_space_id uuid,p_actor_id uuid,p_request_id uuid,p_changes jsonb)
returns jsonb language sql security invoker set search_path='' as $$
  select private.save_entries(p_space_id,p_actor_id,p_request_id,p_changes)
    || jsonb_build_object('pushStatus',private.get_push_status());
$$;
revoke all on function public.save_entries(uuid,uuid,uuid,jsonb) from public,anon;
grant execute on function public.save_entries(uuid,uuid,uuid,jsonb) to authenticated;
