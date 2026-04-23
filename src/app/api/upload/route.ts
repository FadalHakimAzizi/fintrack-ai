import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED = ["image/jpeg", "image/png", "application/pdf"];
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return new NextResponse("Missing file", { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return new NextResponse("Unsupported file type", { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return new NextResponse("File too large (max 5MB)", { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const buffer = new Uint8Array(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from("receipts")
    .upload(path, buffer, { contentType: file.type, upsert: false });
  if (error) return new NextResponse(error.message, { status: 500 });

  const { data: signed } = await supabase.storage
    .from("receipts")
    .createSignedUrl(path, 60 * 60 * 24);

  return NextResponse.json({ path, url: signed?.signedUrl || "" });
}
