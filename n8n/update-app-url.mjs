#!/usr/bin/env node
/**
 * Update the FinTrack app webhook URL in all n8n workflow JSON files.
 *
 * Usage:
 *   node n8n/update-app-url.mjs https://your-app.vercel.app
 *
 * What it does:
 *   - Replaces the old app URL in all workflow JSONs
 *   - Removes the ngrok-specific header (no longer needed)
 *   - Saves the updated files in place
 *   - Then runs push-workflows.mjs to redeploy to n8n
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const newUrl = process.argv[2]?.replace(/\/$/, ""); // strip trailing slash

if (!newUrl || !newUrl.startsWith("http")) {
  console.error("Usage: node n8n/update-app-url.mjs https://your-app.vercel.app");
  process.exit(1);
}

const WEBHOOK_PATH = "/api/webhooks/n8n";
const NEW_WEBHOOK = `${newUrl}${WEBHOOK_PATH}`;

const FILES = [
  "01-telegram-bot.json",
  "02-gmail-parser.json",
  "03-receipt-ocr.json",
];

console.log(`\n🔄  Updating all workflows to use:\n    ${NEW_WEBHOOK}\n`);

let changed = 0;

for (const file of FILES) {
  const fullPath = path.join(__dirname, file);
  const raw = await fs.readFile(fullPath, "utf8");
  const wf = JSON.parse(raw);

  let updated = false;

  for (const node of wf.nodes || []) {
    if (node.type !== "n8n-nodes-base.httpRequest") continue;
    const params = node.parameters || {};

    // Update URL if it ends with /api/webhooks/n8n
    if (typeof params.url === "string" && params.url.endsWith(WEBHOOK_PATH)) {
      const oldUrl = params.url;
      params.url = NEW_WEBHOOK;
      console.log(`  ✎  ${file} → "${node.name}"`);
      console.log(`     old: ${oldUrl}`);
      console.log(`     new: ${NEW_WEBHOOK}`);
      updated = true;
    }

    // Remove ngrok-skip-browser-warning header (not needed for Vercel)
    if (Array.isArray(params.headers?.parameters)) {
      const before = params.headers.parameters.length;
      params.headers.parameters = params.headers.parameters.filter(
        (h) => h.name !== "ngrok-skip-browser-warning",
      );
      if (params.headers.parameters.length < before) {
        console.log(`     → removed ngrok header`);
      }
    }
  }

  if (updated) {
    await fs.writeFile(fullPath, JSON.stringify(wf, null, 2), "utf8");
    changed++;
    console.log(`  ✔  Saved ${file}\n`);
  } else {
    console.log(`  –  ${file}: no webhook URL found to update\n`);
  }
}

console.log(`Updated ${changed}/${FILES.length} workflow files.`);

if (!process.env.N8N_API_KEY) {
  console.log(`
⚠️  N8N_API_KEY not set — skipping auto-push to n8n.
    To push manually, run:
      N8N_API_KEY=<your_key> node n8n/push-workflows.mjs
`);
} else {
  console.log("\n🚀  Pushing updated workflows to n8n...\n");
  execSync("node n8n/push-workflows.mjs", {
    stdio: "inherit",
    env: process.env,
    cwd: path.join(__dirname, ".."),
  });
}

console.log("\n✅  Done! Go to n8n and re-activate each workflow.");
