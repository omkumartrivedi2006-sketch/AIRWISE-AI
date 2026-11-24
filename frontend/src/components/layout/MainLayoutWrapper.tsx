"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";

// Routes that use the dedicated Left Sidebar (AppLayout) and must NOT show the top horizontal Navbar or Footer
const APP_ROUTES = [
  "/dashboard",
  "/map",
  "/assistant",
  "/analytics",
  "/compare",
  "/indoor",
  "/community",
  "/notifications",
  "/profile",
  "/settings",
  "/admin",
];

interface MainLayoutWrapperProps {
  children: React.ReactNode;
}

export const MainLayoutWrapper: React.FC<MainLayoutWrapperProps> = ({ children }) => {
  const pathname = usePathname();

  // Check if current path belongs to authenticated/workspace application routes
  const isAppRoute = APP_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isAppRoute) {
    // Authenticated views: ONLY the left-side vertical sidebar handles navigation.
    // Zero top horizontal navbar, zero bottom footer.
    return <main className="flex-grow min-h-screen">{children}</main>;
  }

  // Public views (Home, About, Contact, Login, Register, Terms, Privacy)
  return (
    <>
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
    </>
  );
};
