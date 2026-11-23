import type { Metadata } from "next";
import { MainLayoutWrapper } from "@/components/layout/MainLayoutWrapper";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIRWISE AI — GenAI-Powered Pollution Intelligence Platform",
  description:
    "Real-time air quality telemetry, hyper-local pollutant intelligence, and Google Gemini-powered environmental health advisory.",
};

const antiExtensionAndThemeScript = `
  (function() {
    // 1. Instant Theme Sync
    try {
      var savedTheme = localStorage.getItem('airwise_theme');
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      document.documentElement.classList.add('light');
    }

    // 2. Browser Extension Error Isolation (MetaMask, inpage.js, chrome-extension)
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', function(event) {
        var reason = event.reason;
        var msg = reason ? (reason.message || reason.stack || String(reason)) : '';
        if (
          msg.indexOf('MetaMask') !== -1 ||
          msg.indexOf('chrome-extension://') !== -1 ||
          msg.indexOf('inpage.js') !== -1
        ) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      }, true);

      window.addEventListener('error', function(event) {
        var msg = event.message || '';
        var filename = event.filename || '';
        if (
          msg.indexOf('MetaMask') !== -1 ||
          filename.indexOf('chrome-extension://') !== -1 ||
          filename.indexOf('inpage.js') !== -1
        ) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      }, true);
    }
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="light">
      <head>
        <script dangerouslySetInnerHTML={{ __html: antiExtensionAndThemeScript }} />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary flex flex-col justify-between font-sans">
        <ThemeProvider>
          <AuthProvider>
            <MainLayoutWrapper>{children}</MainLayoutWrapper>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
