'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  BackgroundVariant,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { SkillNode, type SkillNodeData } from './SkillNode';
import { SkillEdge, EdgeGradientDefs } from './SkillEdge';
import { getLayoutedElements } from './use-skill-layout';
import { GlassPanel } from '@/components/ui/GlassPanel';

const nodeTypes = {
  skill: SkillNode,
} as const;

const edgeTypes = {
  skill: SkillEdge,
} as const;

interface SkillGraphProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  onNodeClick?: (node: Node) => void;
}

export function SkillGraph({ initialNodes, initialEdges, onNodeClick }: SkillGraphProps) {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Apply layout to nodes
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    return getLayoutedElements(initialNodes, initialEdges, 'TB');
  }, [initialNodes, initialEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node);
      onNodeClick?.(node);
    },
    [onNodeClick]
  );

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Get unique categories for the legend
  const categories = useMemo(() => {
    const cats = new Set<string>();
    nodes.forEach((node) => {
      const data = node.data as unknown as SkillNodeData;
      if (data?.category) {
        cats.add(data.category);
      }
    });
    return Array.from(cats);
  }, [nodes]);

  return (
    <div className="w-full h-full relative">
      <EdgeGradientDefs />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{
          type: 'skill',
          animated: true,
        }}
        fitView
        fitViewOptions={{
          padding: 0.2,
          maxZoom: 1,
        }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="rgba(255, 255, 255, 0.05)"
        />
        <Controls className="!bg-slate-800 !border-slate-700" />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as unknown as SkillNodeData;
            if (data?.progress === 100) return '#fbbf24';
            if (data?.progress > 0) return '#00f0ff';
            return '#4a5568';
          }}
          maskColor="rgba(0, 0, 0, 0.8)"
          className="!bg-slate-900/80"
        />

        {/* Category Legend */}
        <Panel position="top-left">
          <GlassPanel className="p-3">
            <div className="text-xs font-semibold text-slate-400 mb-2">Categories</div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <span
                  key={category}
                  className="px-2 py-1 rounded-full text-xs bg-slate-700 text-slate-300"
                >
                  {category}
                </span>
              ))}
            </div>
          </GlassPanel>
        </Panel>

        {/* Stats Panel */}
        <Panel position="top-right">
          <GlassPanel className="p-3">
            <div className="text-xs font-semibold text-slate-400 mb-2">Progress</div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-cyan-400" />
                <span className="text-slate-300">
                  {nodes.filter((n) => (n.data as unknown as SkillNodeData)?.progress > 0).length} Unlocked
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="text-slate-300">
                  {nodes.filter((n) => (n.data as unknown as SkillNodeData)?.progress === 100).length} Mastered
                </span>
              </div>
            </div>
          </GlassPanel>
        </Panel>
      </ReactFlow>

      {/* Selected Node Details */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-10">
          <GlassPanel className="p-4">
            <SelectedNodeDetails node={selectedNode} />
          </GlassPanel>
        </div>
      )}
    </div>
  );
}

function SelectedNodeDetails({ node }: { node: Node }) {
  const data = node.data as unknown as SkillNodeData;

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{data.icon}</span>
        <div>
          <h3 className="font-bold text-white">{data.name}</h3>
          <span className="text-xs text-cyan-400">{data.category}</span>
        </div>
      </div>
      <p className="text-sm text-slate-300 mb-3">{data.description}</p>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">Level {data.level}</span>
        <span className="text-cyan-400">{data.progress}% Complete</span>
      </div>
      <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-500"
          style={{ width: `${data.progress}%` }}
        />
      </div>
      {data.prerequisites.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <span className="text-xs text-slate-400">Prerequisites:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {data.prerequisites.map((prereq) => (
              <span
                key={prereq}
                className="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-300"
              >
                {prereq}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
