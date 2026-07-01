-- ============================================================================
-- 006_cleanup.sql — hapus tabel, view, dan kolom yang tidak terpakai
--
-- Terverifikasi TIDAK terpakai lewat 3 sumber:
--   1. Database live  — 0 baris / 0-dari-91 baris terisi
--   2. Kode website   — 0 referensi di src/
--   3. Semua workflow n8n aktif (Receipt OCR, Telegram Bot, Gmail Parser)
--      — hanya menyentuh user_integrations (baca) + transactions (tulis)
--
-- ⚠️ URUTAN DEPLOY: deploy perubahan kode website LEBIH DULU (types.ts,
--    webhooks/n8n/route.ts, transactions/actions.ts). Sebelum di-deploy, app +
--    webhook masih meng-INSERT sebagian kolom ini, jadi men-drop-nya duluan
--    akan membuat insert gagal. Migrasi ini juga menulis ulang handle_new_user()
--    agar signup baru tidak lagi men-seed tabel accounts yang dihapus.
--
-- Jalankan di Supabase SQL Editor. Destruktif tapi idempotent (IF EXISTS).
-- ============================================================================

begin;

-- 1. Kolom transactions yang mati (0/91 terisi; tak dibaca app maupun n8n) -----
--    CATATAN: recurring_period DIPERTAHANKAN (fitur transaksi berulang,
--    pasangan recurring_flag — belum terpakai tapi masih valid).
alter table public.transactions
  drop column if exists tax_amount,
  drop column if exists discount_amount,
  drop column if exists balance_after_transaction,
  drop column if exists subcategory,
  drop column if exists quantity,
  drop column if exists unit_price,
  drop column if exists category_confidence;

-- 2. View yang tak pernah dirujuk --------------------------------------------
drop view if exists public.account_balances;
drop view if exists public.monthly_summary;

-- 3. Tabel gmail_senders (0 baris, 0 referensi di kode & n8n) ------------------
drop table if exists public.gmail_senders;

-- 4. Tabel accounts (hanya berisi baris seed default, tak pernah di-query) -----
--    Hentikan dulu seed-nya saat signup, baru drop tabelnya.
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

  return new;
end;
$$;

drop table if exists public.accounts;

commit;

-- Selesai. Dihapus: 7 kolom transactions, 2 view, 2 tabel.
-- Yang dipertahankan: profiles, categories, transactions, budgets,
-- savings_goals, user_integrations + kolom recurring_period/recurring_flag.
-- ============================================================================
