import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") || 100), 500);

  let q = supabase
    .from("transactions")
    .select("*")
    .order("transaction_date", { ascending: false })
    .limit(limit);

  const type = searchParams.get("type");
  if (type === "income" || type === "expense") q = q.eq("transaction_type", type);
  const source = searchParams.get("source");
  if (source) q = q.eq("source_channel", source);
  const from = searchParams.get("from");
  if (from) q = q.gte("transaction_date", from);
  const to = searchParams.get("to");
  if (to) q = q.lte("transaction_date", to);

  const { data, error } = await q;
  if (error) return new NextResponse(error.message, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const body = await request.json();
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      ...body,
      user_id: user.id,
      source_channel: body.source_channel || "website",
    })
    .select()
    .single();
  if (error) return new NextResponse(error.message, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}
