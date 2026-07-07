import Link from "next/link";
import { Layers } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-zinc-900">
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-xl">
        <div className="container flex h-14 items-center px-4 md:px-8 max-w-[1400px] mx-auto">
          <div className="mr-4 flex">
            <Link href="/" className="mr-8 flex items-center space-x-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Layers className="h-4 w-4 text-white" strokeWidth={2} />
              </div>
              <span className="hidden font-heading text-[15px] font-bold sm:inline-block tracking-tight text-zinc-900">
                RepoMind Agent
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
        </div>
      </header>
      <main className="flex-1 container py-8 mx-auto relative z-10">
        {children}
      </main>
    </div>
  );
}
