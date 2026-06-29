import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/topbar";
import { Card, CardHeader } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { CSVImporter } from "@/components/transactions/csv-importer";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const supabase = createClient();
  const { data: profile } = await supabase.from("profiles").select("currency").single();
  const currency = profile?.currency || "IDR";

  return (
    <>
      <TopBar
        title="Impor Transaksi"
        subtitle="Impor massal dari CSV atau ekspor rekening koran"
      />
      <div className="flex-1 overflow-y-auto max-w-container mx-auto w-full p-6 md:p-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <Card className="animate-fade-up">
            <CardHeader
              icon="upload_file"
              title="Impor dari CSV"
              subtitle="Unggah file CSV dan petakan kolom ke field transaksi"
            />
            <CSVImporter defaultCurrency={currency} />
          </Card>

          <Card className="animate-fade-up">
            <CardHeader
              icon="account_balance"
              iconTone="secondary"
              title="Format yang Didukung"
              subtitle="Ekspor dari bank/e-wallet populer atau CSV kustom"
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { name: "BCA", icon: "account_balance", hint: "Internet Banking → Mutasi Rekening → Export CSV" },
                { name: "Mandiri", icon: "account_balance", hint: "Mandiri Online → Rekening → Unduh Mutasi" },
                { name: "GoPay", icon: "wallet", hint: "GoPay History → Export (CSV)" },
                { name: "OVO", icon: "wallet", hint: "OVO → Riwayat → Export" },
                { name: "Dana", icon: "wallet", hint: "Dana → Riwayat Transaksi → Unduh" },
                { name: "CSV Kustom", icon: "description", hint: "CSV apa pun dengan header: date, amount, type, merchant" },
              ].map((fmt) => (
                <div
                  key={fmt.name}
                  className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-3.5 transition-colors hover:bg-surface-container-low"
                >
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
                      <Icon name={fmt.icon} filled className="text-[18px]" />
                    </span>
                    <span className="font-semibold text-on-surface">{fmt.name}</span>
                  </div>
                  <p className="text-body-sm text-on-surface-variant">{fmt.hint}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
