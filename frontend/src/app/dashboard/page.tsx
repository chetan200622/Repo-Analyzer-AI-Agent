import { api } from '@/services/api';
import { Server, Database, Layers, FolderGit2, ArrowRight, Activity } from 'lucide-react';
import Link from 'next/link';
import { AnalyzeForm } from './AnalyzeForm';
import { StatusRing } from './StatusRing';
import { AnimatedContainer, AnimatedItem } from './AnimatedComponents';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const health = await api.checkHealth().catch(() => null);
  const reposData = await api.getRepositories().catch(() => ({ repositories: [] }));

  return (
    <div className="relative">
      <AnimatedContainer className="relative z-10 flex-1 space-y-10 p-4 md:px-12 md:py-8 max-w-[1200px] mx-auto w-full">
        {/* Header */}
        <AnimatedItem className="space-y-2">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-zinc-900 tracking-tight">
            Your Workspace
          </h2>
          <p className="text-base text-zinc-500">
            Analyze, understand, and interact with your GitHub repositories.
          </p>
        </AnimatedItem>

        {/* Analyze Input */}
        <AnimatedItem className="max-w-3xl w-full">
          <AnalyzeForm />
        </AnimatedItem>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* System Telemetry */}
          <AnimatedItem className="md:col-span-4 h-full">
            <div className="h-full p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-zinc-800 mb-6">System Status</h3>
              <div className="space-y-5">
                {[
                  { icon: Server, label: 'API Gateway', status: health?.status === 'healthy', sub: health ? 'Healthy' : 'Offline' },
                  { icon: Database, label: 'PostgreSQL', status: health?.database === 'healthy', sub: health ? 'Active' : 'Offline' },
                  { icon: Layers, label: 'Redis Cache', status: health?.redis === 'healthy', sub: health ? 'Active' : 'Offline' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                        <item.icon className="h-4 w-4 text-zinc-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-700">{item.label}</p>
                        <p className="text-xs text-zinc-400">{item.sub}</p>
                      </div>
                    </div>
                    <StatusRing status={item.status ? 'healthy' : 'offline'} />
                  </div>
                ))}
              </div>
            </div>
          </AnimatedItem>

          {/* Recent Repositories */}
          <AnimatedItem className="md:col-span-8 h-full">
            <div className="h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-zinc-800">Recent Repositories</h3>
              </div>
              <div className="p-2">
                {reposData?.repositories?.length > 0 ? (
                  <div className="space-y-1">
                    {reposData.repositories.slice(0, 5).map((repo: any) => (
                      <Link href={`/dashboard/repositories/${repo.id}`} key={repo.id} className="block group">
                        <div className="flex items-center justify-between p-3.5 rounded-xl hover:bg-gray-50 transition-colors">
                          <div className="flex items-center space-x-4">
                            <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100">
                              <FolderGit2 className="h-5 w-5 text-blue-500" strokeWidth={1.5} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-zinc-800 group-hover:text-blue-600 transition-colors">{repo.name}</p>
                              <p className="text-xs text-zinc-400 mt-0.5">{repo.primary_language || 'Unknown'} · {new Date(repo.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            {repo.status === 'READY' && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                                Indexed
                              </span>
                            )}
                            {repo.status === 'FAILED' && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-red-50 text-red-600 border border-red-200">
                                Failed
                              </span>
                            )}
                            {(repo.status === 'PROCESSING' || repo.status === 'CLONING' || repo.status === 'QUEUED') && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-600 border border-amber-200">
                                <Activity className="w-3 h-3 mr-1.5 animate-pulse" />
                                Processing
                              </span>
                            )}
                            <ArrowRight className="h-4 w-4 text-zinc-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" strokeWidth={2} />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-16 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 border border-gray-200">
                      <FolderGit2 className="h-7 w-7 text-gray-400" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-base font-semibold text-zinc-700">No repositories yet</h3>
                    <p className="text-sm text-zinc-400 mt-1">Paste a GitHub URL above to get started.</p>
                  </div>
                )}
              </div>
            </div>
          </AnimatedItem>
        </div>
      </AnimatedContainer>
    </div>
  );
}
