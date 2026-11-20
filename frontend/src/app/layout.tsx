import type { Metadata } from "next";
import { Navbar } from "@/components/ui/Navbar";
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
      <body className="min-h-screen bg-[#080A0D] text-[#F5F7FA] antialiased selection:bg-[#28C7F5]/25 selection:text-[#28C7F5] flex flex-col justify-between">
        {/* Ambient Subtle Radial Glow Highlights (CSS only) */}
        <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-[#28C7F5]/[0.06] rounded-full blur-[140px]" />
          <div className="absolute top-1/3 -right-48 w-[650px] h-[450px] bg-[#38E0B4]/[0.04] rounded-full blur-[120px]" />
        </div>

        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
