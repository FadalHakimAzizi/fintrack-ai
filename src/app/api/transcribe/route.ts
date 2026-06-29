import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { groqTranscribe } from "@/lib/groq";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ error: "Audio tidak ditemukan" }, { status: 400 });
  }
  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: "Rekaman terlalu besar (maks 25MB)." }, { status: 400 });
  }

  // Map "id-ID" -> "id" (Whisper wants ISO-639-1). Omit for auto-detect.
  const rawLang = (form.get("language") as string) || "";
  const language = rawLang ? rawLang.split("-")[0] : undefined;

  const result = await groqTranscribe(file, "audio.webm", { language });
  if (!result.ok) {
    const msg =
      result.status === 429
        ? "Batas permintaan AI tercapai. Coba lagi sebentar."
        : "Gagal mentranskripsi suara. Coba lagi.";
    return NextResponse.json({ error: msg, detail: result.error }, { status: 502 });
  }

  return NextResponse.json({ text: result.text.trim() });
}
