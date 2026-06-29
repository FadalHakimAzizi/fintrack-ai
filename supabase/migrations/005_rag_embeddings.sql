-- ============================================================================
-- 005_rag_embeddings.sql — pgvector semantic search over transactions (RAG)
-- Embedding model: Qwen3-Embedding-0.6B via Ollama (1024 dims, cosine).
-- Run in Supabase SQL Editor. Safe to re-run.
-- ============================================================================

-- 1. pgvector extension
create extension if not exists vector;

-- 2. Embedding column (1024 dims = Qwen3-Embedding-0.6B default output)
alter table public.transactions
  add column if not exists embedding vector(1024);

-- 3. Approximate-NN index (cosine distance). HNSW gives the best recall/latency
--    trade-off for our row counts. Built incrementally as rows get embedded.
create index if not exists transactions_embedding_idx
  on public.transactions
  using hnsw (embedding vector_cosine_ops);

-- 4. User-scoped semantic match.
--    SECURITY: runs as the caller (security invoker) AND filters by auth.uid(),
--    so a user can only ever retrieve their own transactions — mirrors the RLS
--    select policy on the base table.
--    match_threshold = minimum cosine similarity to be considered "relevant",
--    so unrelated questions (e.g. "tips hemat") return few/zero rows instead of
--    always returning the nearest N regardless of relevance.
drop function if exists public.match_transactions(vector, int);
drop function if exists public.match_transactions(vector, int, double precision);

create or replace function public.match_transactions(
  query_embedding vector(1024),
  match_count int default 8,
  match_threshold double precision default 0.0
)
returns table (
  id uuid,
  transaction_date date,
  transaction_type text,
  amount numeric,
  currency text,
  merchant_name text,
  item_name text,
  category text,
  payment_method text,
  notes text,
  similarity double precision
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    t.id,
    t.transaction_date,
    t.transaction_type::text,
    t.amount,
    t.currency,
    t.merchant_name,
    t.item_name,
    t.category,
    t.payment_method,
    t.notes,
    1 - (t.embedding <=> query_embedding) as similarity
  from public.transactions t
  where t.user_id = auth.uid()
    and t.embedding is not null
    and 1 - (t.embedding <=> query_embedding) >= match_threshold
  order by t.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;

grant execute on function public.match_transactions(vector, int, double precision) to authenticated;
