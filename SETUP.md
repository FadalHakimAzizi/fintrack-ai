# FinTrack AI — Setup Guide (Phase 1)

This is the MVP: Next.js website + Supabase database + storage + auth. No n8n yet — that's Phase 2.

## 1. Prerequisites

- **Node.js 18.17+** (20 LTS recommended) → https://nodejs.org/
- **npm** (bundled with Node) or **pnpm** / **yarn** if you prefer
- A **Supabase** account → https://supabase.com/ (free tier is fine)

Check versions:
```bash
node -v
npm -v
```

## 2. Create a Supabase project

1. Go to https://supabase.com/dashboard → **New project**.
2. Name it `finance-tracker`, pick a strong DB password (save it), region close to you (Singapore is closest for Indonesia).
3. Wait ~2 minutes until the project finishes provisioning.

### 2a. Run the schema

1. In the Supabase dashboard open **SQL Editor** → **New query**.
2. Open the file [`supabase/schema.sql`](supabase/schema.sql) in this repo, copy the whole thing, paste it into the SQL editor.
3. Click **Run**. You should see success with no errors.

What this creates:
- Tables: `profiles`, `categories`, `accounts`, `transactions`
- Enums: `transaction_type`, `source_channel`, `parsed_status`
- Storage bucket: `receipts` (private)
- Row-Level Security policies (every user only sees their own rows)
- Trigger that auto-creates a profile + 12 default categories + 3 default accounts when someone signs up
- A handy `monthly_summary` view for dashboards

Re-running the file is safe — it's idempotent.

### 2b. Configure auth

1. Go to **Authentication → Providers** → make sure **Email** is enabled.
2. Go to **Authentication → URL Configuration** and set:
   - **Site URL**: `http://localhost:3000` (for dev)
   - **Redirect URLs**: add `http://localhost:3000/auth/callback`
3. (Optional for dev) Go to **Authentication → Settings** → disable **Confirm email** if you want to skip email verification during testing. Re-enable before going to production.

### 2c. Grab your keys

Go to **Project Settings → API** and copy:
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **server-side only, never expose to the browser**

## 3. Configure env vars

In the project root:

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

N8N_WEBHOOK_SECRET=<generate one, e.g.: openssl rand -hex 32>
```

Generate a random secret on Windows (Git Bash / PowerShell):
```bash
# Git Bash
openssl rand -hex 32
# PowerShell
[Convert]::ToHexString((1..32 | ForEach-Object { Get-Random -Max 256 }))
```

## 4. Install & run

```bash
cd finance-tracker
npm install
npm run dev
```

Open http://localhost:3000 — you should be redirected to `/login`.

1. Click **Register**, create an account (use any email if you disabled email confirmation).
2. Log in → you land on `/dashboard`.
3. Click **Add Transaction** → fill the form, optionally upload a receipt image/PDF, save.
4. Verify the transaction shows on `/dashboard` and `/transactions`.
5. Click **Export CSV** on the transactions page to download.

## 5. Project structure

```
finance-tracker/
├── src/
│   ├── app/
│   │   ├── (auth)/          → login, register
│   │   ├── (dashboard)/     → dashboard, transactions (list/new/detail)
│   │   ├── api/
│   │   │   ├── transactions/[id]/  → REST PATCH/DELETE/GET
│   │   │   ├── transactions/       → REST GET/POST
│   │   │   ├── upload/             → receipt upload to Supabase Storage
│   │   │   ├── export/             → CSV export
│   │   │   └── webhooks/n8n/       → entry point for n8n automations
│   │   ├── auth/            → callback + signout
│   │   └── layout.tsx, page.tsx, globals.css
│   ├── components/
│   │   ├── ui/              → Button, Input, Select, Card, Icon
│   │   ├── layout/          → Sidebar, TopBar
│   │   ├── dashboard/       → StatCard, CategoryBars
│   │   └── transactions/    → TransactionForm, ReceiptUploader, TxRow
│   ├── lib/
│   │   ├── supabase/        → client, server, middleware, service client
│   │   ├── types.ts         → TS types mirroring DB schema
│   │   └── utils.ts         → cn(), formatCurrency, formatDate, toCSV
│   └── middleware.ts        → route protection via Supabase session
├── supabase/
│   └── schema.sql           → run once in Supabase SQL editor
├── .env.example
├── package.json
├── tailwind.config.ts       → design tokens from DESIGN.md
├── tsconfig.json
└── next.config.mjs
```

## 6. API reference (for Phase 2 / n8n)

All endpoints return JSON unless noted.

### Authenticated (browser session, cookie-based)

| Method | Path | Purpose |
|--------|------|---------|
| GET    | `/api/transactions?limit=100&type=expense&from=2026-01-01&to=2026-12-31&source=website` | List current user's transactions |
| POST   | `/api/transactions` | Create a transaction (body = JSON) |
| GET    | `/api/transactions/:id` | Fetch one |
| PATCH  | `/api/transactions/:id` | Partial update |
| DELETE | `/api/transactions/:id` | Delete |
| POST   | `/api/upload` | Upload receipt (multipart `file`), returns `{ path, url }` |
| GET    | `/api/export?...filters` | Download CSV |

### Service-to-service (for n8n → website)

| Method | Path | Purpose |
|--------|------|---------|
| POST   | `/api/webhooks/n8n` | Create a transaction from an automation |

Headers:
- `x-webhook-secret: <N8N_WEBHOOK_SECRET>` — required
- `content-type: application/json`

Body example (Gmail parser in n8n):

```json
{
  "user_id": "uuid-of-the-user",
  "transaction_type": "expense",
  "amount": 125000,
  "currency": "IDR",
  "transaction_date": "2026-04-22",
  "merchant_name": "Shopee",
  "category": "Shopping",
  "payment_method": "transfer",
  "account_name": "Bank Account",
  "source_channel": "gmail",
  "source_reference": "<gmail-message-id>",
  "notes": "Order INV/2026/04/22/...",
  "confidence_score": 0.92,
  "parsed_status": "parsed"
}
```

Notes:
- `user_id` is required — n8n must look up which user the email / telegram chat belongs to before calling this endpoint.
- This route uses the Supabase **service_role** key and bypasses RLS, so it will refuse without the correct `x-webhook-secret`. Keep that secret safe.
- `source_channel` must be one of: `website`, `telegram`, `gmail`, `ocr`, `api`.

## 7. Going to production

1. Push the code to GitHub.
2. Deploy to **Vercel** (easiest): New Project → import repo → set the four env vars.
3. Update Supabase **Site URL** and **Redirect URLs** to your production domain (e.g. `https://fintrack.example.com`).
4. Re-enable **Confirm email** in Supabase auth settings.
5. Rotate `N8N_WEBHOOK_SECRET` to a production value and update your n8n workflow.

## 8. Phase 2 — n8n workflows

See [`n8n/README.md`](n8n/README.md) for the full guide. The three workflows (Telegram bot, Gmail parser, Receipt OCR) all POST back into the `/api/webhooks/n8n` endpoint built in Phase 1.

## 9. Phase 3 — AI Advisor chat

Enables the `/ai` page: a chatbot that reads the user's last 90 days of transactions as context and answers questions about spending patterns, totals, trends, and merchants.

1. Sign up at https://openrouter.ai/ → create an API key.
2. Add to `.env.local`:
   ```
   OPENROUTER_API_KEY=sk-or-v1-...
   OPENROUTER_MODEL=openai/gpt-oss-120b:free
   ```
3. Restart `npm run dev`.
4. Go to http://localhost:3000/ai and try a question (Indonesian or English):
   - "Berapa total pengeluaran bulan ini?"
   - "Kategori apa yang paling boros?"
   - "Merchant apa yang paling sering saya pakai?"

The free model `openai/gpt-oss-120b:free` has usage limits per day. If you hit them or want better answers, swap `OPENROUTER_MODEL` to:
- `openai/gpt-4o-mini` — ~$0.15 per 1M input tokens, much more reliable
- `anthropic/claude-haiku-4-5` — best accuracy for Indonesian, ~$1 per 1M input tokens

### How the RAG works

This is **context-injection RAG** — no vector embeddings, no pgvector. Each request:

1. Fetches the user's transactions (last 90 days, max 500 rows)
2. Compacts them into a small JSON blob (~50 KB)
3. Sends the data + the user's question to the LLM in a single call
4. Returns the answer

For personal finance data this works better than vector search because most questions are aggregations the LLM can compute directly from the raw rows. If your transaction history grows beyond ~2000 rows or you need semantic search ("apa yang saya beli untuk liburan"), switch to a pgvector-based setup.

## 10. Deploy to Vercel

When you're ready to ditch the ngrok tunnel:

### 10a. Push to GitHub

```bash
cd finance-tracker
git init
git add .
git commit -m "Initial FinTrack"
gh repo create fintrack --private --source . --push
```

### 10b. Import to Vercel

1. Go to https://vercel.com/new → pick the `fintrack` repo → Framework preset detects **Next.js** automatically.
2. Expand **Environment Variables** and paste the same values from your `.env.local` (all five):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `N8N_WEBHOOK_SECRET`
   - `OPENROUTER_API_KEY`
   - (optional) `OPENROUTER_MODEL`
3. Click **Deploy**. Takes ~2 minutes.

### 10c. Update Supabase for the production URL

1. In Supabase → **Authentication → URL Configuration**:
   - **Site URL**: `https://fintrack-xxxx.vercel.app` (your Vercel URL)
   - **Redirect URLs**: add `https://fintrack-xxxx.vercel.app/auth/callback`
2. Re-enable **Confirm email** under **Authentication → Settings**.

### 10d. Update n8n workflows

Replace the ngrok URL in the 3 workflows. Fastest way — re-run the push script after editing the local JSON files, OR use this one-liner per workflow:

```bash
# Edit the 3 JSONs to use the Vercel URL, then:
N8N_API_KEY=... node n8n/push-workflows.mjs
```

Alternatively, open each workflow in n8n UI → **Post to Website** node → change `url` field → Save.

Don't forget to **rotate `N8N_WEBHOOK_SECRET`** to a fresh random string for production, and update it both in Vercel env vars AND in the n8n `x-webhook-secret` header.

### 10e. Custom domain (optional)

In Vercel: project → **Domains** → Add your domain → follow DNS instructions. Then repeat 10c with the custom domain.

## 11. Troubleshooting

| Symptom | Fix |
|---------|-----|
| "Invalid API key" on login | Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`, restart `npm run dev` |
| Signup works but no profile / categories created | The trigger `on_auth_user_created` didn't run — re-run `schema.sql` |
| "Row violates RLS policy" on insert | You're hitting a table from the wrong client (anon instead of service). Check the API route you're calling |
| Upload returns 401 | You're not logged in — uploads go through the browser session, not the webhook |
| Webhook returns 401 | `x-webhook-secret` header missing or doesn't match `N8N_WEBHOOK_SECRET` |
| Receipt link 404 when opening | The file path in the row doesn't match what's in storage — check `attachment_path` |
| `/ai` returns `OPENROUTER_API_KEY not configured` | Add the key to `.env.local` and restart `npm run dev` |
| `/ai` returns `OpenRouter 429` | You hit the free-tier rate limit. Wait, or switch `OPENROUTER_MODEL` to a paid model |
| Chat answers feel wrong / hallucinated | Try a stronger model (`openai/gpt-4o-mini` or `anthropic/claude-haiku-4-5`). Free models are weaker at math |
