-- Enable contractor-scoped Supabase payments persistence for the beta rollout.
--
-- This migration is idempotent:
-- - creates the payments table if it does not exist
-- - adds missing payment link columns to existing tables
-- - adds lookup indexes
-- - enables contractor-member RLS policies for authenticated users

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid not null references public.contractors(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  contract_id uuid references public.contracts(id) on delete set null,
  estimate_id uuid references public.estimates(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  invoice_id uuid references public.invoices(id) on delete set null,
  amount numeric(12,2) not null default 0,
  payment_type text,
  payment_method text,
  payment_date date default current_date,
  notes text,
  status public.payment_status not null default 'recorded',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

alter table public.payments
  add column if not exists contract_id uuid references public.contracts(id) on delete set null,
  add column if not exists estimate_id uuid references public.estimates(id) on delete set null,
  add column if not exists lead_id uuid references public.leads(id) on delete set null,
  add column if not exists payment_type text,
  add column if not exists payment_method text,
  add column if not exists notes text,
  add column if not exists archived_at timestamptz;

alter table public.payments
  alter column amount set default 0,
  alter column payment_date drop not null,
  alter column payment_date set default current_date,
  alter column status set default 'recorded';

update public.payments
set payment_method = coalesce(payment_method, method)
where payment_method is null
  and method is not null;

create index if not exists idx_payments_contractor_id on public.payments(contractor_id);
create index if not exists idx_payments_client_id on public.payments(client_id);
create index if not exists idx_payments_project_id on public.payments(project_id);
create index if not exists idx_payments_contract_id on public.payments(contract_id);
create index if not exists idx_payments_estimate_id on public.payments(estimate_id);
create index if not exists idx_payments_lead_id on public.payments(lead_id);
create index if not exists idx_payments_status on public.payments(status);
create index if not exists idx_payments_created_at on public.payments(created_at);

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
