'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GitBranch, ArrowRight } from 'lucide-react';
import { JobTracker } from '@/components/job-tracker';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { useRouter } from 'next/navigation';

export const AnalyzeForm = () => {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [activeRepoId, setActiveRepoId] = useState<string | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);

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
    <>
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

      <div className="max-w-3xl mx-auto w-full relative z-20">
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
                <JobTracker repoId={activeRepoId} onComplete={() => router.refresh()} />
              </motion.div>
            )}
          </AnimatePresence>
        </SpotlightCard>
      </div>
    </>
  );
};
