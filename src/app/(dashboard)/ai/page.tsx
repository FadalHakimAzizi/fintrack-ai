import { TopBar } from "@/components/layout/topbar";
import { ChatPanel } from "@/components/ai/chat-panel";

export const dynamic = "force-dynamic";

export default function AiPage() {
  return (
    <>
      <TopBar
        title="Asisten AI"
        subtitle="Tanya apa saja — menganalisis seluruh riwayat transaksi Anda"
      />
      <div className="flex-1 min-h-0 overflow-hidden">
        <ChatPanel />
      </div>
    </>
  );
}
