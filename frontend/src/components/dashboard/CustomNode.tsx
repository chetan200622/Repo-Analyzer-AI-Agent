import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Box } from 'lucide-react';

// Custom React Flow node — light theme with blue accent
export function CustomNode({ data, isConnectable }: NodeProps) {
  const label = data.label as string || 'Unknown';
  
  return (
    <div className="relative flex items-center w-[240px] bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden group hover:shadow-md hover:border-blue-300 transition-all duration-200">
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-2 h-2 !bg-blue-400 !border-white !border-2"
      />
      
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-blue-600 rounded-l-xl"></div>

      <div className="flex items-center p-3 pl-4 w-full">
        <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 mr-2.5 group-hover:bg-blue-100 transition-colors">
          <Box size={14} strokeWidth={2} className="text-blue-500" />
        </div>
        
        <div className="flex-1 overflow-hidden">
          <span className="text-[13px] font-semibold text-zinc-800 truncate block leading-tight">
            {label}
          </span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-2 h-2 !bg-blue-400 !border-white !border-2"
      />
    </div>
  );
}
