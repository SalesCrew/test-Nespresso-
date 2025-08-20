-- SalesCrew Einsatzplan schema (run in Supabase SQL editor)
-- Safe to re-run: uses IF NOT EXISTS and ALTERs

-- 0) Extensions
create extension if not exists pgcrypto;

-- 1) Enums
do $$ begin
  if not exists (select 1 from pg_type where typname = 'assignment_type') then
    create type assignment_type as enum ('promotion','schulung','buddy');
  end if;
  if not exists (select 1 from pg_type where typname = 'assignment_status') then
    create type assignment_status as enum ('open','inviting','assigned','completed','cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'participant_role') then
    create type participant_role as enum ('lead','buddy','trainer');
  end if;
  if not exists (select 1 from pg_type where typname = 'invitation_status') then
    create type invitation_status as enum ('invited','applied','withdrawn','accepted','rejected');
  end if;
  if not exists (select 1 from pg_type where typname = 'time_method') then
    create type time_method as enum ('manual','geo','qr');
  end if;
  if not exists (select 1 from pg_type where typname = 'approval_status') then
    create type approval_status as enum ('pending','approved','rejected');
  end if;
end $$;

-- 2) Import batches
create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  source_filename text,
  month date,
  imported_by uuid references auth.users(id) on delete set null,
  imported_at timestamptz not null default now()
);

-- 3) Assignments
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid references public.import_batches(id) on delete set null,
  title text,
  description text,
  location_text text,
  postal_code text,
  city text,
  region text,
  start_ts timestamptz not null,
  end_ts timestamptz not null,
  type assignment_type not null default 'promotion',
  status assignment_status not null default 'open',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure time validity
create or replace function public.set_assignments_updated_at()
returns trigger language plpgsql as $$
begin
  if new.end_ts < new.start_ts then
    raise exception 'end_ts must be after start_ts';
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_assignments_set_updated_at on public.assignments;
create trigger trg_assignments_set_updated_at
before update on public.assignments
for each row execute function public.set_assignments_updated_at();

-- 4) Participants
create table if not exists public.assignment_participants (
  assignment_id uuid references public.assignments(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role participant_role not null default 'lead',
  status text,
  chosen_by_admin boolean not null default false,
  chosen_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (assignment_id, user_id)
);

-- 5) Invitations
create table if not exists public.assignment_invitations (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid references public.assignments(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role participant_role not null default 'lead',
  status invitation_status not null default 'invited',
  invited_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (assignment_id, user_id, role)
);

-- 6) Time entries (attendance)
create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid references public.assignments(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  check_in_ts timestamptz,
  check_out_ts timestamptz,
  method time_method,
  approval approval_status not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_time_entries_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_time_entries_set_updated_at on public.time_entries;
create trigger trg_time_entries_set_updated_at
before update on public.time_entries
for each row execute function public.set_time_entries_updated_at();

-- 7) Indexes
create index if not exists idx_assignments_timerange on public.assignments (start_ts, end_ts);
create index if not exists idx_assignments_region on public.assignments (region, postal_code);
create index if not exists idx_invites_assignment on public.assignment_invitations (assignment_id);
create index if not exists idx_participants_assignment on public.assignment_participants (assignment_id);
create index if not exists idx_time_entries_user_assignment on public.time_entries (user_id, assignment_id);

-- 8) RLS
alter table public.assignments enable row level security;
alter table public.assignment_participants enable row level security;
alter table public.assignment_invitations enable row level security;
alter table public.time_entries enable row level security;
alter table public.import_batches enable row level security;

-- Role helpers
create or replace function public.is_admin(uid uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.user_profiles up
    where up.user_id = uid and up.role in ('admin_of_admins','admin_staff')
  );
$$;

-- Assignments policies
drop policy if exists assignments_admin_all on public.assignments;
create policy assignments_admin_all on public.assignments
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists assignments_promotor_read_invited on public.assignments;
create policy assignments_promotor_read_invited on public.assignments
  for select using (
    exists (
      select 1 from public.assignment_invitations ai
      where ai.assignment_id = assignments.id and ai.user_id = auth.uid()
    ) or exists (
      select 1 from public.assignment_participants ap
      where ap.assignment_id = assignments.id and ap.user_id = auth.uid()
    )
  );

-- Participants policies
drop policy if exists participants_admin_all on public.assignment_participants;
create policy participants_admin_all on public.assignment_participants
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists participants_promotor_read_own on public.assignment_participants;
create policy participants_promotor_read_own on public.assignment_participants
  for select using (user_id = auth.uid());

-- Invitations policies
drop policy if exists invitations_admin_all on public.assignment_invitations;
create policy invitations_admin_all on public.assignment_invitations
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists invitations_promotor_read_write_own on public.assignment_invitations;
create policy invitations_promotor_read_write_own on public.assignment_invitations
  for select using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Time entries policies
drop policy if exists time_entries_admin_all on public.time_entries;
create policy time_entries_admin_all on public.time_entries
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists time_entries_promotor_own on public.time_entries;
create policy time_entries_promotor_own on public.time_entries
  for select using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 9) Grants (for PostgREST/Supa client)
grant usage on type assignment_type, assignment_status, participant_role, invitation_status, time_method, approval_status to anon, authenticated, service_role;


