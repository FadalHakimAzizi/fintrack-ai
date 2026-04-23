#!/usr/bin/env node
// Assigns n8n credentials to the FinTrack workflows by matching node types.
// Edit CREDS below with your real credential IDs before running.
//
// Usage: N8N_API_KEY=... node n8n/assign-credentials.mjs

import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const API_KEY = process.env.N8N_API_KEY;
const BASE_URL = process.env.N8N_BASE_URL || "https://n8n.srv1423352.hstgr.cloud";
if (!API_KEY) {
  console.error("Missing N8N_API_KEY env var.");
  process.exit(1);
}

// Map of credential *type* → { id, name } to assign. Discover these via
//   curl -H "X-N8N-API-KEY: $N8N_API_KEY" https://<host>/api/v1/credentials
const CREDS = {
  telegramApi:    { id: "clVthhAwDHzTtYMF", name: "Telegram account" },
  postgres:       { id: "95T92WHjhxWa7Pcx", name: "Supabase Postgres" },
  httpHeaderAuth: { id: "BCJT7kQrSE53lpEz", name: "OpenRouter" },
  gmailOAuth2:    { id: "2cCqMvtYJ6vnZ2uI", name: "Gmail account" },
};

// Which credential type a given node wants
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

async function main() {
  const list = await api("GET", "/workflows?limit=250");
  if (list.status !== 200) throw new Error(`List failed: ${list.status}`);

  const finTrack = (list.body.data || []).filter((w) => w.name.startsWith("FinTrack —"));
  if (finTrack.length === 0) {
    console.log("No FinTrack workflows found. Run push-workflows.mjs first.");
    return;
  }

  for (const wf of finTrack) {
    const get = await api("GET", `/workflows/${wf.id}`);
    if (get.status !== 200) {
      console.log(`${wf.name}: get failed ${get.status}`);
      continue;
    }
    const full = get.body;

    let changed = 0;
    let skipped = 0;
    for (const node of full.nodes) {
      const ct = credTypeFor(node);
      if (!ct) continue;
      const cred = CREDS[ct];
      if (!cred) {
        skipped++;
        continue;
      }
      node.credentials = { [ct]: cred };
      changed++;
    }

    const put = await api("PUT", `/workflows/${wf.id}`, {
      name: full.name,
      nodes: full.nodes,
      connections: full.connections,
      settings: full.settings || { executionOrder: "v1" },
    });
    const ok = put.status >= 200 && put.status < 300;
    console.log(
      `${ok ? "✔" : "✗"} ${put.status}  ${wf.name}  (assigned ${changed}${skipped ? `, skipped ${skipped}` : ""})`,
    );
    if (!ok) console.log("  response:", JSON.stringify(put.body).slice(0, 400));
  }
}

main().catch((e) => { console.error("Fatal:", e.message); process.exit(1); });
