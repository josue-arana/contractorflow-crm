-- ContractorFlow CRM Supabase RLS policy placeholders
--
-- Phase 1 Auth preparation for a free 1–5 contractor beta.
-- These policies are intentionally provided as templates only. Do not run them until
-- Supabase Auth is connected, contractor_members.user_id is populated from auth.users(id),
-- and the frontend is ready to operate with Row Level Security enabled.
--
-- Access model:
-- Users should only access records belonging to contractors where they have an active
-- contractor_members row:
--   contractor_members.user_id = auth.uid()
--   contractor_members.contractor_id = <table>.contractor_id
--   contractor_members.status = 'active'
--   contractor_members.archived_at is null
--
-- Future relationship note:
-- contractor_members.user_id is planned to reference auth.users(id), but the schema keeps
-- it as a nullable uuid during local development so Auth setup is not required yet.

-- ----------------------------------------------------------------------------
-- Future helper function template
-- ----------------------------------------------------------------------------

-- create or replace function public.is_active_contractor_member(target_contractor_id uuid)
-- returns boolean
-- language sql
-- stable
-- security definer
-- set search_path = public
-- as $$
--   select exists (
--     select 1
--     from contractor_members cm
--     where cm.contractor_id = target_contractor_id
--       and cm.user_id = auth.uid()
--       and cm.status = 'active'
--       and cm.archived_at is null
--   );
-- $$;

-- ----------------------------------------------------------------------------
-- contractors
-- ----------------------------------------------------------------------------

-- alter table contractors enable row level security;
-- create policy "active members can read their contractor account"
--   on contractors for select
--   using (public.is_active_contractor_member(id));
-- create policy "owners and admins can update their contractor account"
--   on contractors for update
--   using (public.is_active_contractor_member(id))
--   with check (public.is_active_contractor_member(id));

-- ----------------------------------------------------------------------------
-- contractor_members
-- ----------------------------------------------------------------------------

-- alter table contractor_members enable row level security;
-- create policy "active members can read members for their contractor"
--   on contractor_members for select
--   using (public.is_active_contractor_member(contractor_id));
-- create policy "owners and admins can manage members for their contractor"
--   on contractor_members for all
--   using (public.is_active_contractor_member(contractor_id))
--   with check (public.is_active_contractor_member(contractor_id));

-- ----------------------------------------------------------------------------
-- Tenant-owned CRM records
-- ----------------------------------------------------------------------------
-- The following tables all use the same contractor-scoped access pattern:
-- active members can read and write rows only when row.contractor_id belongs to one of
-- their active contractor memberships.

-- clients
-- alter table clients enable row level security;
-- create policy "active members can manage clients"
--   on clients for all
--   using (public.is_active_contractor_member(contractor_id))
--   with check (public.is_active_contractor_member(contractor_id));

-- leads
-- alter table leads enable row level security;
-- create policy "active members can manage leads"
--   on leads for all
--   using (public.is_active_contractor_member(contractor_id))
--   with check (public.is_active_contractor_member(contractor_id));

-- projects
-- alter table projects enable row level security;
-- create policy "active members can manage projects"
--   on projects for all
--   using (public.is_active_contractor_member(contractor_id))
--   with check (public.is_active_contractor_member(contractor_id));

-- estimates
-- alter table estimates enable row level security;
-- create policy "active members can manage estimates"
--   on estimates for all
--   using (public.is_active_contractor_member(contractor_id))
--   with check (public.is_active_contractor_member(contractor_id));

-- contracts
-- alter table contracts enable row level security;
-- create policy "active members can manage contracts"
--   on contracts for all
--   using (public.is_active_contractor_member(contractor_id))
--   with check (public.is_active_contractor_member(contractor_id));

-- invoices
-- alter table invoices enable row level security;
-- create policy "active members can manage invoices"
--   on invoices for all
--   using (public.is_active_contractor_member(contractor_id))
--   with check (public.is_active_contractor_member(contractor_id));

-- payments
-- alter table payments enable row level security;
-- create policy "active members can manage payments"
--   on payments for all
--   using (public.is_active_contractor_member(contractor_id))
--   with check (public.is_active_contractor_member(contractor_id));

-- events
-- alter table events enable row level security;
-- create policy "active members can manage events"
--   on events for all
--   using (public.is_active_contractor_member(contractor_id))
--   with check (public.is_active_contractor_member(contractor_id));

-- project_photos
-- alter table project_photos enable row level security;
-- create policy "active members can manage project photos"
--   on project_photos for all
--   using (public.is_active_contractor_member(contractor_id))
--   with check (public.is_active_contractor_member(contractor_id));

-- company_settings
-- alter table company_settings enable row level security;
-- create policy "active members can manage company settings"
--   on company_settings for all
--   using (public.is_active_contractor_member(contractor_id))
--   with check (public.is_active_contractor_member(contractor_id));

-- ----------------------------------------------------------------------------
-- Future Supabase Storage policy direction for project photos
-- ----------------------------------------------------------------------------
-- Create a private bucket for project photos and use contractor-scoped paths such as:
--   contractor_id/project_id/photo_id/original.jpg
-- Storage policies should verify that the first path segment matches a contractor_id for
-- which auth.uid() has an active contractor_members row.
