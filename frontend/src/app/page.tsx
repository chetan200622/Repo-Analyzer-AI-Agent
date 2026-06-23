import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 text-center">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex flex-col">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-8">
          Repo<span className="text-blue-500">Mind</span> Agent
        </h1>
        <p className="text-xl text-zinc-400 mb-12 max-w-2xl">
          An AI-powered multi-agent system that analyzes GitHub repositories, 
          understands code structure, and helps developers onboard faster.
        </p>
        
        <div className="flex gap-4">
          <Link href="/dashboard">
            <Button size="lg" className="font-semibold">
              Go to Dashboard
            </Button>
          </Link>
          <a href="https://github.com/fastapi/fastapi" target="_blank" rel="noreferrer">
            <Button size="lg" variant="outline">
              View on GitHub
            </Button>
          </a>
        </div>
      </div>
    </main>
  );
}
