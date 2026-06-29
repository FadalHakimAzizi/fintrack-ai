import Link from "next/link";
import { TopBar } from "@/components/layout/topbar";
import { Card, CardHeader } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { ReceiptUploadFlow } from "@/components/transactions/receipt-upload-flow";

export const dynamic = "force-dynamic";

const TIPS = [
  { icon: "crop_free", tone: "primary", text: "Pastikan struk tidak terpotong — seluruh harga & tanggal terlihat." },
  { icon: "brightness_6", tone: "tertiary", text: "Cahaya cukup dan tidak blur. Kamera HP biasanya sudah cukup." },
  { icon: "edit", tone: "secondary", text: "Setelah OCR, cek field yang terbaca di halaman detail dan edit bila perlu." },
  { icon: "rule", tone: "primary", text: "Confidence < 80% ditandai pending — artinya butuh review manual." },
] as const;

const TONE: Record<string, string> = {
  primary: "bg-primary/12 text-primary",
  secondary: "bg-secondary/15 text-secondary",
  tertiary: "bg-tertiary/15 text-tertiary",
};

export default function UploadReceiptPage() {
  return (
    <>
      <TopBar title="Unggah Struk" subtitle="Foto struk, kami baca dan catat otomatis" />
      <div className="flex-1 overflow-y-auto max-w-container mx-auto w-full p-6 md:p-8">
        <div className="mx-auto max-w-2xl space-y-6">
          <Card className="animate-fade-up">
            <ReceiptUploadFlow />
          </Card>

          <Card className="animate-fade-up">
            <CardHeader icon="lightbulb" iconTone="tertiary" title="Tips" subtitle="Agar hasil baca AI maksimal" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {TIPS.map((tip) => (
                <div
                  key={tip.text}
                  className="flex items-start gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-low/50 p-3.5"
                >
                  <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", TONE[tip.tone])}>
                    <Icon name={tip.icon} filled />
                  </span>
                  <span className="text-body-sm text-on-surface">{tip.text}</span>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex animate-fade-up items-center justify-between gap-3 pt-1">
            <Link
              href="/transactions"
              className="inline-flex items-center gap-1.5 text-body-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface"
            >
              <Icon name="arrow_back" />
              Kembali ke transaksi
            </Link>
            <Link
              href="/transactions/new"
              className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-primary hover:underline"
            >
              <Icon name="edit" />
              Input manual
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
