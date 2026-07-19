-- Premium first-time onboarding state lives with the contractor-scoped company
-- settings it configures. Existing settings rows are marked complete in the
-- same transaction; future rows start incomplete and enter onboarding.

alter table public.company_settings
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists onboarding_dismissed boolean not null default false,
  add column if not exists onboarding_step integer not null default 1,
  add column if not exists primary_brand_color text,
  add column if not exists default_tax_rate numeric(6,3) not null default 0,
  add column if not exists default_estimate_expiration_days integer not null default 30,
  add column if not exists default_currency text not null default 'USD';

update public.company_settings
set onboarding_completed = true,
    onboarding_dismissed = false,
    onboarding_step = 5
where created_at < now()
  and onboarding_completed = false;

alter table public.company_settings
  drop constraint if exists company_settings_onboarding_step_check,
  add constraint company_settings_onboarding_step_check check (onboarding_step between 1 and 5),
  drop constraint if exists company_settings_default_tax_rate_check,
  add constraint company_settings_default_tax_rate_check check (default_tax_rate between 0 and 100),
  drop constraint if exists company_settings_estimate_expiration_check,
  add constraint company_settings_estimate_expiration_check check (default_estimate_expiration_days between 1 and 365),
  drop constraint if exists company_settings_currency_check,
  add constraint company_settings_currency_check check (default_currency in ('USD', 'CAD', 'MXN'));

comment on column public.company_settings.onboarding_completed is
  'True after the premium workspace setup flow is completed.';
comment on column public.company_settings.onboarding_dismissed is
  'True when an incomplete user chooses Skip for Now, preventing login interruption.';
comment on column public.company_settings.onboarding_step is
  'Last persisted premium onboarding step, from 1 through 5.';
