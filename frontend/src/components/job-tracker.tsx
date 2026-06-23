'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

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
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-6">
          <p className="text-sm text-zinc-400">Loading analysis status...</p>
        </CardContent>
      </Card>
    );
  }

  const isCompleted = job.status === 'COMPLETED';
  const isFailed = job.status === 'FAILED';

  return (
    <Card className={`border-zinc-800 ${isFailed ? 'bg-red-950/20' : 'bg-zinc-900'}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Analysis Progress</CardTitle>
        <CardDescription className={isFailed ? 'text-red-400' : ''}>
          {isFailed ? 'Analysis Failed' : job.current_step || 'Initializing...'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Progress 
            value={job.progress_percentage} 
            className={`h-2 ${isFailed ? 'bg-red-950 [&_[data-slot=progress-indicator]]:bg-red-500' : isCompleted ? '[&_[data-slot=progress-indicator]]:bg-green-500' : '[&_[data-slot=progress-indicator]]:bg-blue-500'}`}
          />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-zinc-400">
            <div>
              <span className="block font-medium text-zinc-300">Files Scanned</span>
              {job.files_scanned}
            </div>
            <div>
              <span className="block font-medium text-zinc-300">Files Ignored</span>
              {job.files_ignored}
            </div>
            <div>
              <span className="block font-medium text-zinc-300">Secrets Skipped</span>
              {job.secrets_skipped}
            </div>
            <div>
              <span className="block font-medium text-zinc-300">Languages</span>
              {job.languages_detected}
            </div>
          </div>
          
          {isFailed && job.error_message && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md text-sm text-red-400 overflow-auto">
              <code>{job.error_message}</code>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
