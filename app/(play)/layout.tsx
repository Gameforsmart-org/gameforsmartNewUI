import { SiteHeader } from "@/components/layout2";
import React from "react";

export default function PlayLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Use dark background by default to prevent white flash during redirect/countdown
  return (
    <div className="flex min-h-screen flex-col">
    <SiteHeader />
    <main className="flex-1 base-background flex flex-col">
      {children}
      </main>
    </div>
  );
}
