-- Assignment Acknowledgments Table
-- Tracks when promotors have acknowledged their accepted assignments

create table if not exists public.assignment_acknowledgments (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid references public.assignments(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  acknowledged_at timestamptz not null default now(),
  unique(assignment_id, user_id)
);

-- Enable RLS
alter table public.assignment_acknowledgments enable row level security;

-- Policies
-- Promotors can read and insert their own acknowledgments
drop policy if exists acknowledgments_promotor_read_own on public.assignment_acknowledgments;
create policy acknowledgments_promotor_read_own on public.assignment_acknowledgments
  for select using (user_id = auth.uid());

drop policy if exists acknowledgments_promotor_insert_own on public.assignment_acknowledgments;
create policy acknowledgments_promotor_insert_own on public.assignment_acknowledgments
  for insert with check (user_id = auth.uid());

-- Admins can read all
drop policy if exists acknowledgments_admin_read on public.assignment_acknowledgments;
create policy acknowledgments_admin_read on public.assignment_acknowledgments
  for select using (public.is_admin(auth.uid()));

-- Create index for efficient queries
create index if not exists idx_acknowledgments_user_assignment on public.assignment_acknowledgments (user_id, assignment_id);

-- Grant permissions
grant all on public.assignment_acknowledgments to authenticated;
