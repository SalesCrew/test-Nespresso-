-- Invitation History Table
-- This table tracks bulk invitation actions by admins

-- Create table for invitation history
create table if not exists public.invitation_history (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  promotion_count int not null default 0,
  promotor_count int not null default 0,
  buddy boolean not null default false,
  -- Store the IDs for reference
  assignment_ids uuid[] not null default '{}',
  promotor_ids uuid[] not null default '{}',
  -- Denormalized data for display
  metadata jsonb not null default '{}'
);

-- Enable RLS
alter table public.invitation_history enable row level security;

-- Admin-only access
drop policy if exists invitation_history_admin_all on public.invitation_history;
create policy invitation_history_admin_all on public.invitation_history
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- Create index for efficient sorting
create index if not exists idx_invitation_history_created_at on public.invitation_history (created_at desc);

-- Grant permissions
grant all on public.invitation_history to authenticated;
grant select on public.invitation_history to anon;
