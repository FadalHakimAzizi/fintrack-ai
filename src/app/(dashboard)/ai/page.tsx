import { TopBar } from "@/components/layout/topbar";
import { ChatPanel } from "@/components/ai/chat-panel";

export const dynamic = "force-dynamic";

export default function AiPage() {
  return (
    <>
      <TopBar
        title="AI Advisor"
        subtitle="Ask anything about your transactions in the last 90 days"
      />
      <div className="flex-1 overflow-hidden">
        <ChatPanel />
      </div>
    </>
  );
}
