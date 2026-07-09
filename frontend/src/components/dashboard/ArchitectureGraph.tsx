'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
import dagre from 'dagre';
import { CustomNode } from './CustomNode';

const nodeWidth = 240;
const nodeHeight = 56;

interface ArchitectureGraphProps {
  mermaidSyntax: string;
}

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction, ranksep: 100, nodesep: 50 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = isHorizontal ? Position.Left : Position.Top;
    node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
    return node;
  });

  return { nodes, edges };
};

export function ArchitectureGraph({ mermaidSyntax }: ArchitectureGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isRendered, setIsRendered] = useState(false);

  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

  useEffect(() => {
    if (!mermaidSyntax) return;
    
    try {
      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];
      const nodeMap = new Map<string, string>();

      const lines = mermaidSyntax.split('\n');
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('graph') || trimmed.startsWith('%%')) return;

        // Match edges: A["Label"] --> B["Label"] or A[Label] --> B[Label]
        const edgeRegex = /([A-Za-z0-9_-]+)(?:\[(?:"(.*?)"|'(.*?)'|(.*?))\])?\s*-->\s*(?:\|.*?\|\s*)?([A-Za-z0-9_-]+)(?:\[(?:"(.*?)"|'(.*?)'|(.*?))\])?/;
        const match = trimmed.match(edgeRegex);

        if (match) {
          const sourceId = match[1];
          const sourceLabel = match[2] || match[3] || match[4] || sourceId;
          const targetId = match[5];
          const targetLabel = match[6] || match[7] || match[8] || targetId;

          if (!nodeMap.has(sourceId)) nodeMap.set(sourceId, sourceLabel.replace(/['"]/g, ''));
          if (!nodeMap.has(targetId)) nodeMap.set(targetId, targetLabel.replace(/['"]/g, ''));

          newEdges.push({
            id: `e-${sourceId}-${targetId}`,
            source: sourceId,
            target: targetId,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#93C5FD', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#60A5FA' },
          });
        }
      });

      nodeMap.forEach((label, id) => {
        newNodes.push({ id, type: 'custom', position: { x: 0, y: 0 }, data: { label } });
      });

      const { nodes: ln, edges: le } = getLayoutedElements(newNodes, newEdges, 'LR');
      setNodes([...ln]);
      setEdges([...le]);
      setIsRendered(true);
    } catch (err) {
      console.error('Error rendering architecture graph:', err);
      setIsRendered(true);
    }
  }, [mermaidSyntax, setNodes, setEdges]);

  if (!isRendered) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-white text-zinc-400 text-sm border border-gray-200 rounded-xl">
        Rendering Architecture Map...
      </div>
    );
  }

  return (
    <div className="w-full h-[550px] bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
      >
        <Background color="#E5E7EB" gap={24} size={1} />
        <Controls className="!bg-white !border-gray-200 !shadow-md rounded-xl overflow-hidden [&>button]:!border-gray-200 [&>button]:!bg-white [&>button:hover]:!bg-gray-50" />
      </ReactFlow>
    </div>
  );
}
