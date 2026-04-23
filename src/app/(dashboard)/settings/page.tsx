import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/topbar";
import { Card, CardHeader } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { ProfileForm } from "@/components/settings/profile-form";
import { Integrations } from "@/components/settings/integrations";
import { formatDate } from "@/lib/utils";

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

  return (
    <>
      <TopBar title="Settings" subtitle="Manage your profile and integrations" />

      <div className="flex-1 p-8 overflow-y-auto max-w-container mx-auto w-full">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardHeader title="Profile" subtitle="Your personal information" />
            <ProfileForm
              defaultFullName={profile?.full_name || ""}
              defaultCurrency={profile?.currency || "IDR"}
              email={user!.email || ""}
            />
          </Card>

          <Link href="/settings/appearance">
            <Card className="hover:shadow-elevated transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary-container/10 text-primary grid place-items-center">
                  <Icon name="palette" filled />
                </div>
                <div className="flex-1">
                  <h3 className="text-body-md font-semibold text-on-surface">Appearance</h3>
                  <p className="text-body-sm text-outline">Theme, colors, language</p>
                </div>
                <Icon name="chevron_right" />
              </div>
            </Card>
          </Link>

          <Link href="/settings/categories">
            <Card className="hover:shadow-elevated transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary-container/10 text-primary grid place-items-center">
                  <Icon name="category" filled />
                </div>
                <div className="flex-1">
                  <h3 className="text-body-md font-semibold text-on-surface">Manage Categories</h3>
                  <p className="text-body-sm text-outline">Add, edit, or remove transaction categories</p>
                </div>
                <Icon name="chevron_right" />
              </div>
            </Card>
          </Link>

          <Card>
            <CardHeader
              title="Integrations"
              subtitle="Link external channels so n8n workflows can route into your account"
            />
            <Integrations items={(integrations || []) as any[]} />
          </Card>

          <Card>
            <CardHeader title="Account Stats" />
            <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-body-sm">
              <div>
                <dt className="text-outline uppercase tracking-wider text-label-caps">
                  User ID
                </dt>
                <dd className="text-on-surface font-mono text-body-sm break-all mt-1">
                  {user!.id}
                </dd>
              </div>
              <div>
                <dt className="text-outline uppercase tracking-wider text-label-caps">
                  Member since
                </dt>
                <dd className="text-on-surface mt-1">
                  {formatDate(profile?.created_at)}
                </dd>
              </div>
              <div>
                <dt className="text-outline uppercase tracking-wider text-label-caps">
                  Transactions
                </dt>
                <dd className="text-on-surface mt-1">{txCount ?? 0}</dd>
              </div>
            </dl>
          </Card>

          <Card className="border-error/30">
            <CardHeader
              title="Danger Zone"
              subtitle="Sign out of this browser. Your data is safe."
            />
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-error/50 text-error hover:bg-error-container transition-colors text-body-sm"
              >
                <Icon name="logout" />
                Sign out
              </button>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
