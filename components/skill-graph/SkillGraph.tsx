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
  type NodeChange,
  BackgroundVariant,
  Panel,
  ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { SkillNode, type SkillNodeData } from './SkillNode';
import { CenterNode, type CenterNodeData } from './CenterNode';
import { SkillEdge, EdgeGradientDefs } from './SkillEdge';
import { getLayoutedElements, updateEdgeHandles } from './use-skill-layout';
import { CENTER_NODE_ID } from './constants';
import { GlassPanel } from '@/components/ui/GlassPanel';

const nodeTypes = {
  skill: SkillNode,
  center: CenterNode,
} as const;

const edgeTypes = {
  skill: SkillEdge,
} as const;

interface SkillGraphProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  careerTitle?: string;
  careerDescription?: string;
  onNodeClick?: (node: Node) => void;
}

export function SkillGraph({
  initialNodes,
  initialEdges,
  careerTitle = 'Career',
  careerDescription = '',
  onNodeClick,
}: SkillGraphProps) {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    if (initialNodes.length === 0) return 0;
    const total = initialNodes.reduce((sum, node) => {
      const data = node.data as unknown as SkillNodeData;
      return sum + (data?.progress || 0);
    }, 0);
    return Math.round(total / initialNodes.length);
  }, [initialNodes]);

  // Create center node and edges to level 1 skills
  const { nodesWithCenter, edgesWithCenter } = useMemo(() => {
    // Create center node
    const centerNode: Node = {
      id: CENTER_NODE_ID,
      type: 'center',
      position: { x: 0, y: 0 },
      data: {
        title: careerTitle,
        description: careerDescription,
        progress: overallProgress,
      } as CenterNodeData,
    };

    // Find level 1 skills (root skills with no prerequisites or level 1)
    const level1Skills = initialNodes.filter((node) => {
      const data = node.data as unknown as SkillNodeData;
      return data?.level === 1 || (data?.prerequisites?.length === 0);
    });

    // Create edges from center to level 1 skills
    const centerEdges: Edge[] = level1Skills.map((node) => ({
      id: `${CENTER_NODE_ID}-${node.id}`,
      source: CENTER_NODE_ID,
      target: node.id,
      type: 'skill',
      animated: true,
    }));

    return {
      nodesWithCenter: [centerNode, ...initialNodes],
      edgesWithCenter: [...centerEdges, ...initialEdges],
    };
  }, [initialNodes, initialEdges, careerTitle, careerDescription, overallProgress]);

  // Apply layout to nodes
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    return getLayoutedElements(nodesWithCenter, edgesWithCenter, 'TB', CENTER_NODE_ID);
  }, [nodesWithCenter, edgesWithCenter]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  // Update edge handles when nodes are dragged
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);

      // Check if any node position changed (drag end)
      const hasPositionChange = changes.some(
        (change) => change.type === 'position' && change.dragging === false
      );

      if (hasPositionChange) {
        // Get updated nodes after the change
        setNodes((currentNodes) => {
          // Update edges with new handle positions
          setEdges((currentEdges) => updateEdgeHandles(currentNodes, currentEdges));
          return currentNodes;
        });
      }
    },
    [onNodesChange, setNodes, setEdges]
  );

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.id === CENTER_NODE_ID) return;
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
      if (node.id === CENTER_NODE_ID) return;
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
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        defaultEdgeOptions={{
          type: 'skill',
          animated: true,
        }}
        fitView
        fitViewOptions={{
          padding: 0.2,
          maxZoom: 0.6,
          minZoom: 0.15,
        }}
        minZoom={0.1}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={30}
          size={1}
          color="rgba(180, 130, 70, 0.08)"
        />
        <Controls className="!bg-slate-800 !border-slate-700" />
        <MiniMap
          nodeColor={(node) => {
            if (node.id === CENTER_NODE_ID) return '#C9A227';
            const data = node.data as unknown as SkillNodeData;
            if (data?.progress === 100) return '#fbbf24';
            if (data?.progress > 0) return '#C9A227';
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
                  {nodes.filter((n) => {
                    if (n.id === CENTER_NODE_ID) return false;
                    return (n.data as unknown as SkillNodeData)?.progress > 0;
                  }).length} Unlocked
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="text-slate-300">
                  {nodes.filter((n) => {
                    if (n.id === CENTER_NODE_ID) return false;
                    return (n.data as unknown as SkillNodeData)?.progress === 100;
                  }).length} Mastered
                </span>
              </div>
            </div>
          </GlassPanel>
        </Panel>
      </ReactFlow>

      {/* Selected Node Details */}
      {selectedNode && selectedNode.id !== CENTER_NODE_ID && (
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
      {data.prerequisites && data.prerequisites.length > 0 && (
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
