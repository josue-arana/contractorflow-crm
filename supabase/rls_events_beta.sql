-- ContractorFlow CRM
-- Beta RLS policies for Events.
--
-- Scope:
-- - helper function for contractor membership checks
-- - events
--
-- Access rule:
-- A signed-in user may select, insert, update, and delete event rows only
-- when they are an active, non-archived member of the same contractor as the
-- row.

create or replace function public.is_active_contractor_member(target_contractor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.contractor_members cm
    where cm.contractor_id = target_contractor_id
      and cm.user_id = auth.uid()
      and cm.status = 'active'
      and cm.archived_at is null
  );
$$;

comment on function public.is_active_contractor_member(uuid)
  is 'Beta helper for contractor-scoped RLS testing. Returns true when auth.uid() is an active, non-archived member of the target contractor.';

alter table public.events enable row level security;

drop policy if exists "beta_active_members_can_select_events" on public.events;
create policy "beta_active_members_can_select_events"
  on public.events
  for select
  using (public.is_active_contractor_member(contractor_id));

drop policy if exists "beta_active_members_can_insert_events" on public.events;
create policy "beta_active_members_can_insert_events"
  on public.events
  for insert
  with check (public.is_active_contractor_member(contractor_id));

drop policy if exists "beta_active_members_can_update_events" on public.events;
create policy "beta_active_members_can_update_events"
  on public.events
  for update
  using (public.is_active_contractor_member(contractor_id))
  with check (public.is_active_contractor_member(contractor_id));

drop policy if exists "beta_active_members_can_delete_events" on public.events;
create policy "beta_active_members_can_delete_events"
  on public.events
  for delete
  using (public.is_active_contractor_member(contractor_id));
