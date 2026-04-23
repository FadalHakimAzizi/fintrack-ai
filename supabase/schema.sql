-- ============================================================================
-- Finance Tracker - Supabase schema
-- Run this in Supabase SQL Editor (New query) on a fresh project.
-- Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS patterns.
-- ============================================================================

-- Extensions -----------------------------------------------------------------
create extension if not exists "pgcrypto";

-- Enum types -----------------------------------------------------------------
do $$ begin
  create type transaction_type as enum ('income', 'expense');
exception when duplicate_object then null; end $$;

do $$ begin
  create type source_channel as enum ('website', 'telegram', 'gmail', 'ocr', 'api');
exception when duplicate_object then null; end $$;

do $$ begin
  create type parsed_status as enum ('pending', 'parsed', 'reviewed', 'failed');
exception when duplicate_object then null; end $$;

-- Profiles table -------------------------------------------------------------
-- One row per authenticated user. Created automatically on signup.
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  currency    text default 'IDR',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Categories table -----------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  kind        transaction_type not null default 'expense',
  color       text,
  icon        text,
  created_at  timestamptz not null default now(),
  unique (user_id, name, kind)
);

create index if not exists categories_user_idx on public.categories(user_id);

-- Accounts table (wallets / banks) -------------------------------------------
create table if not exists public.accounts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  kind        text,                     -- bank | ewallet | cash | credit_card
  currency    text default 'IDR',
  created_at  timestamptz not null default now(),
  unique (user_id, name)
);

create index if not exists accounts_user_idx on public.accounts(user_id);

-- Transactions table ---------------------------------------------------------
create table if not exists public.transactions (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references auth.users(id) on delete cascade,

  transaction_type            transaction_type not null,
  item_name                   text,
  category                    text,
  subcategory                 text,
  merchant_name               text,
  transaction_date            date not null default current_date,

  amount                      numeric(18, 2) not null check (amount >= 0),
  quantity                    numeric(18, 4),
  unit_price                  numeric(18, 2),
  tax_amount                  numeric(18, 2),
  discount_amount             numeric(18, 2),

  currency                    text not null default 'IDR',
  payment_method              text,
  account_name                text,
  location                    text,
  invoice_number              text,

  source_channel              source_channel not null default 'website',
  source_reference            text,
  notes                       text,
  attachment_url              text,
  attachment_path             text,

  tags                        text[] default '{}',
  recurring_flag              boolean not null default false,
  recurring_period            text,

  confidence_score            numeric(4, 3),        -- 0..1
  category_confidence         numeric(4, 3),
  parsed_status               parsed_status not null default 'parsed',
  reviewed_by_user            boolean not null default false,
  balance_after_transaction   numeric(18, 2),

  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, transaction_date desc);
create index if not exists transactions_user_category_idx
  on public.transactions (user_id, category);
create index if not exists transactions_user_merchant_idx
  on public.transactions (user_id, merchant_name);
create index if not exists transactions_user_source_idx
  on public.transactions (user_id, source_channel);

-- Trigger: keep updated_at in sync -------------------------------------------
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.transactions;
create trigger set_updated_at
  before update on public.transactions
  for each row execute function public.tg_set_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.tg_set_updated_at();

-- Trigger: auto-create profile + seed default categories on signup -----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));

  insert into public.categories (user_id, name, kind) values
    (new.id, 'Groceries',     'expense'),
    (new.id, 'Dining',        'expense'),
    (new.id, 'Transportation','expense'),
    (new.id, 'Utilities',     'expense'),
    (new.id, 'Entertainment', 'expense'),
    (new.id, 'Shopping',      'expense'),
    (new.id, 'Health',        'expense'),
    (new.id, 'Other',         'expense'),
    (new.id, 'Salary',        'income'),
    (new.id, 'Freelance',     'income'),
    (new.id, 'Investment',    'income'),
    (new.id, 'Other',         'income')
  on conflict do nothing;

  insert into public.accounts (user_id, name, kind) values
    (new.id, 'Cash',           'cash'),
    (new.id, 'Bank Account',   'bank'),
    (new.id, 'E-Wallet',       'ewallet')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row-level security ---------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.categories   enable row level security;
alter table public.accounts     enable row level security;
alter table public.transactions enable row level security;

-- profiles: user reads/updates own row
drop policy if exists "profiles self select" on public.profiles;
create policy "profiles self select" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles
  for update using (auth.uid() = id);

-- categories
drop policy if exists "categories self all" on public.categories;
create policy "categories self all" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- accounts
drop policy if exists "accounts self all" on public.accounts;
create policy "accounts self all" on public.accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- transactions
drop policy if exists "transactions self select" on public.transactions;
create policy "transactions self select" on public.transactions
  for select using (auth.uid() = user_id);

drop policy if exists "transactions self insert" on public.transactions;
create policy "transactions self insert" on public.transactions
  for insert with check (auth.uid() = user_id);

drop policy if exists "transactions self update" on public.transactions;
create policy "transactions self update" on public.transactions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "transactions self delete" on public.transactions;
create policy "transactions self delete" on public.transactions
  for delete using (auth.uid() = user_id);

-- Storage bucket for receipts -----------------------------------------------
-- Private bucket; files are addressed by user_id/<uuid>-<filename>
insert into storage.buckets (id, name, public)
  values ('receipts', 'receipts', false)
  on conflict (id) do nothing;

-- Storage policies: user can only touch files under their own user_id folder
drop policy if exists "receipts read own" on storage.objects;
create policy "receipts read own" on storage.objects
  for select
  using (
    bucket_id = 'receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "receipts insert own" on storage.objects;
create policy "receipts insert own" on storage.objects
  for insert
  with check (
    bucket_id = 'receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "receipts delete own" on storage.objects;
create policy "receipts delete own" on storage.objects
  for delete
  using (
    bucket_id = 'receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Monthly summary view (handy for dashboard) --------------------------------
create or replace view public.monthly_summary as
  select
    user_id,
    date_trunc('month', transaction_date)::date as month,
    transaction_type,
    sum(amount) as total_amount,
    count(*)    as tx_count
  from public.transactions
  group by user_id, date_trunc('month', transaction_date), transaction_type;

-- Done.
