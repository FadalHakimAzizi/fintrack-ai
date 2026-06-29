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
    <div className="flex h-[100dvh] overflow-hidden bg-background text-on-background">
      <Sidebar userEmail={user.email ?? null} />
      <main className="md:ml-[var(--sidebar-w,16rem)] flex min-h-0 flex-1 flex-col overflow-hidden transition-[margin] duration-300 ease-in-out">
        {children}
      </main>
    </div>
  );
}
