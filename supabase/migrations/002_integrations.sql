-- ============================================================================
-- Phase 2 — Integrations
-- Adds channel-identity mapping so n8n can resolve user_id from Telegram chat
-- and whitelist Gmail senders. Run once in Supabase SQL Editor.
-- ============================================================================

-- Map external identities to users
create table if not exists public.user_integrations (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  channel          text not null check (channel in ('telegram', 'gmail')),
  identifier       text not null,     -- telegram chat_id as text, or gmail address (lowercased)
  label            text,
  created_at       timestamptz not null default now(),
  unique (channel, identifier)
);

create index if not exists user_integrations_user_idx
  on public.user_integrations(user_id);

-- Whitelist of senders that should be treated as transaction notifications
create table if not exists public.gmail_senders (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  sender_pattern   text not null,     -- e.g. 'noreply@bca.co.id' or 'notifications@shopee.co.id'
  label            text,
  created_at       timestamptz not null default now(),
  unique (user_id, sender_pattern)
);

alter table public.user_integrations enable row level security;
alter table public.gmail_senders     enable row level security;

drop policy if exists "user_integrations self all" on public.user_integrations;
create policy "user_integrations self all" on public.user_integrations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "gmail_senders self all" on public.gmail_senders;
create policy "gmail_senders self all" on public.gmail_senders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Helper: given a channel + identifier, return the user_id (uses service role in n8n)
create or replace function public.resolve_user_by_channel(p_channel text, p_identifier text)
returns uuid
language sql
stable
as $$
  select user_id
    from public.user_integrations
   where channel = p_channel and identifier = p_identifier
   limit 1;
$$;
