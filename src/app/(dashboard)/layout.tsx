import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex bg-background text-on-background">
      <Sidebar userEmail={user.email ?? null} />
      <main className="md:ml-64 flex-1 flex flex-col min-h-screen">{children}</main>
    </div>
  );
}
