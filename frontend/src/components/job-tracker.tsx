'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export function JobTracker({ repoId, onComplete }: { repoId: string; onComplete?: () => void }) {
  const [shouldPoll, setShouldPoll] = useState(true);

  const { data: job, isError } = useQuery({
    queryKey: ['job', repoId],
    queryFn: () => api.getJobForRepo(repoId),
    refetchInterval: shouldPoll ? 2000 : false,
    enabled: !!repoId,
  });

  useEffect(() => {
    if (job) {
      if (job.status === 'COMPLETED' || job.status === 'FAILED') {
        setShouldPoll(false);
        if (job.status === 'COMPLETED' && onComplete) {
          onComplete();
        }
      }
    }
  }, [job, onComplete]);

  if (isError) {
    return null;
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center p-6 text-zinc-500">
        <Loader2 className="w-5 h-5 animate-spin mr-3" strokeWidth={1.5} />
        <span className="text-sm font-medium">Initializing spatial grid...</span>
      </div>
    );
  }

  const isCompleted = job.status === 'COMPLETED';
  const isFailed = job.status === 'FAILED';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          {isCompleted ? (
            <div className="bg-emerald-500/10 text-emerald-400 p-2 rounded-full border border-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.1)]">
              <CheckCircle2 className="w-5 h-5" strokeWidth={2} />
            </div>
          ) : isFailed ? (
            <div className="bg-rose-500/10 text-rose-400 p-2 rounded-full border border-rose-500/20 shadow-[0_0_10px_rgba(251,113,133,0.1)]">
              <AlertCircle className="w-5 h-5" strokeWidth={2} />
            </div>
          ) : (
            <div className="bg-white/10 text-white p-2 rounded-full border border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.1)]">
              <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
            </div>
          )}
          <span className={`text-sm font-semibold tracking-wide ${isFailed ? 'text-rose-400' : isCompleted ? 'text-emerald-400' : 'text-white'}`}>
            {isFailed ? 'Analysis Failed' : job.current_step || 'Initializing...'}
          </span>
        </div>
        <span className="text-lg font-bold text-white drop-shadow-md">
          {job.progress_percentage}%
        </span>
      </div>
      
      <div className="relative pt-2">
        <Progress 
          value={job.progress_percentage} 
          className={`h-2 bg-white/5 rounded-full overflow-hidden ${
            isFailed 
              ? '[&_[data-slot=progress-indicator]]:bg-rose-500 [&_[data-slot=progress-indicator]]:shadow-[0_0_10px_rgba(251,113,133,0.5)]' 
              : isCompleted 
                ? '[&_[data-slot=progress-indicator]]:bg-emerald-500 [&_[data-slot=progress-indicator]]:shadow-[0_0_10px_rgba(52,211,153,0.5)]' 
                : '[&_[data-slot=progress-indicator]]:bg-white [&_[data-slot=progress-indicator]]:shadow-[0_0_10px_rgba(255,255,255,0.5)]'
          }`}
        />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap justify-between gap-4 mt-6 pt-6 border-t border-white/5"
      >
        <div className="flex flex-col">
          <span className="text-3xl font-heading text-white">{job.files_scanned}</span>
          <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mt-1">Files Scanned</span>
        </div>
        <div className="flex flex-col">
          <span className="text-3xl font-heading text-white">{job.files_ignored}</span>
          <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mt-1">Ignored</span>
        </div>
        <div className="flex flex-col">
          <span className="text-3xl font-heading text-white">{job.secrets_skipped}</span>
          <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mt-1">Secrets</span>
        </div>
        <div className="flex flex-col">
          <span className="text-3xl font-heading text-white">{job.languages_detected}</span>
          <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mt-1">Languages</span>
        </div>
      </motion.div>
      
      <AnimatePresence>
        {isFailed && job.error_message && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 p-6 bg-rose-500/10 rounded-2xl text-sm text-rose-300 overflow-auto border border-rose-500/20"
          >
            <p className="font-semibold mb-2 flex items-center text-rose-400"><AlertCircle className="w-4 h-4 mr-2" /> Error Log</p>
            <code className="font-mono text-xs text-rose-200 bg-rose-950/50 p-3 rounded-lg block leading-relaxed">{job.error_message}</code>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
