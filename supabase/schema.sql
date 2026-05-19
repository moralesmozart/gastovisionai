-- GastoVision published demos (run in Supabase SQL Editor)
-- Project: https://supabase.com/dashboard/project/zhscpcfgcctdhkpcmdmg

create table if not exists public.published_demos (
  id uuid primary key default gen_random_uuid(),
  short_code text not null unique,
  restaurant_name text,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists published_demos_short_code_idx
  on public.published_demos (short_code);

alter table public.published_demos enable row level security;

-- Public read (anyone with the short code can open the demo)
drop policy if exists "published_demos_select" on public.published_demos;
create policy "published_demos_select"
  on public.published_demos for select
  using (true);

-- Public insert from the sales demo wizard (tighten later with auth / rate limits)
drop policy if exists "published_demos_insert" on public.published_demos;
create policy "published_demos_insert"
  on public.published_demos for insert
  with check (true);
