import Link from "next/link";
import { TopBar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { ReceiptUploadFlow } from "@/components/transactions/receipt-upload-flow";

export const dynamic = "force-dynamic";

export default function UploadReceiptPage() {
  return (
    <>
      <TopBar
        title="Upload Receipt"
        subtitle="Foto struk, kami baca dan catat otomatis"
      />
      <div className="flex-1 p-8 overflow-y-auto max-w-container mx-auto w-full">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <ReceiptUploadFlow />
          </Card>

          <Card>
            <h3 className="text-h3 font-h3 text-on-surface mb-4">Tips</h3>
            <ul className="space-y-3 text-body-sm text-on-surface">
              <Tip icon="crop_free">
                Pastikan struk tidak terpotong — seluruh detail harga & tanggal terlihat.
              </Tip>
              <Tip icon="brightness_6">
                Cahaya cukup, tidak blur. Kamera HP sudah biasanya cukup.
              </Tip>
              <Tip icon="edit">
                Setelah OCR selesai, cek field yang terbaca di halaman detail dan edit jika perlu.
              </Tip>
              <Tip icon="savings">
                Confidence &lt; 80% akan ditandai{" "}
                <code className="text-label-caps uppercase bg-surface-container px-1 py-0.5 rounded">
                  pending
                </code>
                {" "}— artinya butuh review manual.
              </Tip>
            </ul>
          </Card>

          <div className="flex items-center justify-between pt-2">
            <Link
              href="/transactions"
              className="text-body-sm text-outline hover:text-on-surface inline-flex items-center gap-1"
            >
              <Icon name="arrow_back" />
              Back to transactions
            </Link>
            <Link
              href="/transactions/new"
              className="text-body-sm text-primary font-semibold inline-flex items-center gap-1"
            >
              <Icon name="edit" />
              Input manual instead
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

function Tip({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 items-start">
      <div className="w-8 h-8 rounded-full bg-surface-container text-primary grid place-items-center shrink-0">
        <Icon name={icon} filled />
      </div>
      <span className="flex-1 pt-1">{children}</span>
    </li>
  );
}
