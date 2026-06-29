// Calibrate retrieval thresholds for the CONFIGURED embeddings provider.
//
//   node scripts/calibrate-embeddings.mjs
//
// Reads EMBEDDINGS_* from .env.local, embeds a few specific / generic / aggregate
// queries against sample transactions, and prints the cosine-similarity spread so
// you can tune EMBEDDINGS_MATCH_THRESHOLD / _FLOOR / _REL_MARGIN per provider
// (the Qwen3 numbers do NOT transfer to Voyage/Jina/OpenAI).

import fs from "node:fs";
import path from "node:path";

// ── load .env.local ──
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const PROVIDER = (process.env.EMBEDDINGS_PROVIDER || "ollama").toLowerCase();
const BASE_URL = (process.env.EMBEDDINGS_BASE_URL || "http://localhost:11434").replace(/\/$/, "");
const MODEL = process.env.EMBEDDINGS_MODEL || (PROVIDER === "ollama" ? "qwen3-embedding:0.6b" : "");
const API_KEY = process.env.EMBEDDINGS_API_KEY || "";
const DIM = Number(process.env.EMBEDDINGS_DIM || 1024);
// Throttle cloud calls so free-tier rate limits (e.g. Voyage no-card = 3 RPM)
// don't trip. Override with EMBEDDINGS_CALIB_DELAY_MS=0 once limits are raised.
const DELAY_MS = Number(
  process.env.EMBEDDINGS_CALIB_DELAY_MS ?? (PROVIDER === "ollama" ? 0 : 21000),
);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function embed(text, isQuery) {
  if (PROVIDER === "ollama") {
    const input = isQuery
      ? `Instruct: Diberikan pertanyaan, ambil transaksi keuangan yang relevan.\nQuery: ${text}`
      : text;
    const r = await fetch(`${BASE_URL}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, input }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(JSON.stringify(j));
    return j.embeddings?.[0] ?? j.embedding;
  }
  const body = { model: MODEL, input: [text] };
  if (PROVIDER === "voyage") {
    body.input_type = isQuery ? "query" : "document";
    body.output_dimension = DIM;
  } else if (PROVIDER === "jina") {
    body.task = isQuery ? "retrieval.query" : "retrieval.passage";
    body.dimensions = DIM;
  } else {
    body.dimensions = DIM;
  }
  for (let attempt = 0; ; attempt++) {
    const r = await fetch(`${BASE_URL}/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify(body),
    });
    if (r.ok) return (await r.json()).data?.[0]?.embedding;
    if (r.status === 429 && attempt < 5) {
      process.stdout.write("  (rate-limited, waiting 25s…)\n");
      await sleep(25000);
      continue;
    }
    throw new Error(JSON.stringify(await r.json().catch(() => ({}))));
  }
}

const cos = (a, b) => {
  let d = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return d / (Math.sqrt(na) * Math.sqrt(nb));
};

const docs = {
  "iBox iPhone":    "Pengeluaran · iBox · Iphone 14 · Shopping · 2026-06-27 · IDR 11000000",
  "Indomaret":      "Pengeluaran · Indomaret · belanja bulanan · Groceries · 2026-06-20 · IDR 150000",
  "Grab transport": "Pengeluaran · Grab · perjalanan kantor · Transportation · 2026-06-18 · IDR 35000",
  "Starbucks":      "Pengeluaran · Starbucks · Kopi Latte · Dining · 2026-06-10 · IDR 45000",
  "PLN listrik":    "Pengeluaran · PLN · token listrik · Utilities · 2026-06-05 · IDR 200000",
  "Gaji":           "Pemasukan · Perusahaan · gaji bulanan · Salary · 2026-06-01 · IDR 5000000",
};
const queries = [
  "SPESIFIK | berapa pengeluaran di iBox",
  "SPESIFIK | pengeluaran transportasi",
  "GENERIK  | ringkas keuangan saya",
  "GENERIK  | tips hemat untuk saya",
  "AGREGAT  | total pengeluaran bulan ini",
];

(async () => {
  console.log(`\nProvider=${PROVIDER}  model=${MODEL}  dim=${DIM}\n${"─".repeat(50)}`);
  const docEmb = {};
  for (const [k, v] of Object.entries(docs)) {
    await sleep(DELAY_MS);
    docEmb[k] = await embed(v, false);
  }

  const specificTops = [];
  const genericTops = [];
  for (const q of queries) {
    const text = q.split("|")[1].trim();
    await sleep(DELAY_MS);
    const qe = await embed(text, true);
    const sims = Object.keys(docs)
      .map((k) => [k, cos(qe, docEmb[k])])
      .sort((a, b) => b[1] - a[1]);
    console.log(`\n${q}`);
    for (const [k, s] of sims) console.log(`   ${k.padEnd(16)} ${s.toFixed(3)}`);
    const gap = sims[0][1] - sims[1][1];
    console.log(`   → top=${sims[0][1].toFixed(3)}  gap=${gap.toFixed(3)}`);
    (q.startsWith("SPESIFIK") ? specificTops : genericTops).push(sims[0][1]);
  }

  const minSpecific = Math.min(...specificTops);
  const maxGeneric = Math.max(...genericTops);
  const suggested = ((minSpecific + maxGeneric) / 2).toFixed(2);
  console.log(`\n${"─".repeat(50)}`);
  console.log(`Specific-query tops: ${specificTops.map((n) => n.toFixed(2)).join(", ")}`);
  console.log(`Generic/aggregate tops: ${genericTops.map((n) => n.toFixed(2)).join(", ")}`);
  console.log(`\n→ Suggested EMBEDDINGS_MATCH_THRESHOLD ≈ ${suggested}`);
  console.log(`  EMBEDDINGS_MATCH_FLOOR ≈ ${(Number(suggested) - 0.05).toFixed(2)}  (a bit below)`);
  console.log(`  EMBEDDINGS_REL_MARGIN ≈ 0.10  (tune to the smallest SPESIFIK gap)\n`);
})().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
