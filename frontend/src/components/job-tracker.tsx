'use client';

// Job progress tracker — shows analysis pipeline status with stats
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
        <span className="text-sm font-medium">Initializing analysis...</span>
      </div>
    );
  }

  const isCompleted = job.status === 'COMPLETED';
  const isFailed = job.status === 'FAILED';

  return (
    <div className="space-y-5">
      {/* Status header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {isCompleted ? (
            <div className="bg-emerald-50 text-emerald-500 p-2 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-5 h-5" strokeWidth={2} />
            </div>
          ) : isFailed ? (
            <div className="bg-red-50 text-red-500 p-2 rounded-xl border border-red-200">
              <AlertCircle className="w-5 h-5" strokeWidth={2} />
            </div>
          ) : (
            <div className="bg-blue-50 text-blue-500 p-2 rounded-xl border border-blue-200">
              <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
            </div>
          )}
          <span className={`text-sm font-semibold ${isFailed ? 'text-red-600' : isCompleted ? 'text-emerald-600' : 'text-zinc-700'}`}>
            {isFailed ? 'Analysis Failed' : job.current_step || 'Initializing...'}
          </span>
        </div>
        <span className={`text-lg font-bold ${isFailed ? 'text-red-500' : isCompleted ? 'text-emerald-500' : 'text-blue-600'}`}>
          {job.progress_percentage}%
        </span>
      </div>
      
      {/* Progress bar */}
      <Progress 
        value={job.progress_percentage} 
        className={`h-2 bg-gray-100 rounded-full overflow-hidden ${
          isFailed 
            ? '[&_[data-slot=progress-indicator]]:bg-red-500' 
            : isCompleted 
              ? '[&_[data-slot=progress-indicator]]:bg-emerald-500' 
              : '[&_[data-slot=progress-indicator]]:bg-blue-500'
        }`}
      />
      
      {/* Stats grid */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-100"
      >
        {[
          { value: job.files_scanned, label: 'Files Scanned' },
          { value: job.files_ignored, label: 'Ignored' },
          { value: job.secrets_skipped, label: 'Secrets' },
          { value: job.languages_detected, label: 'Languages' },
        ].map((stat) => (
          <div key={stat.label} className="flex flex-col items-center text-center">
            <span className="text-2xl font-bold text-zinc-800">{stat.value ?? 0}</span>
            <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest mt-1">{stat.label}</span>
          </div>
        ))}
      </motion.div>
      
      {/* Error message */}
      <AnimatePresence>
        {isFailed && job.error_message && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-red-50 rounded-xl text-sm text-red-600 overflow-auto border border-red-200"
          >
            <p className="font-semibold mb-2 flex items-center text-red-700"><AlertCircle className="w-4 h-4 mr-2" /> Error Log</p>
            <code className="font-mono text-xs text-red-500 bg-red-100 p-3 rounded-lg block leading-relaxed">{job.error_message}</code>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
