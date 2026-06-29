import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/app-provider";
import { ToastProvider } from "@/components/ui/toast";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";

export const metadata: Metadata = {
  title: { default: "FinTrack AI", template: "%s · FinTrack AI" },
  description: "Pelacak keuangan pribadi dengan AI — catat, analisis, dan rencanakan keuanganmu.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Anti-flash: restore theme, mode, locale dir before first paint */}
        <script dangerouslySetInnerHTML={{ __html: `
          try{
            var l=localStorage.getItem('locale')||'id';
            var t=localStorage.getItem('theme')||'ocean';
            var m=localStorage.getItem('mode')||'light';
            var h=document.documentElement;
            if(m==='dark')h.classList.add('dark');
            if(t&&t!=='ocean')h.setAttribute('data-theme',t);
            h.setAttribute('dir',l==='ar'?'rtl':'ltr');
            h.setAttribute('lang',l);
            h.style.setProperty('--sidebar-w', localStorage.getItem('sidebarCollapsed')==='true'?'5rem':'16rem');
          }catch(e){}
        `}} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background text-on-background">
        <AppProvider>
          <ConfirmProvider>
            <ToastProvider>{children}</ToastProvider>
          </ConfirmProvider>
        </AppProvider>
      </body>
    </html>
  );
}
