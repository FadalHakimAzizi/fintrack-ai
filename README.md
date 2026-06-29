# FinTrack AI

> Personal finance tracker — record, categorize, and analyze your spending, with AI-assisted entry, receipt OCR, and chat-based insights.

FinTrack AI is a self-hosted personal finance app built on **Next.js 14 + Supabase**. You can log transactions manually, import them from CSV, capture them by photographing a receipt, or let automations (Telegram bot, Gmail parser) push them in for you. An AI Advisor reads your recent history and answers natural-language questions about your spending in Indonesian or English.

The app is the hub of a 3-phase system:

| Phase | What it adds | Status |
|-------|--------------|--------|
| **1** | Website + Supabase (auth, DB, storage, RLS) | ✅ |
| **2** | n8n automations — Telegram bot, Gmail parser, Receipt OCR — feeding the `/api/webhooks/n8n` endpoint | ✅ |
| **3** | AI Advisor chat (`/ai`) + semantic search via OpenRouter (context-injection RAG) | ✅ |

> For the deeper, step-by-step setup walkthrough (Supabase project creation, auth config, Vercel deploy), see **[SETUP.md](SETUP.md)**.
> For the n8n workflow setup (credentials, importing workflows, wiring Telegram/Gmail), see **[n8n/README.md](n8n/README.md)**.

---

## Table of contents

1. [Features](#features)
2. [Technology stack](#technology-stack)
3. [Architecture & project structure](#architecture--project-structure)
4. [Database schema](#database-schema)
5. [API reference](#api-reference)
6. [Project setup](#project-setup)
7. [Running the app](#running-the-app)
8. [Testing the app](#testing-the-app)
9. [Deployment](#deployment)

---

## Features

- **Transactions** — create, edit, delete, list, filter (by type / source / date range).
- **Manual entry & CSV import** — add one at a time or bulk-import from a CSV file.
- **Receipt OCR** — upload a receipt photo/PDF; an n8n + vision-LLM workflow extracts the fields.
- **AI Advisor** (`/ai`) — chat about your spending; the LLM gets your last 90 days as context.
- **AI quick-add** — describe a transaction in chat ("habis 50rb di warteg") and confirm to save it.
- **Semantic search** — LLM-backed search over transaction history ("apa yang saya beli untuk liburan").
- **Budgets** — per-category monthly budget targets with progress tracking.
- **Savings goals** — track progress toward target amounts.
- **Analytics & dashboard** — totals, category breakdown, account balances, insights, charts.
- **Multi-channel ingest** — transactions can come from `website`, `telegram`, `gmail`, `ocr`, or `api`.
- **Auth & multi-tenant isolation** — Supabase Auth + Postgres Row-Level Security (each user only sees their own rows).
- **i18n & theming** — Indonesian/English copy and a light/dark theme toggle.

---

## Technology stack

| Layer | Technology |
|-------|------------|
| Framework | **Next.js 14.2** (App Router, React Server Components, Server Actions) |
| Language | **TypeScript 5.6** (strict mode) |
| UI runtime | **React 18.3** |
| Styling | **Tailwind CSS 3.4** + PostCSS + Autoprefixer (design tokens in `tailwind.config.ts`) |
| Database | **Supabase Postgres** (tables, views, triggers, enums) |
| Auth | **Supabase Auth** (email/password, cookie sessions) |
| File storage | **Supabase Storage** (private `receipts` bucket) |
| Access control | **Postgres Row-Level Security (RLS)** |
| Validation | **Zod** |
| AI / LLM | **OpenRouter** API (text + vision models) |
| Automation | **n8n** (Telegram, Gmail, OCR workflows) |
| Hosting | **Vercel** (app) + **Supabase Cloud** (DB) |

### Key libraries (`package.json`)

**Dependencies**

| Package | Why |
|---------|-----|
| `next` | App framework |
| `react`, `react-dom` | UI |
| `@supabase/supabase-js` | Supabase JS client (DB, auth, storage) |
| `@supabase/ssr` | Cookie-based Supabase sessions for SSR / Server Components / middleware |
| `zod` | Runtime schema validation of API payloads & CSV rows |
| `clsx` | Conditional className composition |
| `tailwind-merge` | Dedupe/merge conflicting Tailwind classes (used by the `cn()` helper) |

**Dev dependencies**

`typescript`, `@types/node`, `@types/react`, `@types/react-dom`, `tailwindcss`, `postcss`, `autoprefixer`, `eslint`, `eslint-config-next`.

> Note: There is **no dedicated unit-test framework** (Jest/Vitest) in the project. Quality is enforced via `typecheck`, `lint`, and manual/integration testing — see [Testing the app](#testing-the-app).

---

## Architecture & project structure

The app uses the Next.js **App Router**. Routes are grouped with route groups: `(auth)` for unauthenticated pages and `(dashboard)` for the protected app shell. Data mutations use **Server Actions** (`actions.ts` files) where possible, and **Route Handlers** (`api/.../route.ts`) for REST endpoints and service-to-service calls.

```
finance-tracker/
├── src/
│   ├── app/
│   │   ├── (auth)/                  # Public auth pages (own layout)
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/             # Protected app (sidebar + topbar layout)
│   │   │   ├── dashboard/page.tsx       # Home: stats, insights, charts
│   │   │   ├── transactions/            # List, new, import, upload, [id] detail/edit
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   ├── import/page.tsx       # CSV import
│   │   │   │   ├── upload/page.tsx       # Receipt upload + OCR
│   │   │   │   ├── [id]/page.tsx
│   │   │   │   ├── [id]/edit/page.tsx
│   │   │   │   └── actions.ts            # Server Actions (create/update/delete)
│   │   │   ├── analytics/page.tsx
│   │   │   ├── budgets/                  # page.tsx + actions.ts
│   │   │   ├── goals/                    # page.tsx + actions.ts
│   │   │   ├── ai/page.tsx               # AI Advisor chat
│   │   │   ├── settings/                 # profile, categories, appearance + actions
│   │   │   └── layout.tsx
│   │   ├── api/                      # Route Handlers (REST + webhooks) — see API reference
│   │   │   ├── transactions/route.ts            # GET (list) / POST (create)
│   │   │   ├── transactions/[id]/route.ts       # GET / PATCH / DELETE
│   │   │   ├── chat/route.ts                     # AI Advisor (OpenRouter)
│   │   │   ├── chat-transaction/route.ts         # Save a transaction from AI chat
│   │   │   ├── search/route.ts                   # Semantic search (LLM)
│   │   │   ├── import/route.ts                    # Bulk CSV import
│   │   │   ├── export/route.ts                    # CSV export
│   │   │   ├── upload/route.ts                    # Receipt → Supabase Storage
│   │   │   ├── upload-receipt/route.ts            # Receipt → n8n OCR webhook
│   │   │   └── webhooks/n8n/route.ts              # Service-to-service ingest (n8n → app)
│   │   ├── auth/                     # callback/route.ts, signout/route.ts
│   │   ├── layout.tsx               # Root layout
│   │   ├── page.tsx                 # Landing / redirect
│   │   └── globals.css
│   │
│   ├── components/                  # Feature-grouped React components
│   │   ├── ui/                      # Primitives: button, card, input, icon, theme-toggle
│   │   ├── layout/                  # sidebar, topbar
│   │   ├── dashboard/               # stat-card, category-bars, insights-list
│   │   ├── transactions/            # transaction-form, tx-row, csv-importer, receipt-*
│   │   ├── budgets/                 # budget-form, budget-row
│   │   ├── goals/                   # goal-card, goal-form, goals-list
│   │   ├── charts/                  # bar-chart, line-chart
│   │   ├── settings/                # profile-form, category-manager, integrations
│   │   └── ai/                      # chat-panel, transaction-preview-card, voice-input
│   │
│   ├── lib/
│   │   ├── supabase/                # client.ts (browser), server.ts (server + service-role), middleware.ts
│   │   ├── types.ts                 # TS types mirroring the DB schema
│   │   ├── utils.ts                 # cn(), formatCurrency, formatDate, toCSV, …
│   │   ├── i18n.ts                  # Indonesian/English strings
│   │   ├── budgets.ts               # Budget calculation helpers
│   │   ├── insights.ts              # Dashboard insight generation
│   │   └── app-provider.tsx         # Client context (theme, locale)
│   │
│   ├── types/speech.d.ts            # Web Speech API typings (voice input)
│   └── middleware.ts                # Route protection via Supabase session
│
├── supabase/
│   ├── schema.sql                   # Base schema — run first
│   └── migrations/
│       ├── 002_integrations.sql     # user_integrations, gmail_senders, resolve_user_by_channel()
│       ├── 003_budgets.sql          # budgets table
│       └── 004_account_balances.sql # account_balances view, savings_goals table
│
├── n8n/                             # Phase 2 automation workflows + push/credential scripts
│   ├── 01-telegram-bot.json
│   ├── 02-gmail-parser.json
│   ├── 03-receipt-ocr.json
│   ├── 04-weekly-report.json
│   ├── push-workflows.mjs
│   ├── assign-credentials.mjs
│   ├── update-app-url.mjs
│   └── README.md
│
├── .env.example                     # Template for env vars
├── package.json
├── next.config.mjs                  # serverActions bodySizeLimit: 10mb
├── tailwind.config.ts               # Design tokens
├── tsconfig.json                    # Path alias: @/* → ./src/*
├── postcss.config.mjs
├── vercel.json
├── SETUP.md                         # Full setup walkthrough
└── README.md                        # This file
```

### File naming conventions

- **Folders/files:** `kebab-case` (e.g. `transaction-form.tsx`, `budget-row.tsx`).
- **Route segments:** lowercase folder name with a `page.tsx` (UI) and/or `route.ts` (API). `[id]` = dynamic segment, `(group)` = route group (no URL impact).
- **Server Actions:** colocated in `actions.ts` next to the page that uses them.
- **Components:** grouped by feature domain under `src/components/<domain>/`.
- **Path alias:** import from `@/…` → resolves to `src/…`.

### Supabase client tiers

| Client | File | Key used | RLS | Used in |
|--------|------|----------|-----|---------|
| Browser | `lib/supabase/client.ts` | anon | enforced | Client Components |
| Server (session) | `lib/supabase/server.ts` → `createClient()` | anon + user cookie | enforced (as the user) | Server Components, most API routes |
| Service-role | `lib/supabase/server.ts` → `createServiceClient()` | service_role | **bypassed** | `webhooks/n8n` only |
| Middleware | `lib/supabase/middleware.ts` | anon | — | session refresh / route guard |

---

## Database schema

Supabase Postgres. All user-owned tables enable **Row-Level Security**, so a user only ever reads/writes rows where `user_id = auth.uid()`. The base schema lives in [`supabase/schema.sql`](supabase/schema.sql); the migrations add later features.

### Enums

| Enum | Values |
|------|--------|
| `transaction_type` | `income`, `expense` |
| `source_channel` | `website`, `telegram`, `gmail`, `ocr`, `api` |
| `parsed_status` | `pending`, `parsed`, `reviewed`, `failed` |

### Tables

**`profiles`** — one row per auth user (auto-created on signup).

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | FK → `auth.users(id)` |
| `email`, `full_name` | text | |
| `currency` | text | default `IDR` |
| `created_at`, `updated_at` | timestamptz | |

**`categories`** — spending/income categories (12 defaults seeded on signup).

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | FK → auth.users |
| `name` | text | unique per `(user_id, name, kind)` |
| `kind` | `transaction_type` | default `expense` |
| `color`, `icon` | text | |

**`accounts`** — wallets/banks (3 defaults seeded on signup: Cash, Bank Account, E-Wallet).

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | FK → auth.users |
| `name` | text | unique per `(user_id, name)` |
| `kind` | text | `bank` / `ewallet` / `cash` / `credit_card` |
| `currency` | text | default `IDR` |

**`transactions`** — the core ledger. Key columns:

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | FK → auth.users |
| `transaction_type` | `transaction_type` | required |
| `amount` | numeric(18,2) | `>= 0`, required |
| `transaction_date` | date | default today |
| `item_name`, `category`, `subcategory`, `merchant_name` | text | |
| `quantity`, `unit_price`, `tax_amount`, `discount_amount` | numeric | line-item detail |
| `currency` | text | default `IDR` |
| `payment_method`, `account_name`, `location`, `invoice_number` | text | |
| `source_channel` | `source_channel` | default `website` |
| `source_reference` | text | e.g. Gmail message id / Telegram chat id |
| `notes`, `attachment_url`, `attachment_path` | text | |
| `tags` | text[] | |
| `recurring_flag` | boolean | + `recurring_period` |
| `confidence_score`, `category_confidence` | numeric(4,3) | `0..1` (LLM confidence) |
| `parsed_status` | `parsed_status` | default `parsed` |
| `reviewed_by_user` | boolean | |
| `balance_after_transaction` | numeric(18,2) | |
| `created_at`, `updated_at` | timestamptz | |

Indexes on `(user_id, transaction_date desc)`, `(user_id, category)`, `(user_id, merchant_name)`, `(user_id, source_channel)`.

**`user_integrations`** *(migration 002)* — maps an external identity to a user so n8n can resolve `user_id`.

| Column | Type | Notes |
|--------|------|-------|
| `channel` | text | `telegram` or `gmail` |
| `identifier` | text | telegram chat_id / gmail address — unique per `(channel, identifier)` |
| `label` | text | |

**`gmail_senders`** *(migration 002)* — whitelist of senders treated as transaction notifications (`sender_pattern`, unique per `(user_id, sender_pattern)`).

**`budgets`** *(migration 003)* — per-category monthly budget targets (`category`, `amount`, `month`, unique per `(user_id, category, month)`).

**`savings_goals`** *(migration 004)* — `name`, `target_amount`, `current_amount`, `target_date`, `status`, etc.

### Views

| View | Purpose |
|------|---------|
| `monthly_summary` | Per-user, per-month, per-type totals (`total_amount`, `tx_count`) |
| `account_balances` *(migration 004)* | Per-account computed balance (income − expense), totals in/out, tx count, last date |

### Functions & triggers

| Object | Purpose |
|--------|---------|
| `tg_set_updated_at()` | Keeps `updated_at` current on update (transactions, profiles, budgets, savings_goals) |
| `handle_new_user()` | On `auth.users` insert: creates profile, seeds 12 categories + 3 accounts |
| `resolve_user_by_channel(channel, identifier)` *(migration 002)* | Returns the `user_id` for a Telegram/Gmail identity (used by n8n) |

### Storage

- Private bucket **`receipts`**. Files are addressed as `<user_id>/<uuid>.<ext>`. Storage RLS policies restrict read/insert/delete to files under the user's own `user_id` folder.

---

## API reference

All endpoints live under `/api`. Responses are JSON unless noted. Two auth models:

- **Session (cookie-based):** the user must be logged in; the route uses the user-scoped Supabase client and RLS applies. Returns `401` if not authenticated.
- **Service-to-service:** no cookie; authenticated by the `x-webhook-secret` header. Uses the service-role client (RLS bypassed). Returns `401` if the secret is missing/wrong.

### Transactions

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/api/transactions` | Session | List user transactions. Query params: `limit` (max 500), `type` (`income`\|`expense`), `source`, `from` (date), `to` (date). |
| `POST` | `/api/transactions` | Session | Create a transaction (JSON body). |
| `GET` | `/api/transactions/:id` | Session | Fetch one. |
| `PATCH` | `/api/transactions/:id` | Session | Partial update. |
| `DELETE` | `/api/transactions/:id` | Session | Delete. |

### Import / export

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/api/import` | Session | Bulk insert from CSV. Body: `{ "rows": [...] }`, each row validated with Zod. |
| `GET` | `/api/export` | Session | Download transactions as CSV (accepts the same filters as the list endpoint). |

### Files / receipts

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/api/upload` | Session | Upload a receipt (multipart `file`) to the `receipts` bucket. Allowed: JPEG/PNG/PDF, max 5 MB. Returns `{ path, url }`. |
| `POST` | `/api/upload-receipt` | Session | Upload a receipt and forward it to the n8n OCR webhook (`N8N_OCR_WEBHOOK_URL`). Allowed: JPEG/PNG/WebP/PDF, max 8 MB. Returns parsed fields. Requires the env var to be set. |

### AI (OpenRouter)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/api/chat` | Session | AI Advisor. Body: `{ messages: [{role, content}], imageUrl? }`. Injects the last 90 days (≤500 tx) as context. Requires `OPENROUTER_API_KEY`. |
| `POST` | `/api/chat-transaction` | Session | Save a transaction proposed in chat. Body validated with Zod (amount must be positive). |
| `POST` | `/api/search` | Session | Semantic search over ~6 months of history. Body: `{ query }`. Requires `OPENROUTER_API_KEY`. |

### Webhooks (service-to-service)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/api/webhooks/n8n` | none | Health check — `{ ok: true }`. |
| `POST` | `/api/webhooks/n8n` | `x-webhook-secret` | Ingest a transaction from an automation. Bypasses RLS, so the payload **must include `user_id`**. |

**`POST /api/webhooks/n8n` example**

```bash
curl -X POST https://YOUR_APP/api/webhooks/n8n \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: $N8N_WEBHOOK_SECRET" \
  -d '{
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
    "confidence_score": 0.92,
    "parsed_status": "parsed"
  }'
```

Required fields: `user_id`, `transaction_type`, `amount`, `source_channel`. `source_channel` must be one of `website`, `telegram`, `gmail`, `ocr`, `api`. Returns `201 { ok: true, id }`.

### Auth helper routes

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/auth/callback` | Supabase OAuth/email callback — exchanges the code for a session. |
| `GET`/`POST` | `/auth/signout` | Clears the session. |

---

## Project setup

> This is the condensed version. For the full walkthrough (Supabase project creation, auth URL config, key locations), follow **[SETUP.md](SETUP.md)**.

### 1. Prerequisites

- **Node.js 18.17+** (20 LTS recommended) and **npm**
- A **Supabase** account (free tier is fine)
- *(Phase 3)* an **OpenRouter** API key — https://openrouter.ai/keys
- *(Phase 2, optional)* a running **n8n** instance + an exposed app URL (e.g. ngrok in dev)

### 2. Install dependencies

```bash
cd finance-tracker
npm install
```

### 3. Set up the database

In the Supabase dashboard → **SQL Editor**, run the files **in order**:

1. `supabase/schema.sql`
2. `supabase/migrations/002_integrations.sql`
3. `supabase/migrations/003_budgets.sql`
4. `supabase/migrations/004_account_balances.sql`

All scripts are idempotent (safe to re-run). Then under **Authentication → Providers** enable **Email**, and set the **Site URL** + **Redirect URL** (`http://localhost:3000` and `http://localhost:3000/auth/callback` for dev).

### 4. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service-role key — **server-only, never expose to the browser** |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public app URL (used in email links) |
| `N8N_WEBHOOK_SECRET` | Phase 2 | Shared secret for `/api/webhooks/n8n` (`openssl rand -hex 32`) |
| `N8N_BASE_URL` | Phase 2 | Your n8n instance base URL |
| `N8N_OCR_WEBHOOK_URL` | Phase 2 | n8n OCR webhook URL (enables `/api/upload-receipt`) |
| `OPENROUTER_API_KEY` | Phase 3 | OpenRouter key (AI Advisor + semantic search) |
| `OPENROUTER_MODEL` | optional | Defaults to a free model; override for quality (e.g. `openai/gpt-4o-mini`) |

---

## Running the app

```bash
npm run dev        # start Next.js dev server on http://localhost:3000
npm run build      # production build
npm run start      # serve the production build
```

Open http://localhost:3000 — you'll be redirected to `/login`. Register an account, log in, and you land on `/dashboard`.

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `next dev` | Local development with hot reload |
| `build` | `next build` | Production build |
| `start` | `next start` | Serve the built app |
| `lint` | `next lint` | ESLint |
| `typecheck` | `tsc --noEmit` | TypeScript type checking |

---

## Testing the app

There is **no automated unit-test suite** in this project. Verify changes with the static checks below plus manual/integration flows.

### Static checks (run before every commit)

```bash
npm run typecheck   # tsc --noEmit — catches type errors
npm run lint        # next lint — catches lint issues
npm run build       # full production build — catches build-time errors
```

### Manual smoke test (Phase 1)

1. Register → log in → land on `/dashboard`.
2. **Add Transaction** → fill the form (optionally upload a receipt) → save.
3. Confirm it appears on `/dashboard` and `/transactions`.
4. Edit it (`/transactions/:id/edit`), then delete it.
5. **Import** a small CSV on `/transactions/import`.
6. **Export CSV** from the transactions page.

### API testing (curl / Postman)

- Health check: `GET /api/webhooks/n8n` → `{ ok: true }`.
- Webhook ingest: `POST /api/webhooks/n8n` with the `x-webhook-secret` header (see the [example above](#post-apiwebhooksn8n-example)). A wrong/missing secret must return `401`.
- Session endpoints (`/api/transactions`, `/api/export`, …) require a logged-in browser session — easiest to test from the app or with the session cookie.

### AI features (Phase 3)

With `OPENROUTER_API_KEY` set, go to `/ai` and ask, e.g.:
- "Berapa total pengeluaran bulan ini?"
- "Kategori apa yang paling boros?"

### n8n workflows (Phase 2)

Test each workflow from its **Executions** tab in n8n, and end-to-end by sending the bot a message / receiving a matching email / POSTing an image to the OCR webhook. The workflow JSON can also be validated with the **n8n-mcp** tools (`validate_workflow`). See [n8n/README.md](n8n/README.md) §3 for per-workflow test steps.

---

## Deployment

Deploy the app to **Vercel** and keep the database on **Supabase Cloud**:

1. Push to GitHub.
2. Vercel → **New Project** → import the repo (Next.js is auto-detected).
3. Add all env vars from `.env.local` in the Vercel project settings.
4. In Supabase → **Authentication → URL Configuration**, set **Site URL** + **Redirect URL** to your Vercel domain, and re-enable **Confirm email**.
5. Rotate `N8N_WEBHOOK_SECRET` to a fresh value and update it in both Vercel and your n8n workflows.

Full deployment details (custom domain, updating n8n URLs) are in [SETUP.md §10](SETUP.md).
