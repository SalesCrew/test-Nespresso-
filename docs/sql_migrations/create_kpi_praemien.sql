-- Create table for Prämien import (wave-based)
create table if not exists public.kpi_praemien (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wave_month date not null,
  gutscheine integer not null default 0,
  tma integer not null default 0,
  vertuo integer not null default 0,
  vertuo_pop integer not null default 0,
  aeroccino integer not null default 0,
  vorteilsbox integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, wave_month)
);

create index if not exists idx_kpi_praemien_user_wave on public.kpi_praemien (user_id, wave_month);
create index if not exists idx_kpi_praemien_wave on public.kpi_praemien (wave_month desc);

-- trigger to maintain updated_at
create or replace function public.update_kpi_praemien_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_kpi_praemien_updated_at on public.kpi_praemien;
create trigger trg_kpi_praemien_updated_at
before update on public.kpi_praemien
for each row execute function public.update_kpi_praemien_updated_at();

-- RLS
alter table public.kpi_praemien enable row level security;

create policy "Admins full access to kpi_praemien"
on public.kpi_praemien for all
using (
  exists (
    select 1 from public.user_profiles up
    where up.user_id = auth.uid()
      and up.role in ('admin_staff','admin_of_admins')
  )
);

create policy "Promotors can read own kpi_praemien"
on public.kpi_praemien for select
using (
  exists (
    select 1 from public.user_profiles up
    where up.user_id = auth.uid()
      and up.role = 'promotor'
  ) and user_id = auth.uid()
);


