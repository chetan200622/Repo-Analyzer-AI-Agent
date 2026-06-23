'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Server, Database, Layers } from 'lucide-react';

export default function DashboardPage() {
  const { data: health, isLoading, isError, error } = useQuery({
    queryKey: ['health'],
    queryFn: api.checkHealth,
    refetchInterval: 30000, // Check every 30 seconds
  });

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
        <div className="rounded-md bg-red-500/10 p-4 border border-red-500/20">
          <h3 className="text-sm font-medium text-red-500">Connection Error</h3>
          <p className="mt-2 text-sm text-red-400">
            {error instanceof Error ? error.message : 'Could not connect to the backend API.'}
          </p>
        </div>
      )}
    </div>
  );
}
