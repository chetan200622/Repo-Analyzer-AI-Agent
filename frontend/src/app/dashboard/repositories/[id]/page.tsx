import { api } from '@/services/api';
import { ArrowLeft, ExternalLink, Calendar, Code2, FileText, Package, GitBranch, BookOpen, Shield, Layers } from 'lucide-react';
import Link from 'next/link';
import { RepoTabs } from '@/components/dashboard/RepoTabs';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { ArchitectureGraph } from '@/components/dashboard/ArchitectureGraph';
import { LanguageBar } from '@/components/dashboard/LanguageBar';
import { FileTreeExplorer } from '@/components/dashboard/FileTreeExplorer';

export const dynamic = 'force-dynamic';

export default async function RepositoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: repoId } = await params;

  const repo = await api.getRepository(repoId).catch(() => null);
  const files = await api.getRepositoryFiles(repoId).catch(() => []);

  if (!repo) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-heading font-bold text-zinc-800">Repository not found</h2>
          <p className="text-zinc-500 mt-2">The repository you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/dashboard" className="mt-6 inline-flex items-center px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const statusColor = repo.status === 'READY' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
    : repo.status === 'PROCESSING' ? 'bg-amber-100 text-amber-700 border-amber-200'
    : repo.status === 'FAILED' ? 'bg-red-100 text-red-700 border-red-200'
    : 'bg-gray-100 text-gray-600 border-gray-200';

  // Parse dependencies into categories
  const deps = repo.dependencies || {};
  const depEntries = Object.entries(deps);

  // Split summary into paragraphs for better display
  const summaryParagraphs = (repo.summary || '').split('\n').filter((p: string) => p.trim());

  /* ──────────────────── Overview Tab ──────────────────── */
  const overviewContent = (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Files Scanned', value: repo.total_files.toLocaleString(), icon: FileText, color: 'text-blue-600 bg-blue-50 border-blue-100' },
          { label: 'Lines of Code', value: repo.total_lines.toLocaleString(), icon: Code2, color: 'text-violet-600 bg-violet-50 border-violet-100' },
          { label: 'Languages', value: repo.language_stats ? Object.keys(repo.language_stats).length.toString() : '0', icon: Layers, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          { label: 'Dependencies', value: depEntries.length.toString(), icon: Package, color: 'text-amber-600 bg-amber-50 border-amber-100' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all duration-200 group">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${stat.color}`}>
                <stat.icon size={18} strokeWidth={1.8} />
              </div>
            </div>
            <p className="text-2xl font-bold text-zinc-900 tracking-tight">{stat.value}</p>
            <span className="text-xs text-zinc-500 mt-0.5 block">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Language Breakdown */}
      {repo.language_stats && Object.keys(repo.language_stats).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="text-sm font-semibold text-zinc-800 mb-4 flex items-center gap-2">
            <Code2 size={15} className="text-blue-500" />
            Language Distribution
          </h4>
          <LanguageBar languageStats={repo.language_stats} />
        </div>
      )}

      {/* AI Summary — Enhanced with structured display */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <BookOpen size={16} className="text-white" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-800">AI Analysis Summary</h4>
            <p className="text-[11px] text-zinc-400">Auto-generated from repository structure, README, and dependencies</p>
          </div>
        </div>
        <div className="p-6">
          {summaryParagraphs.length > 0 ? (
            <div className="space-y-4">
              {summaryParagraphs.map((para: string, idx: number) => (
                <p key={idx} className="text-sm text-zinc-600 leading-relaxed">
                  {para}
                </p>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <BookOpen size={20} className="text-gray-400" />
              </div>
              <p className="text-sm text-zinc-400">No AI summary generated yet.</p>
              <p className="text-xs text-zinc-400 mt-1">Summary will appear once analysis completes.</p>
            </div>
          )}
        </div>
      </div>

      {/* Dependencies — Enhanced with search and better layout */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Package size={16} className="text-white" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-800">Dependencies</h4>
              <p className="text-[11px] text-zinc-400">{depEntries.length} packages detected</p>
            </div>
          </div>
        </div>
        <div className="p-5">
          {depEntries.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {depEntries.map(([dep, version]) => (
                <div key={dep} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 transition-all group cursor-default">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 group-hover:bg-blue-500 transition-colors shrink-0"></div>
                  <span className="text-[13px] font-medium text-zinc-700 truncate flex-1">{dep}</span>
                  <span className="text-[10px] font-mono text-zinc-400 bg-white px-1.5 py-0.5 rounded border border-gray-200 shrink-0">
                    {String(version).replace(/[\^~>=<]/g, '').slice(0, 12)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package size={24} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-zinc-400">No dependencies detected.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  /* ──────────────────── Architecture Tab ──────────────────── */
  const architectureContent = (
    <div className="space-y-4">
      {repo.architecture_diagram ? (
        <div className="space-y-4">
          {/* Architecture Legend */}
          <div className="bg-white rounded-xl border border-gray-200 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitBranch size={15} className="text-blue-500" />
              <span className="text-sm font-semibold text-zinc-800">Architecture Map</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-zinc-400">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-blue-300 rounded-full"></span> Data Flow
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-white border border-gray-300"></span> Module
              </span>
            </div>
          </div>
          <ArchitectureGraph mermaidSyntax={repo.architecture_diagram} />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[400px] bg-white rounded-xl border border-gray-200">
          <GitBranch className="w-12 h-12 text-gray-300 mb-4" strokeWidth={1} />
          <p className="text-zinc-500 text-sm">No architecture diagram generated.</p>
          <p className="text-zinc-400 text-xs mt-1">Diagram will appear once analysis completes.</p>
        </div>
      )}
    </div>
  );

  /* ──────────────────── Files Tab — VS Code style ──────────────────── */
  const filesContent = (
    <FileTreeExplorer files={files || []} />
  );

  /* ──────────────────── Chat Tab ──────────────────── */
  const chatContent = (
    <ChatInterface repoId={repoId} repoName={repo.name} />
  );

  /* ──────────────────── Page Layout ──────────────────── */
  return (
    <div className="flex-1 space-y-6 p-4 md:px-8 md:py-6 max-w-[1200px] mx-auto w-full">
      {/* Breadcrumb + Header */}
      <div className="space-y-4">
        <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-zinc-400 hover:text-blue-600 transition-colors">
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Dashboard
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center flex-wrap gap-2.5 mb-2">
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-zinc-900 tracking-tight">
                {repo.name}
              </h1>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider border ${statusColor}`}>
                {repo.status === 'READY' ? '✓ Indexed' : repo.status}
              </span>
              {repo.primary_language && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  {repo.primary_language}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-zinc-500">
              <a href={repo.github_url} target="_blank" rel="noreferrer" className="flex items-center hover:text-blue-600 transition-colors">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.5} />
                View on GitHub
              </a>
              <span className="flex items-center">
                <Calendar className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.5} />
                Analyzed {new Date(repo.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="flex items-center">
                <Shield className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.5} />
                {repo.total_files.toLocaleString()} files · {repo.total_lines.toLocaleString()} lines
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <RepoTabs
        overviewContent={overviewContent}
        architectureContent={architectureContent}
        filesContent={filesContent}
        chatContent={chatContent}
      />
    </div>
  );
}
