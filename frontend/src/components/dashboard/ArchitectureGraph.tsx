'use client';

import React, { useEffect, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Node,
  Edge,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';


const nodeWidth = 220;
const nodeHeight = 60;

interface ArchitectureGraphProps {
  mermaidSyntax: string;
}

export function ArchitectureGraph({ mermaidSyntax }: ArchitectureGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (!mermaidSyntax) return;
    
    try {
      console.log('Rendering mermaid graph:', mermaidSyntax);
      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];
      const nodeMap = new Map<string, string>(); // id -> label

      // Basic Mermaid Parser for 'graph TD' and 'A[Label] --> B[Label]'
      const lines = mermaidSyntax.split('\n');
      let direction = 'LR'; // Default to Left-Right as requested

      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('graph') || trimmed.startsWith('%%')) {
          return;
        }

        // Match A[Label] --> B[Label] or A --> B[Label] etc.
        // E.g., A[User Interface] --> B[React Components]
        const edgeRegex = /([A-Za-z0-9_-]+)(?:\[(.*?)\])?\s*-->\s*([A-Za-z0-9_-]+)(?:\[(.*?)\])?/;
        const match = trimmed.match(edgeRegex);

        if (match) {
          const sourceId = match[1];
          const sourceLabel = match[2] || sourceId;
          const targetId = match[3];
          const targetLabel = match[4] || targetId;

          if (!nodeMap.has(sourceId)) {
            nodeMap.set(sourceId, sourceLabel.replace(/["']/g, ''));
          }
          if (!nodeMap.has(targetId)) {
            nodeMap.set(targetId, targetLabel.replace(/["']/g, ''));
          }

          newEdges.push({
            id: `e-${sourceId}-${targetId}`,
            source: sourceId,
            target: targetId,
            animated: true, // Requested animation
            style: { stroke: 'rgba(52, 211, 153, 0.5)', strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: 'rgba(52, 211, 153, 0.8)',
            },
          });
        }
      });

      console.log('Parsed Nodes:', nodeMap);
      console.log('Parsed Edges:', newEdges);

      // Simple Grid Layout to replace dagre (prevents client-side hydration crash)
      let x = 50;
      let y = 50;
      let count = 0;

      // Build React Flow Nodes
      nodeMap.forEach((label, id) => {
        newNodes.push({
          id,
          position: { x, y },
          data: { label },
          sourcePosition: direction === 'LR' ? Position.Right : Position.Bottom,
          targetPosition: direction === 'LR' ? Position.Left : Position.Top,
          style: {
            background: 'rgba(255, 255, 255, 0.03)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '16px 20px',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            width: nodeWidth,
          },
        });
        
        y += 100;
        count++;
        if (count % 4 === 0) {
          y = 50;
          x += 350;
        }
      });

      setNodes(newNodes);
      setEdges(newEdges);
      setIsRendered(true);
    } catch (err) {
      console.error('Error rendering architecture graph:', err);
      // Fallback: render an error state or just the raw nodes
      setIsRendered(true); // render empty so it doesn't hang
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mermaidSyntax]);

  if (!isRendered) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] bg-black/20 text-zinc-500 font-light text-sm border border-white/5 rounded-2xl">
        <p>Rendering Architecture Map...</p>
        <p className="text-xs mt-2 text-zinc-600">Input length: {mermaidSyntax?.length}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] bg-black/20 rounded-2xl overflow-hidden border border-white/5 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        className="bg-transparent"
        minZoom={0.2}
      >
        <Background color="rgba(255,255,255,0.05)" gap={20} />
        <Controls className="!bg-black/50 !border-white/10 !fill-white" />
      </ReactFlow>
      
      {/* Glossy overlay effect for premium feel */}
      <div className="absolute inset-0 pointer-events-none rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border-t border-white/[0.02]"></div>
    </div>
  );
}
