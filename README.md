# FinTrack AI

Personal finance tracker — Next.js 14 + Supabase + Tailwind, built to plug into n8n automations in Phase 2.

**Quick start:** see [SETUP.md](SETUP.md).

## Stack

- Next.js 14 (App Router, Server Components, Server Actions)
- TypeScript
- Tailwind CSS (design tokens from `DESIGN.md`)
- Supabase (Postgres + Auth + Storage + RLS)
- Zod for validation

## Phase status

- [x] **Phase 1** — Website + Supabase
- [x] **Phase 2** — n8n workflows (Gmail parser, Telegram bot, Receipt OCR) — see [`n8n/README.md`](n8n/README.md)
- [x] **Phase 3** — AI Advisor chat on `/ai` (OpenRouter context-injection RAG)

## Scripts

```bash
npm run dev        # start Next.js on :3000
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
```
