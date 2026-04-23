#!/usr/bin/env node
// Push workflow JSON files to n8n via REST API and assign credentials in one pass.
// Credentials are matched by node type using the CREDS map below.
//
// Usage:   N8N_API_KEY=... node n8n/push-workflows.mjs
// Optional: N8N_BASE_URL=https://your-n8n.example.com

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const API_KEY = process.env.N8N_API_KEY;
const BASE_URL = process.env.N8N_BASE_URL || "https://n8n.srv1423352.hstgr.cloud";

if (!API_KEY) {
  console.error("Missing N8N_API_KEY env var.");
  process.exit(1);
}

const FILES = ["01-telegram-bot.json", "02-gmail-parser.json", "03-receipt-ocr.json"];

// Map of credential *type* → { id, name } to auto-assign when a node needs that type.
// Discover these via: curl -H "X-N8N-API-KEY: $N8N_API_KEY" https://<host>/api/v1/credentials
const CREDS = {
  telegramApi:    { id: "clVthhAwDHzTtYMF", name: "Telegram account" },
  postgres:       { id: "95T92WHjhxWa7Pcx", name: "Supabase Postgres" },
  httpHeaderAuth: { id: "BCJT7kQrSE53lpEz", name: "OpenRouter" },
  gmailOAuth2:    { id: "2cCqMvtYJ6vnZ2uI", name: "Gmail account" },
};

const ALLOWED_TOP = ["name", "nodes", "connections", "settings"];

function credTypeFor(node) {
  const t = node.type;
  if (t === "n8n-nodes-base.telegramTrigger" || t === "n8n-nodes-base.telegram")
    return "telegramApi";
  if (t === "n8n-nodes-base.postgres") return "postgres";
  if (t === "n8n-nodes-base.gmailTrigger" || t === "n8n-nodes-base.gmail")
    return "gmailOAuth2";
  if (t === "n8n-nodes-base.httpRequest") {
    const p = node.parameters || {};
    if (p.authentication === "genericCredentialType" && p.genericAuthType === "httpHeaderAuth")
      return "httpHeaderAuth";
  }
  return null;
}

function sanitize(wf) {
  const clean = {};
  for (const k of ALLOWED_TOP) if (k in wf) clean[k] = wf[k];
  clean.settings = clean.settings || { executionOrder: "v1" };

  clean.nodes = (clean.nodes || []).map((n) => {
    const copy = { ...n };
    const ct = credTypeFor(copy);
    if (ct && CREDS[ct]) {
      copy.credentials = { [ct]: CREDS[ct] };
    } else if (copy.credentials) {
      // strip any unresolved placeholder creds
      const hasPlaceholder = Object.values(copy.credentials).some((c) =>
        String(c?.id || "").startsWith("REPLACE_WITH_"),
      );
      if (hasPlaceholder) delete copy.credentials;
    }
    return copy;
  });

  return clean;
}

async function api(method, pathPart, body) {
  const res = await fetch(`${BASE_URL}/api/v1${pathPart}`, {
    method,
    headers: {
      "X-N8N-API-KEY": API_KEY,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let parsed;
  try { parsed = JSON.parse(text); } catch { parsed = { raw: text }; }
  return { status: res.status, body: parsed };
}

async function listExisting() {
  const r = await api("GET", "/workflows?limit=250");
  if (r.status !== 200) throw new Error(`List failed: ${r.status}`);
  return r.body.data || [];
}

async function deactivate(id) {
  return api("POST", `/workflows/${id}/deactivate`);
}

async function main() {
  const existing = await listExisting();
  const byName = new Map(existing.map((w) => [w.name, w]));

  for (const file of FILES) {
    const full = JSON.parse(await fs.readFile(path.join(__dirname, file), "utf8"));
    const payload = sanitize(full);

    const match = byName.get(payload.name);
    let id = match?.id;
    const wasActive = match?.active === true;

    // If the existing workflow is active, n8n won't accept a PUT that leaves any node
    // without credentials during validation. Deactivate first, then update, then caller
    // re-activates from the UI.
    if (id && wasActive) {
      await deactivate(id);
    }

    let result;
    if (id) {
      console.log(`→ updating "${payload.name}" (id=${id})${wasActive ? " [was active — deactivated]" : ""}`);
      result = await api("PUT", `/workflows/${id}`, payload);
    } else {
      console.log(`→ creating "${payload.name}"`);
      result = await api("POST", "/workflows", payload);
      id = result.body?.id;
    }

    if (result.status >= 200 && result.status < 300) {
      console.log(`  ✔ ${result.status} id=${id}`);
      console.log(`  ${BASE_URL}/workflow/${id}`);
    } else {
      console.log(`  ✗ ${result.status}`);
      console.log("  response:", JSON.stringify(result.body).slice(0, 600));
    }
  }
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
