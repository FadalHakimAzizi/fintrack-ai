import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { embed, embeddingsEnabled } from "@/lib/embeddings";

// Reports whether RAG is genuinely usable: embeddings enabled AND the provider
// actually responds (a tiny probe). Used by the AI page to show a live badge.
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  if (!embeddingsEnabled()) return NextResponse.json({ enabled: false });

  const vec = await embed("ping");
  return NextResponse.json({ enabled: Array.isArray(vec) && vec.length > 0 });
}
