-- ContractorFlow CRM
-- Beta RLS policies for testing Settings first.
--
-- Scope:
-- - contractors
-- - contractor_members
-- - company_settings
--
-- This file is intentionally narrow. It is meant for first-pass Supabase
-- validation of contractor-scoped access before enabling any other entity.
-- Do not extend this file to clients, leads, projects, estimates, contracts,
-- invoices, payments, events, or photos yet.
--
-- Access rule:
-- A signed-in user may access contractor/company settings data only when they
-- have an active, non-archived membership row in contractor_members for that
-- same contractor:
--   contractor_members.user_id = auth.uid()
--   contractor_members.status = 'active'
--   contractor_members.archived_at is null
--
-- Notes:
-- - This keeps delete restrictive. No delete policies are added here.
-- - company_settings insert is allowed because the Settings service can
--   auto-create a default row when one does not exist yet.
-- - contractor and membership bootstrap should still be done by a trusted
--   admin/service role during beta setup.

-- -----------------------------------------------------------------------------
-- Helper function
-- -----------------------------------------------------------------------------
-- Security definer is used so the membership check can be reused safely in RLS
-- policies, including the contractor_members table itself.

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
  is 'Beta helper for Settings-first RLS testing. Returns true when auth.uid() is an active, non-archived member of the target contractor.';

-- -----------------------------------------------------------------------------
-- contractors
-- -----------------------------------------------------------------------------

alter table public.contractors enable row level security;

drop policy if exists "beta_active_members_can_select_their_contractor" on public.contractors;
create policy "beta_active_members_can_select_their_contractor"
  on public.contractors
  for select
  using (public.is_active_contractor_member(id));

drop policy if exists "beta_active_members_can_update_their_contractor" on public.contractors;
create policy "beta_active_members_can_update_their_contractor"
  on public.contractors
  for update
  using (public.is_active_contractor_member(id))
  with check (public.is_active_contractor_member(id));

-- No insert/delete policy for contractors in this beta file.
-- Initial contractor creation should remain a trusted bootstrap/admin action.

-- -----------------------------------------------------------------------------
-- contractor_members
-- -----------------------------------------------------------------------------

alter table public.contractor_members enable row level security;

drop policy if exists "beta_active_members_can_select_their_membership_scope" on public.contractor_members;
create policy "beta_active_members_can_select_their_membership_scope"
  on public.contractor_members
  for select
  using (public.is_active_contractor_member(contractor_id));

-- No insert/update/delete policy for contractor_members in this beta file.
-- Membership creation and role/status changes should stay restricted during the
-- first Settings-only rollout.

-- -----------------------------------------------------------------------------
-- company_settings
-- -----------------------------------------------------------------------------

alter table public.company_settings enable row level security;

drop policy if exists "beta_active_members_can_select_company_settings" on public.company_settings;
create policy "beta_active_members_can_select_company_settings"
  on public.company_settings
  for select
  using (public.is_active_contractor_member(contractor_id));

drop policy if exists "beta_active_members_can_insert_company_settings" on public.company_settings;
create policy "beta_active_members_can_insert_company_settings"
  on public.company_settings
  for insert
  with check (public.is_active_contractor_member(contractor_id));

drop policy if exists "beta_active_members_can_update_company_settings" on public.company_settings;
create policy "beta_active_members_can_update_company_settings"
  on public.company_settings
  for update
  using (public.is_active_contractor_member(contractor_id))
  with check (public.is_active_contractor_member(contractor_id));

-- No delete policy for company_settings in this beta file.
-- The preferred pattern is update-in-place, with archive handling reserved for
-- later workflows if needed.
