'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { usePathname } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileCode, Activity, Languages, Database } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function RepositoryPage() {
  const pathname = usePathname();
  const repoId = pathname.split('/').pop() as string;

  const { data: repo, isLoading: repoLoading } = useQuery({
    queryKey: ['repository', repoId],
    queryFn: () => api.getRepository(repoId),
  });

  const { data: files, isLoading: filesLoading } = useQuery({
    queryKey: ['repositoryFiles', repoId],
    queryFn: () => api.getRepositoryFiles(repoId),
  });

  if (repoLoading) {
    return (
      <div className="flex-1 p-8 space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!repo) {
    return <div className="p-8">Repository not found</div>;
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{repo.name}</h2>
          <div className="flex items-center space-x-2 mt-2">
            <a href={repo.github_url} target="_blank" rel="noreferrer" className="text-sm text-blue-400 hover:underline">
              {repo.github_url}
            </a>
            <Badge variant={repo.status === 'READY' ? 'default' : 'secondary'}>{repo.status}</Badge>
          </div>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Primary Language</CardTitle>
            <Languages className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{repo.primary_language || 'N/A'}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files Scanned</CardTitle>
            <FileCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{repo.total_files.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lines of Code</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{repo.total_lines.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Status</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Indexed</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>File Explorer</CardTitle>
          <CardDescription>All recognized source files in this repository.</CardDescription>
        </CardHeader>
        <CardContent>
          {filesLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : files && files.length > 0 ? (
            <div className="rounded-md border border-zinc-800">
              <div className="max-h-[500px] overflow-auto">
                <table className="w-full text-sm text-left text-zinc-400">
                  <thead className="text-xs text-zinc-300 uppercase bg-zinc-900/50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 font-medium">File Path</th>
                      <th className="px-6 py-3 font-medium">Language</th>
                      <th className="px-6 py-3 font-medium text-right">Lines</th>
                      <th className="px-6 py-3 font-medium text-right">Size (KB)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((file) => (
                      <tr key={file.id} className="border-b border-zinc-800 hover:bg-zinc-800/30">
                        <td className="px-6 py-3 font-mono text-xs">{file.path}</td>
                        <td className="px-6 py-3">
                          <Badge variant="outline" className="text-xs font-normal bg-zinc-900">{file.language}</Badge>
                        </td>
                        <td className="px-6 py-3 text-right">{file.line_count.toLocaleString()}</td>
                        <td className="px-6 py-3 text-right">{(file.size_bytes / 1024).toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
              No files found or repository is still processing.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
