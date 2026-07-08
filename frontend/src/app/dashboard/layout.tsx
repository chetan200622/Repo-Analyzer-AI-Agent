'use client';

// Dashboard layout with navbar and settings button
import Link from "next/link";
import { useState } from "react";
import { Layers, Settings } from "lucide-react";
import { APIKeyModal } from "@/components/settings/APIKeyModal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-zinc-900">
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-xl">
        <div className="container flex h-14 items-center justify-between px-4 md:px-8 max-w-[1400px] mx-auto">
          <div className="flex items-center">
            <Link href="/" className="mr-8 flex items-center space-x-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Layers className="h-4 w-4 text-white" strokeWidth={2} />
              </div>
              <span className="hidden font-heading text-[15px] font-bold sm:inline-block tracking-tight text-zinc-900">
                Repo Analyzer
              </span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link
                href="/dashboard"
                className="transition-colors hover:text-blue-600 text-zinc-600"
              >
                Dashboard
              </Link>
            </nav>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-500 hover:text-zinc-700 hover:bg-gray-100 transition-all"
            title="API Key Settings"
          >
            <Settings size={16} />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </header>
      <main className="flex-1 container py-8 mx-auto relative z-10">
        {children}
      </main>
      <APIKeyModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
