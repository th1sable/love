create policy deny_client_access on private.invites as restrictive for all to anon, authenticated using(false) with check(false);
create policy deny_client_access on private.requests as restrictive for all to anon, authenticated using(false) with check(false);
create policy deny_client_access on private.notification_jobs as restrictive for all to anon, authenticated using(false) with check(false);
create index invites_couple_idx on private.invites(couple_id);
create index invites_creator_idx on private.invites(created_by);
create index notifications_author_idx on private.notification_jobs(author_id);
create index notifications_recipient_idx on private.notification_jobs(recipient_id);
create index entries_author_idx on public.entries(author_id);
