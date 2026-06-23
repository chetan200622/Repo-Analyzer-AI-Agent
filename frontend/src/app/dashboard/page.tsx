import { api } from '@/services/api';
import { Server, Database, Layers, FolderGit2, ArrowRight, Activity } from 'lucide-react';
import Link from 'next/link';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { AnalyzeForm } from './AnalyzeForm';
import { StatusRing } from './StatusRing';
import { AnimatedContainer, AnimatedItem, AnimatedHeader } from './AnimatedComponents';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // Fetch data natively on the server before rendering
  const health = await api.checkHealth().catch(() => null);
  const reposData = await api.getRepositories().catch(() => ({ repositories: [] }));

  return (
    <div className="relative">
      <AnimatedContainer className="relative z-10 flex-1 space-y-16 p-4 md:p-12 pt-12 max-w-[1200px] mx-auto w-full">
        {/* Spatial Header */}
        <AnimatedItem className="space-y-6 text-center max-w-3xl mx-auto">
          <AnimatedHeader />
          <p className="text-xl text-zinc-400 font-light max-w-xl mx-auto">
            Analyze, understand, and interact with your GitHub repositories using spatial intelligence.
          </p>
        </AnimatedItem>

        {/* The Nexus (Analyze Input) */}
        <AnimatedItem className="max-w-3xl mx-auto w-full">
          <AnalyzeForm />
        </AnimatedItem>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Telemetry Bento Box */}
          <AnimatedItem className="md:col-span-4 h-full">
            <SpotlightCard className="h-full p-8 flex flex-col justify-between group">
              <h3 className="text-lg font-semibold text-white mb-8">System Telemetry</h3>
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white/5 rounded-2xl shadow-sm border border-white/10">
                      <Server className="h-5 w-5 text-zinc-400 group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">API Gateway</p>
                      <p className="text-xs text-zinc-500">{health ? 'Healthy' : 'Offline'}</p>
                    </div>
                  </div>
                  <StatusRing status={health?.status === 'healthy' ? 'healthy' : 'offline'} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white/5 rounded-2xl shadow-sm border border-white/10">
                      <Database className="h-5 w-5 text-zinc-400 group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">PostgreSQL</p>
                      <p className="text-xs text-zinc-500">{health ? 'Active' : 'Offline'}</p>
                    </div>
                  </div>
                  <StatusRing status={health?.database === 'healthy' ? 'healthy' : 'offline'} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white/5 rounded-2xl shadow-sm border border-white/10">
                      <Layers className="h-5 w-5 text-zinc-400 group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">Redis Cache</p>
                      <p className="text-xs text-zinc-500">{health ? 'Active' : 'Offline'}</p>
                    </div>
                  </div>
                  <StatusRing status={health?.redis === 'healthy' ? 'healthy' : 'offline'} />
                </div>
              </div>
            </SpotlightCard>
          </AnimatedItem>

          {/* Recent Documents Bento Box */}
          <AnimatedItem className="md:col-span-8 h-full">
            <SpotlightCard className="h-full">
              <div className="p-8 border-b border-white/5">
                <h3 className="text-lg font-semibold text-white">Recent Documents</h3>
              </div>
              <div className="p-4">
                {reposData?.repositories?.length > 0 ? (
                  <div className="space-y-2">
                    {reposData.repositories.slice(0, 5).map((repo: any) => (
                      <Link href={`/dashboard/repositories/${repo.id}`} key={repo.id} className="block group/item">
                        <SpotlightCard magnetic className="!bg-transparent border-transparent hover:!bg-white/5 hover:border-white/10 transition-all duration-300 !rounded-2xl !shadow-none">
                          <div className="flex items-center justify-between p-4">
                            <div className="flex items-center space-x-5">
                              <div className="p-3 bg-white/10 rounded-xl shadow-sm border border-white/5">
                                <FolderGit2 className="h-6 w-6 text-zinc-300" strokeWidth={1.5} />
                              </div>
                              <div>
                                <p className="text-lg font-medium text-zinc-200 group-hover/item:text-white transition-colors">{repo.name}</p>
                                <p className="text-sm text-zinc-500 font-light mt-0.5">{repo.primary_language || 'Unknown'} • {new Date(repo.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-4">
                              {repo.status === 'READY' && (
                                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.1)] border border-emerald-500/20">
                                  Indexed
                                </span>
                              )}
                              {repo.status === 'FAILED' && (
                                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.1)] border border-rose-500/20">
                                  Failed
                                </span>
                              )}
                              {(repo.status === 'PROCESSING' || repo.status === 'CLONING') && (
                                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold bg-white/10 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)] border border-white/20">
                                  <Activity className="w-3 h-3 mr-2 animate-pulse" />
                                  Processing
                                </span>
                              )}
                              <ArrowRight className="h-5 w-5 text-zinc-600 group-hover/item:text-white group-hover/item:translate-x-1 transition-all" strokeWidth={2} />
                            </div>
                          </div>
                        </SpotlightCard>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-16 text-center">
                    <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-white/10">
                      <FolderGit2 className="h-10 w-10 text-zinc-600" strokeWidth={1} />
                    </div>
                    <h3 className="text-xl font-heading text-zinc-200">Canvas Empty</h3>
                    <p className="text-zinc-500 mt-2 font-light">Paste a GitHub link above to begin spatial analysis.</p>
                  </div>
                )}
              </div>
            </SpotlightCard>
          </AnimatedItem>
        </div>
      </AnimatedContainer>
    </div>
  );
}
