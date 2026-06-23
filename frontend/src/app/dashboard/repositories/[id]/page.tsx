import { api } from '@/services/api';
import { FileCode, ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { AnimatedContainer, AnimatedItem } from '../../AnimatedComponents';

export const dynamic = 'force-dynamic';

export default async function RepositoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: repoId } = await params;

  const repo = await api.getRepository(repoId).catch(() => null);
  const files = await api.getRepositoryFiles(repoId).catch(() => []);

  if (!repo) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <h2 className="text-3xl font-heading text-zinc-200">Document not found</h2>
          <p className="text-zinc-500 mt-2 font-light">The repository you are looking for does not exist on this canvas.</p>
          <Link href="/dashboard" className="mt-8 inline-flex items-center px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
            Return to Workspace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AnimatedContainer className="flex-1 space-y-16 p-4 md:p-12 pt-8 max-w-[1200px] mx-auto w-full">
      {/* Document Header */}
      <AnimatedItem className="space-y-6">
        <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Workspace
        </Link>
        
        <div>
          <h1 className="text-5xl md:text-6xl font-heading text-white tracking-tight leading-tight flex items-center flex-wrap gap-4 drop-shadow-2xl">
            {repo.name}
            {repo.status === 'READY' && (
              <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-sans font-semibold tracking-widest uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.1)]">
                Indexed
              </span>
            )}
          </h1>
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-4">
            <a href={repo.github_url} target="_blank" rel="noreferrer" className="flex items-center text-zinc-400 hover:text-white transition-colors text-lg font-light group">
              <ExternalLink className="mr-2 h-5 w-5 group-hover:text-white transition-colors" strokeWidth={1.5} />
              View Source
            </a>
            <span className="text-zinc-500 font-light text-lg">
              Added {new Date(repo.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </AnimatedItem>

      {/* Elegant Inline Metrics */}
      <AnimatedItem className="flex flex-wrap gap-12 py-8 border-y border-white/5">
        <div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-1">Primary Language</p>
          <p className="text-2xl font-sans text-white drop-shadow-md">{repo.primary_language || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-1">Files Scanned</p>
          <p className="text-2xl font-sans text-white drop-shadow-md">{repo.total_files.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-1">Lines of Code</p>
          <p className="text-2xl font-sans text-white drop-shadow-md">{repo.total_lines.toLocaleString()}</p>
        </div>
      </AnimatedItem>

      {/* Split View: Chat & File Explorer */}
      <AnimatedItem className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Left: Chat Interface */}
        <div className="space-y-6">
          <h3 className="text-2xl font-heading text-white">Chat with Codebase</h3>
          <ChatInterface repoId={repoId} />
        </div>

        {/* Right: The Blueprint Document (File Explorer) */}
        <div className="space-y-6">
          <h3 className="text-2xl font-heading text-white">Source Files</h3>

        <SpotlightCard className="p-2 bg-black/40 border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          {files && files.length > 0 ? (
            <div className="max-h-[800px] overflow-auto px-4 md:px-8 py-4 custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest sticky top-0 bg-black/60 backdrop-blur-xl z-10">
                  <tr>
                    <th className="px-4 py-6 border-b border-white/5 font-medium">Path</th>
                    <th className="px-4 py-6 border-b border-white/5 font-medium w-32">Language</th>
                    <th className="px-4 py-6 border-b border-white/5 font-medium text-right w-24">Lines</th>
                    <th className="px-4 py-6 border-b border-white/5 font-medium text-right w-32">Size (KB)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {files.map((file: any) => (
                    <tr 
                      key={file.id} 
                      className="hover:bg-white/5 transition-colors group"
                    >
                      <td className="px-4 py-4 text-sm font-mono text-zinc-400 group-hover:text-zinc-200 transition-colors truncate max-w-xs md:max-w-md">
                        {file.path}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium bg-white/5 text-zinc-300 border border-white/10 shadow-sm">
                          {file.language}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-right font-mono text-zinc-500">
                        {file.line_count.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-sm text-right font-mono text-zinc-600">
                        {(file.size_bytes / 1024).toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-20 text-center">
              <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6 border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                <FileCode className="h-8 w-8 text-zinc-600" strokeWidth={1} />
              </div>
              <h4 className="text-lg font-heading text-zinc-200">No files indexed</h4>
              <p className="text-sm text-zinc-500 mt-2 font-light">Files will appear here once analysis completes.</p>
            </div>
            )}
          </SpotlightCard>
        </div>
      </AnimatedItem>
    </AnimatedContainer>
  );
}
