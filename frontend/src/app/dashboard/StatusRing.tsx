'use client';

// Simple status dot indicator for light theme
export const StatusRing = ({ status }: { status: 'healthy' | 'degraded' | 'offline' | 'unknown' }) => {
  const isHealthy = status === 'healthy';
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2.5 h-2.5 rounded-full ${isHealthy ? 'bg-emerald-500' : 'bg-red-400'}`} />
      <span className={`text-xs font-medium ${isHealthy ? 'text-emerald-600' : 'text-red-500'}`}>
        {isHealthy ? 'Online' : 'Offline'}
      </span>
    </div>
  );
};
