-- Account balances view (computed from transactions)
-- Shows current balance per account per user, computed as sum of income minus sum of expenses.

create or replace view public.account_balances as
select
  user_id,
  account_name,
  sum(case when transaction_type = 'income' then amount else -amount end) as balance,
  sum(case when transaction_type = 'income' then amount else 0 end) as total_in,
  sum(case when transaction_type = 'expense' then amount else 0 end) as total_out,
  count(*) as transaction_count,
  max(transaction_date) as last_transaction_date
from public.transactions
where account_name is not null and account_name <> ''
group by user_id, account_name;

-- Savings goals table
create table if not exists public.savings_goals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  target_amount numeric(18, 2) not null check (target_amount > 0),
  current_amount numeric(18, 2) not null default 0 check (current_amount >= 0),
  target_date   date,
  currency      text not null default 'IDR',
  icon          text,
  color         text,
  notes         text,
  status        text not null default 'active',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists savings_goals_user_idx on public.savings_goals(user_id);

drop trigger if exists set_savings_goals_updated_at on public.savings_goals;
create trigger set_savings_goals_updated_at
  before update on public.savings_goals
  for each row execute function public.tg_set_updated_at();

alter table public.savings_goals enable row level security;

drop policy if exists "savings_goals self all" on public.savings_goals;
create policy "savings_goals self all" on public.savings_goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
