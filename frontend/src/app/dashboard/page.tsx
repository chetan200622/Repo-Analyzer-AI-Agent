'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Server, Database, Layers, FolderGit2 } from 'lucide-react';
import { JobTracker } from '@/components/job-tracker';
import { toast } from 'sonner';
import Link from 'next/link';

export default function DashboardPage() {
  const [url, setUrl] = useState('');
  const [activeRepoId, setActiveRepoId] = useState<string | null>(null);

  const { data: health, isLoading, isError, error } = useQuery({
    queryKey: ['health'],
    queryFn: api.checkHealth,
    refetchInterval: 30000, // Check every 30 seconds
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
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* API Status Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Server</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : isError ? (
              <div className="text-2xl font-bold text-red-500">Offline</div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {health?.status === 'healthy' ? (
                    <span className="text-green-500">Online</span>
                  ) : (
                    <span className="text-yellow-500">Degraded</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  v{health?.version || 'unknown'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Database Status Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PostgreSQL</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : isError ? (
              <div className="text-2xl font-bold text-red-500">Unknown</div>
            ) : (
              <div className="text-2xl font-bold">
                {health?.database === 'healthy' ? (
                  <span className="text-green-500">Connected</span>
                ) : (
                  <span className="text-red-500">Disconnected</span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Redis Status Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Redis Queue</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : isError ? (
              <div className="text-2xl font-bold text-red-500">Unknown</div>
            ) : (
              <div className="text-2xl font-bold">
                {health?.redis === 'healthy' ? (
                  <span className="text-green-500">Connected</span>
                ) : (
                  <span className="text-red-500">Disconnected</span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {isError && (
        <div className="rounded-md bg-red-500/10 p-4 border border-red-500/20 mb-8">
          <h3 className="text-sm font-medium text-red-500">Connection Error</h3>
          <p className="mt-2 text-sm text-red-400">
            {error instanceof Error ? error.message : 'Could not connect to the backend API.'}
          </p>
        </div>
      )}

      {/* Repository Analysis Form */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle>Analyze New Repository</CardTitle>
            <CardDescription>
              Submit a public GitHub repository URL to build a semantic index and knowledge graph.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAnalyze} className="flex flex-col space-y-4">
              <div className="flex space-x-2">
                <Input 
                  placeholder="https://github.com/owner/repo" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="bg-zinc-950 border-zinc-800"
                  required
                  type="url"
                />
                <Button type="submit" disabled={isAnalyzing}>
                  {isAnalyzing ? 'Starting...' : 'Analyze'}
                </Button>
              </div>
            </form>
            
            {activeRepoId && (
              <div className="mt-6">
                <JobTracker repoId={activeRepoId} onComplete={() => refetchRepos()} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Repositories */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle>Recent Repositories</CardTitle>
            <CardDescription>
              Previously analyzed repositories in your database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reposLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : reposData?.repositories?.length > 0 ? (
              <div className="space-y-2">
                {reposData.repositories.slice(0, 5).map((repo: any) => (
                  <Link href={`/dashboard/repositories/${repo.id}`} key={repo.id}>
                    <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <FolderGit2 className="h-5 w-5 text-zinc-400" />
                        <div>
                          <p className="text-sm font-medium">{repo.name}</p>
                          <p className="text-xs text-zinc-500">{repo.primary_language || 'Unknown'}</p>
                        </div>
                      </div>
                      <Badge variant={repo.status === 'READY' ? 'default' : repo.status === 'FAILED' ? 'destructive' : 'secondary'}>
                        {repo.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center p-6 text-sm text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                No repositories analyzed yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
