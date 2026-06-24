-- ContractorFlow CRM
-- Beta RLS policies for testing Estimates and Contracts.
--
-- Scope:
-- - helper function for contractor membership checks
-- - estimates
-- - contracts
--
-- This file is intentionally limited to the document rollout stage after the
-- Settings, Clients, Leads, and Projects Supabase validation. Do not extend
-- this file to invoices, payments, events, photos, or storage policies.
--
-- Access rule:
-- A signed-in user may select, insert, update, and delete estimate/contract
-- rows only when they are an active, non-archived member of the same
-- contractor as the row:
--   contractor_members.user_id = auth.uid()
--   contractor_members.contractor_id = <row>.contractor_id
--   contractor_members.status = 'active'
--   contractor_members.archived_at is null
--
-- Notes:
-- - This file does not change application behavior by itself. It must be
--   applied in Supabase before USE_SUPABASE_ESTIMATES or
--   USE_SUPABASE_CONTRACTS can pass authenticated writes safely.
-- - Delete is allowed here because the UI still follows archive-first
--   behavior, but permanent delete remains contractor-scoped.

-- -----------------------------------------------------------------------------
-- Helper function
-- -----------------------------------------------------------------------------

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
-- estimates
-- -----------------------------------------------------------------------------

alter table public.estimates enable row level security;

drop policy if exists "beta_active_members_can_select_estimates" on public.estimates;
create policy "beta_active_members_can_select_estimates"
  on public.estimates
  for select
  using (public.is_active_contractor_member(contractor_id));

drop policy if exists "beta_active_members_can_insert_estimates" on public.estimates;
create policy "beta_active_members_can_insert_estimates"
  on public.estimates
  for insert
  with check (public.is_active_contractor_member(contractor_id));

drop policy if exists "beta_active_members_can_update_estimates" on public.estimates;
create policy "beta_active_members_can_update_estimates"
  on public.estimates
  for update
  using (public.is_active_contractor_member(contractor_id))
  with check (public.is_active_contractor_member(contractor_id));

drop policy if exists "beta_active_members_can_delete_estimates" on public.estimates;
create policy "beta_active_members_can_delete_estimates"
  on public.estimates
  for delete
  using (public.is_active_contractor_member(contractor_id));

-- -----------------------------------------------------------------------------
-- contracts
-- -----------------------------------------------------------------------------

alter table public.contracts enable row level security;

drop policy if exists "beta_active_members_can_select_contracts" on public.contracts;
create policy "beta_active_members_can_select_contracts"
  on public.contracts
  for select
  using (public.is_active_contractor_member(contractor_id));

drop policy if exists "beta_active_members_can_insert_contracts" on public.contracts;
create policy "beta_active_members_can_insert_contracts"
  on public.contracts
  for insert
  with check (public.is_active_contractor_member(contractor_id));

drop policy if exists "beta_active_members_can_update_contracts" on public.contracts;
create policy "beta_active_members_can_update_contracts"
  on public.contracts
  for update
  using (public.is_active_contractor_member(contractor_id))
  with check (public.is_active_contractor_member(contractor_id));

drop policy if exists "beta_active_members_can_delete_contracts" on public.contracts;
create policy "beta_active_members_can_delete_contracts"
  on public.contracts
  for delete
  using (public.is_active_contractor_member(contractor_id));
