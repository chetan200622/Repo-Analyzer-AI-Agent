'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GitBranch, ArrowRight, Loader2 } from 'lucide-react';
import { JobTracker } from '@/components/job-tracker';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export const AnalyzeForm = () => {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [activeRepoId, setActiveRepoId] = useState<string | null>(null);

  const { mutate: analyzeRepo, isPending: isAnalyzing } = useMutation({
    mutationFn: api.analyzeRepository,
    onSuccess: (data) => {
      setActiveRepoId(data.id);
      toast.success('Repository analysis started');
      setUrl('');
      router.refresh();
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
    <div className="w-full space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-2">
        <form onSubmit={handleAnalyze} className="relative flex items-center w-full">
          <div className="absolute left-5 text-zinc-400">
            <GitBranch className="h-5 w-5" strokeWidth={1.5} />
          </div>
          <Input 
            placeholder="Paste a public GitHub repository URL..." 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="pl-14 pr-36 h-14 w-full rounded-xl bg-gray-50 border-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-400 text-zinc-800 text-base placeholder:text-zinc-400 transition-all"
            required
            type="url"
            pattern="https://github\.com/.*"
            title="Must be a valid GitHub repository URL (e.g., https://github.com/owner/repo)"
          />
          <div className="absolute right-2">
            <Button 
              type="submit" 
              disabled={isAnalyzing}
              className="h-10 rounded-xl px-5 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all group disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Analyze
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      <AnimatePresence>
        {activeRepoId && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <JobTracker repoId={activeRepoId} onComplete={() => router.refresh()} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
