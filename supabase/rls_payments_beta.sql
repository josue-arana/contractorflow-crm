-- ContractorFlow CRM
-- Beta RLS policies for Payments.
--
-- Scope:
-- - helper function for contractor membership checks
-- - payments
--
-- Access rule:
-- A signed-in user may select, insert, update, and delete payment rows only
-- when they are an active, non-archived member of the same contractor as the
-- row:
--   contractor_members.user_id = auth.uid()
--   contractor_members.contractor_id = <row>.contractor_id
--   contractor_members.status = 'active'
--   contractor_members.archived_at is null

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

alter table public.payments enable row level security;

drop policy if exists "beta_active_members_can_select_payments" on public.payments;
create policy "beta_active_members_can_select_payments"
  on public.payments
  for select
  using (public.is_active_contractor_member(contractor_id));

drop policy if exists "beta_active_members_can_insert_payments" on public.payments;
create policy "beta_active_members_can_insert_payments"
  on public.payments
  for insert
  with check (public.is_active_contractor_member(contractor_id));

drop policy if exists "beta_active_members_can_update_payments" on public.payments;
create policy "beta_active_members_can_update_payments"
  on public.payments
  for update
  using (public.is_active_contractor_member(contractor_id))
  with check (public.is_active_contractor_member(contractor_id));

drop policy if exists "beta_active_members_can_delete_payments" on public.payments;
create policy "beta_active_members_can_delete_payments"
  on public.payments
  for delete
  using (public.is_active_contractor_member(contractor_id));
