-- Create Miguel's contractor profile if it does not exist yet.
-- The current schema uses `company_name`, not `name`.

insert into public.contractors (
  company_name,
  owner_name,
  created_at,
  updated_at
)
select
  'Skinner Division Contractor',
  'Miguel Giron',
  now(),
  now()
where not exists (
  select 1
  from public.contractors
  where company_name = 'Skinner Division Contractor'
    and owner_name = 'Miguel Giron'
    and archived_at is null
);
