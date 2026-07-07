import { api } from '@/services/api';
import { FileCode, ArrowLeft, ExternalLink, Calendar, Code2, FileText, Package, GitBranch } from 'lucide-react';
import Link from 'next/link';
import { RepoTabs } from '@/components/dashboard/RepoTabs';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { ArchitectureGraph } from '@/components/dashboard/ArchitectureGraph';
import { LanguageBar } from '@/components/dashboard/LanguageBar';

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
          <p className="text-zinc-500 mt-2">The repository you're looking for doesn't exist.</p>
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

  /* ──────────────────── Overview Tab ──────────────────── */
  const overviewContent = (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Files Scanned', value: repo.total_files.toLocaleString(), icon: FileText, color: 'text-blue-600 bg-blue-50' },
          { label: 'Lines of Code', value: repo.total_lines.toLocaleString(), icon: Code2, color: 'text-violet-600 bg-violet-50' },
          { label: 'Languages', value: repo.language_stats ? Object.keys(repo.language_stats).length.toString() : '0', icon: GitBranch, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Dependencies', value: repo.dependencies ? Object.keys(repo.dependencies).length.toString() : '0', icon: Package, color: 'text-amber-600 bg-amber-50' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon size={18} strokeWidth={1.8} />
              </div>
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Language Breakdown */}
      {repo.language_stats && Object.keys(repo.language_stats).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="text-sm font-semibold text-zinc-800 mb-4">Language Distribution</h4>
          <LanguageBar languageStats={repo.language_stats} />
        </div>
      )}

      {/* AI Summary + Dependencies */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Summary */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-100 px-6 py-4 flex items-center gap-2">
            <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
            <h4 className="text-sm font-semibold text-zinc-800">AI Summary</h4>
          </div>
          <div className="p-6">
            {repo.summary ? (
              <div className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap">{repo.summary}</div>
            ) : (
              <p className="text-sm text-zinc-400 italic">No AI summary generated.</p>
            )}
          </div>
        </div>

        {/* Dependencies */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-100 px-6 py-4 flex items-center gap-2">
            <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
            <h4 className="text-sm font-semibold text-zinc-800">Key Dependencies</h4>
          </div>
          <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
            {repo.dependencies && Object.keys(repo.dependencies).length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {Object.entries(repo.dependencies).map(([dep, version]) => (
                  <div key={dep} className="px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-between gap-3 transition-colors group">
                    <span className="text-sm font-medium text-zinc-700 truncate">{dep}</span>
                    <span className="text-[11px] font-mono text-zinc-400 whitespace-nowrap bg-white px-2 py-0.5 rounded border border-gray-200">{String(version)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-400 italic p-2">No dependencies detected.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  /* ──────────────────── Architecture Tab ──────────────────── */
  const architectureContent = (
    <div className="space-y-4">
      {repo.architecture_diagram ? (
        <ArchitectureGraph mermaidSyntax={repo.architecture_diagram} />
      ) : (
        <div className="flex flex-col items-center justify-center h-[400px] bg-white rounded-xl border border-gray-200">
          <GitBranch className="w-12 h-12 text-gray-300 mb-4" strokeWidth={1} />
          <p className="text-zinc-500 text-sm">No architecture diagram generated.</p>
        </div>
      )}
    </div>
  );

  /* ──────────────────── Files Tab ──────────────────── */
  const filesContent = (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {files && files.length > 0 ? (
        <div className="max-h-[700px] overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider sticky top-0 bg-gray-50 z-10">
              <tr>
                <th className="px-6 py-3.5 border-b border-gray-200 font-medium">Path</th>
                <th className="px-4 py-3.5 border-b border-gray-200 font-medium w-32">Language</th>
                <th className="px-4 py-3.5 border-b border-gray-200 font-medium text-right w-24">Lines</th>
                <th className="px-6 py-3.5 border-b border-gray-200 font-medium text-right w-28">Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {files.map((file: any) => (
                <tr key={file.id} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="px-6 py-3 text-sm font-mono text-zinc-600 group-hover:text-zinc-900 transition-colors truncate max-w-xs md:max-w-lg">
                    {file.path}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium bg-gray-100 text-zinc-600 border border-gray-200">
                      {file.language}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-mono text-zinc-500">
                    {file.line_count.toLocaleString()}
                  </td>
                  <td className="px-6 py-3 text-sm text-right font-mono text-zinc-400">
                    {(file.size_bytes / 1024).toFixed(1)} KB
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-20 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 border border-gray-200">
            <FileCode className="h-7 w-7 text-gray-400" strokeWidth={1.5} />
          </div>
          <h4 className="text-base font-semibold text-zinc-700">No files indexed</h4>
          <p className="text-sm text-zinc-400 mt-1">Files will appear here once analysis completes.</p>
        </div>
      )}
    </div>
  );

  /* ──────────────────── Chat Tab ──────────────────── */
  const chatContent = (
    <ChatInterface repoId={repoId} />
  );

  /* ──────────────────── Page Layout ──────────────────── */
  return (
    <div className="flex-1 space-y-8 p-4 md:px-8 md:py-6 max-w-[1200px] mx-auto w-full">
      {/* Breadcrumb + Header */}
      <div className="space-y-5">
        <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-zinc-400 hover:text-blue-600 transition-colors">
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Dashboard
        </Link>
        
        <div>
          <div className="flex items-center flex-wrap gap-3 mb-3">
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-zinc-900 tracking-tight">
              {repo.name}
            </h1>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider border ${statusColor}`}>
              {repo.status === 'READY' ? 'Indexed' : repo.status}
            </span>
            {repo.primary_language && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {repo.primary_language}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-500">
            <a href={repo.github_url} target="_blank" rel="noreferrer" className="flex items-center hover:text-blue-600 transition-colors">
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.5} />
              View on GitHub
            </a>
            <span className="flex items-center">
              <Calendar className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.5} />
              Analyzed {new Date(repo.created_at).toLocaleDateString()}
            </span>
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
