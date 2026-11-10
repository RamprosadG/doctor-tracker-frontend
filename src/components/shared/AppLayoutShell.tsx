"use client";

import { useState } from "react";
import { Sidebar } from "@/components/shared/Sidebar";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";

export function AppLayoutShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen w-full bg-white">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* The rail is fixed on desktop, so the column beside it is offset rather
          than flexed — that keeps the viewport width free for wide tables. */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-72">
        <Navbar onOpenSidebar={() => setSidebarOpen(true)} />

        <main className="flex flex-1 flex-col pt-[var(--app-nav-height)]">
          <div className="w-full flex-1 p-6 md:p-8">{children}</div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
