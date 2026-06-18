-- ContractorFlow CRM
-- Beta RLS policies for testing Projects / Jobs only.
--
-- Scope:
-- - helper function for contractor membership checks
-- - projects
--
-- This file is intentionally narrow. It is meant for the Projects / Jobs beta
-- rollout after the Settings, Clients, and Leads Supabase validation. Do not
-- extend this file to estimates, contracts, invoices, payments, events, or
-- photos.
--
-- Access rule:
-- A signed-in user may select, insert, update, and delete project rows only
-- when they are an active, non-archived member of the same contractor as the
-- project row:
--   contractor_members.user_id = auth.uid()
--   contractor_members.contractor_id = projects.contractor_id
--   contractor_members.status = 'active'
--   contractor_members.archived_at is null
--
-- Notes:
-- - This is a beta policy file for isolated Projects / Jobs testing only.
-- - Delete is allowed here because the app still follows archive-first
--   behavior, but permanent delete must remain contractor-scoped.
-- - This file does not change application behavior by itself. It only prepares
--   Supabase RLS so USE_SUPABASE_PROJECTS can be tested safely.

-- -----------------------------------------------------------------------------
-- Helper function
-- -----------------------------------------------------------------------------
-- Security definer is used so the same membership check can be reused safely
-- inside RLS policies.

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

-- -----------------------------------------------------------------------------
-- projects
-- -----------------------------------------------------------------------------

alter table public.projects enable row level security;

drop policy if exists "beta_active_members_can_select_projects" on public.projects;
create policy "beta_active_members_can_select_projects"
  on public.projects
  for select
  using (public.is_active_contractor_member(contractor_id));

drop policy if exists "beta_active_members_can_insert_projects" on public.projects;
create policy "beta_active_members_can_insert_projects"
  on public.projects
  for insert
  with check (public.is_active_contractor_member(contractor_id));

drop policy if exists "beta_active_members_can_update_projects" on public.projects;
create policy "beta_active_members_can_update_projects"
  on public.projects
  for update
  using (public.is_active_contractor_member(contractor_id))
  with check (public.is_active_contractor_member(contractor_id));

drop policy if exists "beta_active_members_can_delete_projects" on public.projects;
create policy "beta_active_members_can_delete_projects"
  on public.projects
  for delete
  using (public.is_active_contractor_member(contractor_id));
