import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RepoMind Agent",
  description: "AI-powered repository analysis and understanding",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased dark bg-black`}
      style={{ colorScheme: 'dark' }}
    >
      <body className="min-h-full flex flex-col bg-black text-zinc-100 selection:bg-indigo-500/30 selection:text-indigo-200">
        <QueryProvider>
          {children}
          <Toaster theme="dark" />
        </QueryProvider>
      </body>
    </html>
  );
}
