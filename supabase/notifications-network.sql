-- Requires pg_net and pg_cron. Called internally, never exposed to app clients.
create function private.process_push_queue() returns void language plpgsql security definer set search_path='' as $$
declare d record; response record; body jsonb; ticket jsonb; request bigint;
begin
  -- Prevent concurrent timer/trigger work from submitting the same delivery twice.
  if not pg_try_advisory_xact_lock(hashtextextended('love:push-dispatcher',0)) then return; end if;
  for d in select q.*,j.created_at,j.kind,j.recipient_id from private.push_deliveries q join private.notification_jobs j on j.id=q.job_id where q.status in ('pending','sending','accepted','receipting') and q.next_attempt_at<=now() order by q.next_attempt_at limit 100 for update of q skip locked loop
    if not exists(select 1 from private.push_devices p where p.device_id=d.device_id and p.enabled and p.user_id=d.recipient_id and p.token=d.token) then
      update private.push_deliveries set status='skipped',last_error='Device disabled or account changed' where job_id=d.job_id and device_id=d.device_id; continue;
    end if;
    if d.status in ('pending','sending') and (d.created_at<now()-interval '10 minutes' or d.kind='status' and (d.created_at at time zone 'Europe/Rome')::date<>(now() at time zone 'Europe/Rome')::date) then
      update private.push_deliveries set status='skipped',last_error='Event expired' where job_id=d.job_id and device_id=d.device_id; continue;
    end if;
    if d.status in ('sending','receipting') then
      select * into response from net._http_response where id=d.request_id;
      if not found and d.requested_at>now()-interval '2 minutes' then continue; end if;
      body:=null;
      begin body:=response.content::jsonb; exception when others then body:=null; end;
      if response.status_code between 200 and 299 and body is not null then
        if d.status='sending' then
          ticket:=body->'data'; if jsonb_typeof(ticket)='array' then ticket:=ticket->0; end if;
          if ticket->>'status'='ok' and ticket->>'id' is not null then
            update private.push_deliveries set status='accepted',ticket_id=ticket->>'id',accepted_at=now(),next_attempt_at=now()+interval '15 minutes',request_id=null,last_error=null where job_id=d.job_id and device_id=d.device_id; continue;
          end if;
        else
          ticket:=body->'data'->d.ticket_id;
          if ticket->>'status'='ok' then
            update private.push_deliveries set status='delivered',last_error=null where job_id=d.job_id and device_id=d.device_id;
            if not exists(select 1 from private.push_deliveries where job_id=d.job_id and status<>'delivered') then update private.notification_jobs set delivered_at=now() where id=d.job_id; end if;
            continue;
          elsif ticket is null and d.accepted_at>now()-interval '23 hours' then
            update private.push_deliveries set status='accepted',next_attempt_at=now()+interval '15 minutes',request_id=null where job_id=d.job_id and device_id=d.device_id; continue;
          end if;
        end if;
        if ticket->'details'->>'error'='DeviceNotRegistered' then update private.push_devices set enabled=false where device_id=d.device_id and token=d.token; end if;
        update private.push_deliveries set status='failed',last_error=coalesce(ticket->'details'->>'error','Invalid Expo response') where job_id=d.job_id and device_id=d.device_id; continue;
      elsif response.status_code between 400 and 499 and response.status_code<>429 then
        update private.push_deliveries set status='failed',last_error='Expo HTTP '||response.status_code::text where job_id=d.job_id and device_id=d.device_id; continue;
      else
        if d.status='sending' and d.attempts>=5 then
          update private.push_deliveries set status='failed',last_error='Network retry limit reached' where job_id=d.job_id and device_id=d.device_id;
        else
          update private.push_deliveries set status=case when d.status='sending' then 'pending' else 'accepted' end,next_attempt_at=now()+make_interval(secs=>least(300,30*greatest(d.attempts,1))),request_id=null,last_error='Temporary network error' where job_id=d.job_id and device_id=d.device_id;
        end if; continue;
      end if;
    end if;
    begin
      if d.status='pending' then
        request:=net.http_post(url:='https://exp.host/--/api/v2/push/send',body:=d.message,timeout_milliseconds:=10000);
      else
        request:=net.http_post(url:='https://exp.host/--/api/v2/push/getReceipts',body:=jsonb_build_object('ids',jsonb_build_array(d.ticket_id)),timeout_milliseconds:=10000);
      end if;
      update private.push_deliveries set status=case when d.status='pending' then 'sending' else 'receipting' end,attempts=attempts+1,request_id=request,requested_at=now(),next_attempt_at=now()+interval '1 minute' where job_id=d.job_id and device_id=d.device_id;
    exception when others then
      update private.push_deliveries set next_attempt_at=now()+interval '1 minute',last_error='Unable to queue HTTP request' where job_id=d.job_id and device_id=d.device_id;
    end;
  end loop;
end; $$;
revoke all on function private.process_push_queue() from public,anon,authenticated;
create function private.dispatch_notification() returns trigger language plpgsql security definer set search_path='' as $$
begin perform private.process_push_queue(); return new; end; $$;
revoke all on function private.dispatch_notification() from public,anon,authenticated;
-- Alphabetical trigger order: first capture the event, then submit it after commit.
create trigger z_dispatch_partner_notification after insert on private.notification_jobs for each row execute function private.dispatch_notification();
