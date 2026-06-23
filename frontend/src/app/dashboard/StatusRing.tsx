'use client';

import { motion } from 'framer-motion';

export const StatusRing = ({ status }: { status: 'healthy' | 'degraded' | 'offline' | 'unknown' }) => {
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
