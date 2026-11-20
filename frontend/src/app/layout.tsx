import type { Metadata } from "next";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIRWISE AI — GenAI-Powered Pollution Intelligence Platform",
  description:
    "Real-time air quality telemetry, hyper-local pollutant intelligence, and Google Gemini-powered environmental health advisory.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-slate-100 antialiased selection:bg-primary/30 selection:text-cyan-accent flex flex-col justify-between">
        {/* Ambient Radial Gradient Glows (CSS-only subtle background) */}
        <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/10 rounded-full blur-[140px]" />
          <div className="absolute top-1/3 -right-48 w-[600px] h-[400px] bg-cyan-accent/5 rounded-full blur-[120px]" />
        </div>

        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
