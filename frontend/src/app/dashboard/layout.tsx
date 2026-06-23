import Link from "next/link";
import { Layers } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col spatial-canvas relative bg-black text-zinc-100">
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/30 backdrop-blur-3xl supports-[backdrop-filter]:bg-black/10">
        <div className="container flex h-16 items-center px-4 md:px-8 max-w-[1400px] mx-auto">
          <div className="mr-4 hidden md:flex">
            <Link href="/" className="mr-6 flex items-center space-x-2 group">
              <Layers className="h-6 w-6 text-zinc-300 group-hover:text-indigo-400 transition-colors" strokeWidth={1.5} />
              <span className="hidden font-heading text-lg font-bold sm:inline-block tracking-tight text-zinc-100 group-hover:text-white transition-colors">
                RepoMind Agent
              </span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link
                href="/dashboard"
                className="transition-colors hover:text-white text-zinc-400"
              >
                Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1 container py-6 mx-auto relative z-10">
        {children}
      </main>
    </div>
  );
}
