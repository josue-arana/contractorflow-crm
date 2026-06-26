-- Enable contractor-scoped Supabase events persistence for the beta rollout.
--
-- This migration is idempotent:
-- - adds missing event link and scheduling columns
-- - backfills explicit date/time/type fields from the legacy schema when possible
-- - adds lookup indexes
-- - enables contractor-member RLS policies for authenticated users

alter table public.events
  add column if not exists lead_id uuid references public.leads(id) on delete set null,
  add column if not exists event_type text,
  add column if not exists event_date date,
  add column if not exists start_time text,
  add column if not exists end_time text,
  add column if not exists reminder text;

update public.events
set event_date = coalesce(event_date, starts_at::date)
where starts_at is not null;

update public.events
set start_time = coalesce(start_time, to_char(starts_at, 'HH24:MI'))
where starts_at is not null;

update public.events
set end_time = coalesce(end_time, to_char(ends_at, 'HH24:MI'))
where ends_at is not null;

update public.events
set event_type = coalesce(
  event_type,
  case type
    when 'appointment' then 'Site Visit'
    when 'job' then 'Project Start'
    when 'payment' then 'Payment Due'
    when 'inspection' then 'Inspection'
    when 'follow_up' then 'Final Walkthrough'
    else 'Other'
  end
)
where event_type is null;

create index if not exists idx_events_contractor_id on public.events(contractor_id);
create index if not exists idx_events_client_id on public.events(client_id);
create index if not exists idx_events_project_id on public.events(project_id);
create index if not exists idx_events_lead_id on public.events(lead_id);
create index if not exists idx_events_status on public.events(status);
create index if not exists idx_events_created_at on public.events(created_at);

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
