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
        title="Import Transactions"
        subtitle="Bulk import from CSV or bank statement export"
      />
      <div className="flex-1 p-8 overflow-y-auto max-w-container mx-auto w-full">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardHeader
              title="Import from CSV"
              subtitle="Upload a CSV file and map columns to transaction fields"
            />
            <CSVImporter defaultCurrency={currency} />
          </Card>

          <Card>
            <CardHeader title="Supported Formats" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { name: "BCA", hint: "Internet Banking → Mutasi Rekening → Export CSV" },
                { name: "Mandiri", hint: "Mandiri Online → Rekening → Unduh Mutasi" },
                { name: "GoPay", hint: "Gopay History → Export (CSV)" },
                { name: "OVO", hint: "OVO → Riwayat → Export" },
                { name: "Dana", hint: "Dana → Riwayat Transaksi → Unduh" },
                { name: "Custom CSV", hint: "Any CSV with headers: date, amount, type, merchant" },
              ].map((fmt) => (
                <div key={fmt.name} className="p-3 rounded-lg bg-surface-container border border-outline-variant/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="description" />
                    <span className="text-body-sm font-semibold text-on-surface">{fmt.name}</span>
                  </div>
                  <p className="text-label-caps text-outline">{fmt.hint}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
