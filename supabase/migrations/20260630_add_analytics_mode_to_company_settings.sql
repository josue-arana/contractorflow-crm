alter table public.company_settings
  add column if not exists analytics_mode boolean;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'company_settings'
      and column_name = 'simple_mode'
  ) then
    execute $sql$
      update public.company_settings
      set analytics_mode = coalesce(analytics_mode, not simple_mode, true)
      where analytics_mode is null
    $sql$;
  else
    update public.company_settings
    set analytics_mode = true
    where analytics_mode is null;
  end if;
end $$;

alter table public.company_settings
  alter column analytics_mode set default true;

update public.company_settings
set analytics_mode = true
where analytics_mode is null;

alter table public.company_settings
  alter column analytics_mode set not null;

notify pgrst, 'reload schema';
