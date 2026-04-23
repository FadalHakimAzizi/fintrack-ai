-- ============================================================================
-- Phase 3 extension — Budgets
-- Per-user monthly budget targets per category. Run in Supabase SQL Editor.
-- ============================================================================

create table if not exists public.budgets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  category    text not null,
  amount      numeric(18, 2) not null check (amount >= 0),
  currency    text not null default 'IDR',
  month       date not null,                -- first day of the target month, e.g. 2026-04-01
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, category, month)
);

create index if not exists budgets_user_month_idx on public.budgets(user_id, month);

drop trigger if exists set_budgets_updated_at on public.budgets;
create trigger set_budgets_updated_at
  before update on public.budgets
  for each row execute function public.tg_set_updated_at();

alter table public.budgets enable row level security;

drop policy if exists "budgets self all" on public.budgets;
create policy "budgets self all" on public.budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
