-- Add acceptance addresses memory for market matcher
alter table if exists public.markets
  add column if not exists acceptance_addresses jsonb not null default '[]'::jsonb;


