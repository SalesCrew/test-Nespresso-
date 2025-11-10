-- Create table to track assignments freed due to special statuses (e.g., Krankenstand)
create table if not exists public.freed_assignments_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  reason text,
  assignment_ids jsonb not null,
  released_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- Optional index for faster user lookups
create index if not exists idx_freed_assignments_log_user on public.freed_assignments_log(user_id);


