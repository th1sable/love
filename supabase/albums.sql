-- Private photo albums; metadata syncs through the same conflict-checked entry RPC.
alter table public.entries drop constraint entries_kind_check;
alter table public.entries add constraint entries_kind_check check(kind in ('status','gesture','diary','item','profile','album'));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('couple-photos','couple-photos',false,8388608,array['image/jpeg']);
create function private.photo_read_allowed(p_name text) returns boolean language plpgsql stable security definer set search_path='' as $$
begin
  if p_name !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg$' then return false; end if;
  return private.is_member(split_part(p_name,'/',1)::uuid);
exception when others then return false;
end; $$;
create function private.photo_upload_allowed(p_name text) returns boolean language sql stable security invoker set search_path='' as $$
  select private.photo_read_allowed(p_name) and split_part(p_name,'/',2)=auth.uid()::text;
$$;
revoke all on function private.photo_read_allowed(text),private.photo_upload_allowed(text) from public,anon;
grant execute on function private.photo_read_allowed(text),private.photo_upload_allowed(text) to authenticated;
create policy love_photo_read on storage.objects for select to authenticated using(bucket_id='couple-photos' and private.photo_read_allowed(name));
create policy love_photo_insert on storage.objects for insert to authenticated with check(bucket_id='couple-photos' and private.photo_upload_allowed(name));
-- No public bucket, object overwrite or direct partner deletion is enabled.
alter function private.valid_payload(text,jsonb) rename to valid_payload_v2;
create function private.valid_payload(k text,p jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare photo jsonb;
begin
  if k<>'album' then return private.valid_payload_v2(k,p); end if;
  if jsonb_typeof(p)<>'object' or not p ?& array['title','date','photos'] or length(p::text)>30000 or jsonb_typeof(p->'title')<>'string' or length(trim(p->>'title')) not between 1 and 160
    or jsonb_typeof(p->'date')<>'string' or (p->>'date') !~ '^\d{4}-\d{2}-\d{2}$' or to_char((p->>'date')::date,'YYYY-MM-DD')<>p->>'date'
    or jsonb_typeof(p->'photos')<>'array' or jsonb_array_length(p->'photos')>60 then return false; end if;
  if (select count(distinct value->>'id') from jsonb_array_elements(p->'photos'))<>jsonb_array_length(p->'photos') then return false; end if;
  for photo in select value from jsonb_array_elements(p->'photos') loop
    if jsonb_typeof(photo)<>'object' or not photo ?& array['id','path','date','width','height'] or jsonb_typeof(photo->'id')<>'string' or (photo->>'id') !~ '^[0-9a-f-]{36}$'
      or jsonb_typeof(photo->'path')<>'string' or (photo->>'path') !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg$'
      or jsonb_typeof(photo->'date')<>'string' or (photo->>'date') !~ '^\d{4}-\d{2}-\d{2}$' or to_char((photo->>'date')::date,'YYYY-MM-DD')<>photo->>'date'
      or jsonb_typeof(photo->'width')<>'number' or (photo->>'width')::numeric<>trunc((photo->>'width')::numeric) or (photo->>'width')::integer not between 1 and 20000
      or jsonb_typeof(photo->'height')<>'number' or (photo->>'height')::numeric<>trunc((photo->>'height')::numeric) or (photo->>'height')::integer not between 1 and 20000 then return false; end if;
  end loop;
  return true;
exception when others then return false;
end; $$;
revoke all on function private.valid_payload(text,jsonb) from public;
create function private.validate_album_files() returns trigger language plpgsql security definer set search_path='' as $$
declare photo jsonb;
begin
  if new.kind<>'album' then return new; end if;
  for photo in select value from jsonb_array_elements(new.payload->'photos') loop
    if split_part(photo->>'path','/',1)<>new.couple_id::text or split_part(photo->>'path','/',3)<>photo->>'id'||'.jpg'
      or not exists(select 1 from storage.objects where bucket_id='couple-photos' and name=photo->>'path') then raise exception 'Una foto non appartiene al vostro spazio o non è stata caricata.'; end if;
  end loop;
  return new;
end; $$;
revoke all on function private.validate_album_files() from public,anon,authenticated;
create trigger validate_album_photos before insert or update on public.entries for each row execute function private.validate_album_files();
