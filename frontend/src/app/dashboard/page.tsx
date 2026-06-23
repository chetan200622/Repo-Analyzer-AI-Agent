'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Server, Database, Layers, FolderGit2, ArrowRight, GitBranch, Activity } from 'lucide-react';
import { JobTracker } from '@/components/job-tracker';
import { toast } from 'sonner';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { SpotlightCard } from '@/components/ui/spotlight-card';

const container: any = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item: any = {
  hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: "spring", stiffness: 300, damping: 24 } }
};

// Animated SVG Ring for Telemetry (Dark Mode High Contrast)
const StatusRing = ({ status }: { status: 'healthy' | 'degraded' | 'offline' | 'unknown' }) => {
  const isHealthy = status === 'healthy';
  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
        <circle 
          cx="50" cy="50" r="46" 
          fill="none" 
          stroke={isHealthy ? 'rgba(52, 211, 153, 0.15)' : 'rgba(251, 113, 133, 0.15)'} 
          strokeWidth="4" 
        />
        <motion.circle 
          cx="50" cy="50" r="46" 
          fill="none" 
          stroke={isHealthy ? 'rgba(52, 211, 153, 0.8)' : 'rgba(251, 113, 133, 0.8)'} 
          strokeWidth="4"
          strokeDasharray="20 10"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
      </svg>
      <div className={`w-3 h-3 rounded-full shadow-lg ${isHealthy ? 'bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)]' : 'bg-rose-400 shadow-[0_0_15px_rgba(251,113,133,0.8)]'}`} />
    </div>
  );
};

export default function DashboardPage() {
  const [url, setUrl] = useState('');
  const [activeRepoId, setActiveRepoId] = useState<string | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const { data: health, isLoading } = useQuery({
    queryKey: ['health'],
    queryFn: api.checkHealth,
    refetchInterval: 30000,
  });

  const { data: reposData, isLoading: reposLoading, refetch: refetchRepos } = useQuery({
    queryKey: ['repositories'],
    queryFn: api.getRepositories,
  });

  const { mutate: analyzeRepo, isPending: isAnalyzing } = useMutation({
    mutationFn: api.analyzeRepository,
    onSuccess: (data) => {
      setActiveRepoId(data.id);
      toast.success('Repository analysis started');
      setUrl('');
      refetchRepos();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to analyze repository');
    }
  });

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    analyzeRepo(url);
  };

  return (
    <div className="relative">
      {/* Dynamic Background Dimming based on Focus */}
      <AnimatePresence>
        {isInputFocused && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-0 pointer-events-none transition-all duration-700" 
          />
        )}
      </AnimatePresence>

      <motion.div 
        className="relative z-10 flex-1 space-y-16 p-4 md:p-12 pt-12 max-w-[1200px] mx-auto w-full"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Spatial Header */}
        <motion.div variants={item} className="space-y-6 text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <h2 className="text-6xl md:text-7xl font-heading text-white tracking-tight leading-tight drop-shadow-2xl">
              Your Workspace
            </h2>
          </motion.div>
          <p className="text-xl text-zinc-400 font-light max-w-xl mx-auto">
            Analyze, understand, and interact with your GitHub repositories using spatial intelligence.
          </p>
        </motion.div>

        {/* The Nexus (Analyze Input) */}
        <motion.div variants={item} className="max-w-3xl mx-auto w-full">
          <SpotlightCard magnetic className="p-2 md:p-3 !rounded-[3rem] bg-black/40 border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.03)]">
            <form onSubmit={handleAnalyze} className="relative flex items-center w-full">
              <motion.div 
                className="absolute left-6 text-zinc-300 z-10"
                animate={{ scale: isInputFocused ? 1.1 : 1, rotate: isInputFocused ? 10 : 0 }}
              >
                <GitBranch className="h-6 w-6 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" strokeWidth={1.5} />
              </motion.div>
              <Input 
                placeholder="Paste a public GitHub repository URL..." 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                className="pl-16 pr-40 h-20 w-full rounded-[2.5rem] bg-white/5 border-none focus-visible:ring-1 focus-visible:ring-white/30 text-white text-xl shadow-inner placeholder:text-zinc-500 transition-all duration-300"
                required
                type="url"
              />
              <div className="absolute right-3">
                <Button 
                  type="submit" 
                  disabled={isAnalyzing}
                  className="h-14 rounded-full px-8 bg-white hover:bg-zinc-200 text-black font-medium shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all duration-300 group border border-white/20"
                >
                  <span className="text-lg">{isAnalyzing ? 'Analyzing...' : 'Analyze'}</span>
                  {!isAnalyzing && (
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <ArrowRight className="ml-3 h-5 w-5" strokeWidth={2} />
                    </motion.div>
                  )}
                </Button>
              </div>
            </form>
            
            <AnimatePresence>
              {activeRepoId && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 32 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="px-6 pb-6 overflow-hidden"
                >
                  <JobTracker repoId={activeRepoId} onComplete={() => refetchRepos()} />
                </motion.div>
              )}
            </AnimatePresence>
          </SpotlightCard>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Telemetry Bento Box */}
          <motion.div variants={item} className="md:col-span-4 h-full">
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
                      <p className="text-xs text-zinc-500">{isLoading ? 'Pinging...' : 'Healthy'}</p>
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
                      <p className="text-xs text-zinc-500">{isLoading ? 'Connecting...' : 'Active'}</p>
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
                      <p className="text-xs text-zinc-500">{isLoading ? 'Connecting...' : 'Active'}</p>
                    </div>
                  </div>
                  <StatusRing status={health?.redis === 'healthy' ? 'healthy' : 'offline'} />
                </div>
              </div>
            </SpotlightCard>
          </motion.div>

          {/* Recent Documents Bento Box */}
          <motion.div variants={item} className="md:col-span-8 h-full">
            <SpotlightCard className="h-full">
              <div className="p-8 border-b border-white/5">
                <h3 className="text-lg font-semibold text-white">Recent Documents</h3>
              </div>
              <div className="p-4">
                {reposLoading ? (
                  <div className="p-4 space-y-4">
                    <div className="h-20 bg-white/5 rounded-2xl animate-pulse" />
                    <div className="h-20 bg-white/5 rounded-2xl animate-pulse" />
                  </div>
                ) : reposData?.repositories?.length > 0 ? (
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
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
