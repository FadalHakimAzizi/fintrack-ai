import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/topbar";
import { Card, CardHeader } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { ProfileForm } from "@/components/settings/profile-form";
import { Integrations } from "@/components/settings/integrations";
import { AiIndex } from "@/components/settings/ai-index";
import { formatDate, cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: integrations }, { count: txCount }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user!.id).single(),
    supabase
      .from("user_integrations")
      .select("id, channel, identifier, label, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("transactions").select("*", { count: "exact", head: true }),
  ]);

  const email = user!.email || "";
  const fullName = (profile?.full_name || "").trim();
  const rawName = fullName || email.split("@")[0] || "Pengguna";
  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1).replace(/[._-]+/g, " ");
  const initials =
    (fullName || rawName)
      .split(/[\s._-]+/)
      .filter(Boolean)
      .map((w: string) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";
  const currency = profile?.currency || "IDR";

  return (
    <>
      <TopBar title="Pengaturan" subtitle="Kelola profil dan integrasi Anda" />

      <div className="flex-1 overflow-y-auto max-w-container mx-auto w-full p-6 md:p-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Profile hero + form */}
          <Card className="animate-fade-up">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-on-primary-fixed-variant font-h2 text-h3 font-bold text-on-primary shadow-sm ring-1 ring-inset ring-white/15">
                {initials}
              </div>
              <div className="min-w-0">
                <h2 className="truncate font-h2 text-h3 tracking-tight text-on-surface">
                  {displayName}
                </h2>
                <p className="truncate text-body-sm text-on-surface-variant">{email}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Chip icon="payments">{currency}</Chip>
                  <Chip icon="event">Bergabung {formatDate(profile?.created_at)}</Chip>
                </div>
              </div>
            </div>

            <div className="my-5 border-t border-outline-variant/30" />

            <ProfileForm
              defaultFullName={fullName}
              defaultCurrency={currency}
              email={email}
            />
          </Card>

          {/* Quick navigation */}
          <div className="grid animate-fade-up grid-cols-1 gap-4 sm:grid-cols-2">
            <NavTile
              href="/settings/appearance"
              icon="palette"
              tone="primary"
              title="Tampilan"
              desc="Tema, warna, bahasa"
            />
            <NavTile
              href="/settings/categories"
              icon="category"
              tone="secondary"
              title="Kelola Kategori"
              desc="Tambah, ubah, atau hapus kategori"
            />
          </div>

          <Card className="animate-fade-up">
            <CardHeader
              icon="hub"
              title="Integrasi"
              subtitle="Hubungkan channel eksternal agar workflow n8n bisa masuk ke akun Anda"
            />
            <Integrations items={(integrations || []) as any[]} />
          </Card>

          <Card className="animate-fade-up">
            <CardHeader
              icon="smart_toy"
              title="Indeks AI (RAG)"
              subtitle="Embedding pgvector agar Asisten AI bisa mencari di seluruh riwayat secara semantik"
            />
            <AiIndex />
          </Card>

          <Card className="animate-fade-up">
            <CardHeader icon="insights" title="Statistik Akun" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatTile icon="receipt_long" label="Transaksi" value={String(txCount ?? 0)} />
              <StatTile icon="event_available" label="Bergabung" value={formatDate(profile?.created_at)} />
              <StatTile icon="payments" label="Mata Uang" value={currency} />
            </div>
            <div className="mt-3 rounded-lg bg-surface-container-low/50 px-3 py-2">
              <div className="text-label-caps uppercase tracking-wider text-on-surface-variant">
                User ID
              </div>
              <div className="mt-0.5 break-all font-mono text-body-sm text-on-surface">
                {user!.id}
              </div>
            </div>
          </Card>

          {/* Danger zone */}
          <Card className="animate-fade-up border-error/30">
            <div className="mb-5 flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-error/12 text-error">
                <Icon name="warning" filled />
              </span>
              <div>
                <h3 className="font-h2 text-h3 tracking-tight text-on-surface">Zona Berbahaya</h3>
                <p className="mt-0.5 text-body-sm text-on-surface-variant">
                  Keluar dari browser ini. Data Anda aman.
                </p>
              </div>
            </div>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg border border-error/50 px-4 py-2 text-body-sm font-medium text-error transition-colors hover:bg-error-container"
              >
                <Icon name="logout" />
                Keluar
              </button>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}

function Chip({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-1 text-label-caps font-medium text-on-surface-variant">
      <Icon name={icon} className="text-[14px]" />
      {children}
    </span>
  );
}

function NavTile({
  href,
  icon,
  tone,
  title,
  desc,
}: {
  href: string;
  icon: string;
  tone: "primary" | "secondary";
  title: string;
  desc: string;
}) {
  const chip = tone === "secondary" ? "bg-secondary/15 text-secondary" : "bg-primary/12 text-primary";
  return (
    <Link
      href={href}
      className="card-interactive group flex items-center gap-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-card"
    >
      <span
        className={cn(
          "grid h-12 w-12 shrink-0 place-items-center rounded-xl transition-transform duration-200 group-hover:scale-105",
          chip,
        )}
      >
        <Icon name={icon} filled />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-body-md font-semibold text-on-surface">{title}</h3>
        <p className="truncate text-body-sm text-on-surface-variant">{desc}</p>
      </div>
      <Icon
        name="arrow_forward"
        className="shrink-0 text-on-surface-variant transition-transform duration-200 group-hover:translate-x-0.5"
      />
    </Link>
  );
}

function StatTile({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-outline-variant/40 bg-surface-container-low/50 p-3.5">
      <div className="flex items-center gap-1.5 text-body-sm text-on-surface-variant">
        <Icon name={icon} className="text-[18px]" />
        {label}
      </div>
      <div className="mt-1 truncate font-h2 text-body-lg tabular text-on-surface">{value}</div>
    </div>
  );
}
