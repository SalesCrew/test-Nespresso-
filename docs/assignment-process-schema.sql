-- Assignment Process Tracking Table
-- Tracks the current state of a promotor's assignment process

create table if not exists public.assignment_processes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  process_stage text not null check (process_stage in ('idle', 'invited', 'applied', 'waiting', 'declined', 'confirmed')),
  original_assignment_ids uuid[] not null default '{}',
  replacement_assignment_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(user_id) -- Only one active process per user
);

-- Enable RLS
alter table public.assignment_processes enable row level security;

-- Policies
-- Promotors can read and update their own process
drop policy if exists processes_promotor_read_own on public.assignment_processes;
create policy processes_promotor_read_own on public.assignment_processes
  for select using (user_id = auth.uid());

drop policy if exists processes_promotor_insert_own on public.assignment_processes;
create policy processes_promotor_insert_own on public.assignment_processes
  for insert with check (user_id = auth.uid());

drop policy if exists processes_promotor_update_own on public.assignment_processes;
create policy processes_promotor_update_own on public.assignment_processes
  for update using (user_id = auth.uid());

drop policy if exists processes_promotor_delete_own on public.assignment_processes;
create policy processes_promotor_delete_own on public.assignment_processes
  for delete using (user_id = auth.uid());

-- Admins can read all
drop policy if exists processes_admin_read on public.assignment_processes;
create policy processes_admin_read on public.assignment_processes
  for select using (public.is_admin(auth.uid()));

-- Create index for efficient queries
create index if not exists idx_processes_user on public.assignment_processes (user_id);
create index if not exists idx_processes_stage on public.assignment_processes (process_stage);

-- Grant permissions
grant all on public.assignment_processes to authenticated;

-- Function to update timestamp
create or replace function public.update_assignment_process_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update timestamp
drop trigger if exists assignment_processes_update_timestamp on public.assignment_processes;
create trigger assignment_processes_update_timestamp
  before update on public.assignment_processes
  for each row
  execute function public.update_assignment_process_timestamp();
