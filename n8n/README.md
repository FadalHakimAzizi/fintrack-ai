# FinTrack — n8n Workflows (Phase 2)

Three automations that feed transactions into FinTrack via the website webhook.

| # | File | Trigger | LLM | Purpose |
|---|------|---------|-----|---------|
| 1 | [`01-telegram-bot.json`](01-telegram-bot.json) | Telegram message | OpenRouter text | Record transactions from chat messages |
| 2 | [`02-gmail-parser.json`](02-gmail-parser.json) | Gmail new email (labeled) | OpenRouter text | Auto-parse bank / e-wallet notifications |
| 3 | [`03-receipt-ocr.json`](03-receipt-ocr.json) | HTTP webhook with image URL | OpenRouter vision | OCR receipt / invoice images |

All three POST to `https://humorless-broadcast-earthling.ngrok-free.dev/api/webhooks/n8n` with the shared secret from [`finance-tracker/.env.example`](../.env.example).

## 0. Prerequisites

- **Phase 1 running.** Keep `npm run dev` alive and `ngrok http 3000` pointing to it so the webhook URL in the workflows resolves.
- **Schema migration applied.** In Supabase SQL Editor, run [`supabase/migrations/002_integrations.sql`](../supabase/migrations/002_integrations.sql). This adds `user_integrations` and `gmail_senders` tables needed for resolving `user_id` from a Telegram chat or Gmail address.

## 1. Create credentials in n8n

Open https://n8n.srv1423352.hstgr.cloud → **Credentials** → **New**. You need four:

### 1a. OpenRouter (Header Auth)

- **Credential type:** `Header Auth`
- **Name:** `OpenRouter`
- **Name of header:** `Authorization`
- **Value:** `Bearer sk-or-v1-...` ← get from https://openrouter.ai/keys

The free-tier model used by default is `openai/gpt-oss-20b:free` (text) and `google/gemini-2.0-flash-exp:free` (vision). Both are $0 on OpenRouter but rate-limited. If you hit limits or want better quality, edit the `model` field in the HTTP node to `openai/gpt-4o-mini` (~$0.15/1M tokens).

### 1b. Supabase Postgres

- **Credential type:** `Postgres`
- **Name:** `Supabase Postgres`
- **Host:** `aws-0-<region>.pooler.supabase.com` ← find under Supabase → Project Settings → Database → **Connection pooling** (use the pooler, not direct, to avoid IPv6 issues)
- **Database:** `postgres`
- **User:** `postgres.<project-ref>` (shown in the same page)
- **Password:** the DB password you set when creating the Supabase project
- **Port:** `6543`
- **SSL:** `require`

Test the connection — n8n should say "Connection successful".

### 1c. Telegram Bot

1. In Telegram, DM [@BotFather](https://t.me/BotFather) → `/newbot` → follow prompts → save the token (looks like `123456:ABC-...`).
2. In n8n → New credential → `Telegram API` → paste the token.
3. Name it `Telegram Bot`.

### 1d. Gmail OAuth2

1. In n8n → New credential → `Gmail OAuth2 API`.
2. Follow n8n's instructions to create a Google Cloud OAuth app (n8n shows the exact redirect URI to paste into Google Cloud Console).
3. Scopes needed: `https://www.googleapis.com/auth/gmail.modify`.
4. Authorize, then save as `Gmail`.

## 2. Import the workflows

Two options:

### Option A — push via REST API (fastest, supports re-push after edits)

```bash
cd finance-tracker
N8N_API_KEY=eyJhbGci... node n8n/push-workflows.mjs
```

Generate the API key at n8n → Settings → n8n API → Create API key. The script creates new workflows on first run and updates in place on subsequent runs (matched by name). Placeholder credentials are stripped before push — you still need to pick real credentials in the UI (step 3).

### Option B — import JSON manually

For each of the three JSON files:

1. Open n8n → **Workflows** → **Import from File** → pick the JSON.
2. After import, n8n will warn that credentials are missing on some nodes — click each red/yellow node and pick the matching credential you just created.
3. Click **Save**.

## 3. Wire up external services

### 3a. Telegram Bot

Link your chat to your user:

1. In Telegram, send any message to your bot (e.g. "hello").
2. The workflow will reply asking you to link. Copy the chat ID from the reply.
3. In Supabase SQL Editor:

   ```sql
   insert into user_integrations (user_id, channel, identifier, label)
   values (
     '<YOUR_AUTH_USER_ID>',   -- from auth.users; find in Supabase → Authentication → Users
     'telegram',
     '<YOUR_CHAT_ID>',
     'My Telegram'
   );
   ```

4. Activate the workflow (toggle in top-right of n8n editor).
5. Send the bot: `habis 50rb di warteg buat makan siang`. You should get a ✅ reply and see the transaction on `/transactions`.

### 3b. Gmail Parser

The workflow watches emails with the label **`FinTrack`**. You create and populate that label:

1. In Gmail, create a label `FinTrack` (Settings → Labels → Create new label).
2. Create a filter that auto-applies `FinTrack` to senders that notify you of transactions:
   - Settings → Filters and Blocked Addresses → Create a new filter
   - Example — `from:(noreply@bca.co.id OR notifications@shopee.co.id OR noreply@gopay.co.id)` → apply label `FinTrack`, don't mark as read
3. Create a second label `FinTrack/Processed` (the workflow adds it to emails after parsing — prevents re-processing).
4. Link your Gmail address to your user:

   ```sql
   insert into user_integrations (user_id, channel, identifier, label)
   values ('<YOUR_AUTH_USER_ID>', 'gmail', 'your.email@gmail.com', 'Personal Gmail');
   ```

5. **Fix the label IDs in the workflow.** Gmail labels have IDs like `Label_1234567890`, not names. After import, in the workflow:
   - Click **Gmail Trigger** node → under **Filters → Label Names or IDs**, clear the placeholder and pick `FinTrack` from the dropdown (n8n will fetch the real ID).
   - Click **Label Processed** node → **Label Names or IDs** → pick `FinTrack/Processed`.
6. Activate the workflow.

### 3c. Receipt OCR

This one is triggered via HTTP. Copy the webhook URL:

1. Open `FinTrack — Receipt OCR` → click the **Webhook** node → copy the **Production URL**. It will look like:
   `https://n8n.srv1423352.hstgr.cloud/webhook/fintrack-ocr`
2. Activate the workflow.

Test with curl, giving it any public image of a receipt:

```bash
curl -X POST https://n8n.srv1423352.hstgr.cloud/webhook/fintrack-ocr \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "<YOUR_AUTH_USER_ID>",
    "image_url": "https://example.com/receipt.jpg",
    "source_reference": "manual-test-1"
  }'
```

You should get back a JSON with the parsed fields, and see a new transaction on `/transactions` with `source_channel = ocr`.

### Optional: wire the website to the OCR workflow

In the Next.js app, after a receipt upload in the "New Transaction" form, you can trigger the OCR workflow and use the returned fields to pre-fill the form. This is a later enhancement — not part of this Phase 2 MVP.

## 4. Find your `user_id`

Several times above we reference `<YOUR_AUTH_USER_ID>`. To find it:

- **Supabase dashboard:** Authentication → Users → click your email → copy **User UID**.
- **Or SQL:** `select id, email from auth.users where email = 'you@example.com';`

## 5. Tweak the LLM prompts

All three workflows have a `jsonBody` field on their `Call LLM` / `Vision LLM` node that contains the system/user prompts inline. If parsing quality is poor:

- Lower `temperature` (already `0.1`) — can try `0`.
- Add few-shot examples to the system prompt.
- Swap the model. In the HTTP node's `jsonBody` expression, change `model: 'openai/gpt-oss-20b:free'` to:
  - `openai/gpt-4o-mini` — paid but much more reliable, still cheap.
  - `anthropic/claude-haiku-4-5` — more expensive, best accuracy for Indonesian.
  - `meta-llama/llama-3.3-70b-instruct` — middle ground.

OpenRouter's model list: https://openrouter.ai/models

## 6. Webhook auth & the ngrok URL

All three workflows POST to the website's `/api/webhooks/n8n` with `x-webhook-secret` baked in. That URL is your ngrok tunnel. When ngrok restarts, the URL changes. To update:

1. Start ngrok: `ngrok http 3000`.
2. Copy the new HTTPS URL.
3. In each workflow, open the **Post to Website** node, and in the `url` field replace the old ngrok URL with the new one.

When you deploy to Vercel, do this once more with the production URL.

## 7. Observe & debug

- Each workflow has an **Executions** tab in n8n — open it to see every run, input, and output.
- If a run fails, click it, then click the failing node's "Input"/"Output" panels. LLM parse errors are the most common; the `Build Payload` Code node deliberately returns `_error` so the IF node can route to a graceful response.
- Website-side, Next.js dev console will log the POST bodies from n8n.

## 8. Security notes

- The `N8N_WEBHOOK_SECRET` in these workflows is the one currently in your `.env.example`. If that file is ever public (it's committed), **rotate it**:
  1. Generate a new one: `openssl rand -hex 32`
  2. Replace `N8N_WEBHOOK_SECRET` in `.env.local`.
  3. Update the `x-webhook-secret` header in all three workflows.
- The Supabase Postgres credential uses the **Postgres password**, not the service-role key. It's tied to a DB user; rotate via Supabase → Database → Reset password.
- Don't expose the n8n OCR webhook to the open internet without adding auth (e.g., a header check in the Webhook node). For now it's effectively trust-by-obscurity.

## 9. What's next — Phase 3

Once these three run reliably, Phase 3 is the RAG chatbot:

- Embed each transaction row as it's inserted (either in n8n or via a Supabase DB trigger calling an n8n webhook).
- Store embeddings in a `pgvector` column alongside the transaction.
- Add a chat UI on the website that queries OpenRouter with retrieved rows as context.

That work has no new integrations — it's all inside Supabase + Next.js + one more n8n workflow for backfill.
