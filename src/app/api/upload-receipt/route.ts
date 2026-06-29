import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_BYTES = 4 * 1024 * 1024;
const OCR_TIMEOUT_MS = 90_000;

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const ocrUrl = process.env.N8N_OCR_WEBHOOK_URL;
  if (!ocrUrl) {
    return NextResponse.json(
      { error: "N8N_OCR_WEBHOOK_URL not configured on the server." },
      { status: 500 },
    );
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json(
      { error: `Unsupported file type: ${file.type}` },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 4MB)" }, { status: 400 });
  }

  // 1. Upload to Supabase Storage
  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const buffer = new Uint8Array(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage
    .from("receipts")
    .upload(path, buffer, { contentType: file.type, upsert: false });
  if (upErr) {
    return NextResponse.json({ error: `Upload failed: ${upErr.message}` }, { status: 500 });
  }

  // 2. Generate short-lived signed URL so n8n can download
  const { data: signed, error: signErr } = await supabase.storage
    .from("receipts")
    .createSignedUrl(path, 60 * 10); // 10 minutes
  if (signErr || !signed?.signedUrl) {
    return NextResponse.json(
      { error: `Could not create signed URL: ${signErr?.message || "unknown"}` },
      { status: 500 },
    );
  }

  // 3. POST to n8n OCR webhook and wait for transaction
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), OCR_TIMEOUT_MS);

  let ocrRes: Response;
  try {
    ocrRes = await fetch(ocrUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({
        user_id: user.id,
        image_url: signed.signedUrl,
        attachment_path: path,
        source_reference: `web:${path}`,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(t);
    const aborted = err instanceof Error && err.name === "AbortError";
    return NextResponse.json(
      {
        error: aborted
          ? "OCR workflow timed out. File is uploaded — check /transactions in a minute or two."
          : `Could not reach OCR workflow: ${err instanceof Error ? err.message : String(err)}`,
        attachment_path: path,
      },
      { status: aborted ? 504 : 502 },
    );
  }
  clearTimeout(t);

  const ocrText = await ocrRes.text();
  let ocrBody: any;
  try {
    ocrBody = JSON.parse(ocrText);
  } catch {
    ocrBody = { raw: ocrText };
  }

  if (!ocrRes.ok) {
    return NextResponse.json(
      {
        error: ocrBody?.error || `OCR workflow failed (${ocrRes.status})`,
        detail: ocrBody,
        attachment_path: path,
      },
      { status: 502 },
    );
  }

  // 4. OCR workflow returned success — find the created transaction so we can redirect
  // The OCR workflow POSTs to /api/webhooks/n8n which returns { id }. That value propagates
  // back as `transaction_id` in the OCR response.
  const transactionId = ocrBody?.transaction_id || ocrBody?.id || null;

  return NextResponse.json({
    ok: true,
    transaction_id: transactionId,
    attachment_path: path,
    parsed: ocrBody?.parsed || null,
  });
}
