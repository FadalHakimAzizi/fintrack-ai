import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/app-provider";

export const metadata: Metadata = {
  title: "FinTrack AI — Finance Tracker",
  description: "Personal finance tracker with automation-ready architecture.",
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
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
