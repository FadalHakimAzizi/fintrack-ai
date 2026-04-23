import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  if (error) return new NextResponse(error.message, { status: 500 });
  if (!data) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const patch = await request.json();
  delete patch.user_id;
  delete patch.id;

  const { data, error } = await supabase
    .from("transactions")
    .update(patch)
    .eq("id", params.id)
    .select()
    .single();
  if (error) return new NextResponse(error.message, { status: 400 });
  return NextResponse.json({ data });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { error } = await supabase.from("transactions").delete().eq("id", params.id);
  if (error) return new NextResponse(error.message, { status: 400 });
  return new NextResponse(null, { status: 204 });
}
