'use client';

import { useCallback, useMemo, useState, useImperativeHandle, forwardRef } from 'react';
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

import { SkillNode, type SkillNodeData, type SkillStatus } from './SkillNode';
import { CenterNode, type CenterNodeData } from './CenterNode';
import { SkillEdge, EdgeGradientDefs } from './SkillEdge';
import { getLayoutedElements, updateEdgeHandles } from './use-skill-layout';
import { CENTER_NODE_ID, LAYOUT_CONFIG } from './constants';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { SkillTestModal } from '@/components/skill-test/SkillTestModal';
import { SKILL_PASS_THRESHOLD } from '@/lib/constants';

// Node position info for screenshot capture
export interface NodePositionInfo {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isCompleted: boolean;
  isCenterNode: boolean;
}

// Ref handle for external access
export interface SkillGraphHandle {
  getNodePositions: () => NodePositionInfo[];
}

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
  onNodesChange?: (nodes: Node[]) => void;
}

export const SkillGraph = forwardRef<SkillGraphHandle, SkillGraphProps>(function SkillGraphInner({
  initialNodes,
  initialEdges,
  careerTitle = 'Career',
  careerDescription = '',
  onNodeClick,
  onNodesChange: onNodesChangeProp,
}, ref) {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [testingSkill, setTestingSkill] = useState<SkillNodeData | null>(null);

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    if (initialNodes.length === 0) return 0;
    const total = initialNodes.reduce((sum, node) => {
      const data = node.data as unknown as SkillNodeData;
      return sum + (data?.progress || 0);
    }, 0);
    return Math.round(total / initialNodes.length);
  }, [initialNodes]);

  // Create a map of node progress for quick lookup
  const nodeProgressMap = useMemo(() => {
    const map = new Map<string, number>();
    initialNodes.forEach((node) => {
      const data = node.data as unknown as SkillNodeData;
      map.set(data.id, data.progress);
    });
    return map;
  }, [initialNodes]);

  // Calculate status for each node based on prerequisites
  // SKILL_PASS_THRESHOLD%+ is considered "completed" (passed the test)
  const getNodeStatus = useCallback((data: SkillNodeData): SkillStatus => {
    if (data.progress >= SKILL_PASS_THRESHOLD) return 'completed';

    // Check if all prerequisites are passed
    const prereqs = data.prerequisites || [];
    if (prereqs.length === 0) return 'available';

    const allPrereqsPassed = prereqs.every((prereqId) => {
      const prereqProgress = nodeProgressMap.get(prereqId) || 0;
      return prereqProgress >= SKILL_PASS_THRESHOLD;
    });

    return allPrereqsPassed ? 'available' : 'locked';
  }, [nodeProgressMap]);

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

    // Add status to each node
    const nodesWithStatus = initialNodes.map((node) => {
      const data = node.data as unknown as SkillNodeData;
      return {
        ...node,
        data: {
          ...data,
          status: getNodeStatus(data),
        },
      };
    });

    // Find level 1 skills (root skills with no prerequisites or level 1)
    const level1Skills = nodesWithStatus.filter((node) => {
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
      nodesWithCenter: [centerNode, ...nodesWithStatus],
      edgesWithCenter: [...centerEdges, ...initialEdges],
    };
  }, [initialNodes, initialEdges, careerTitle, careerDescription, overallProgress, getNodeStatus]);

  // Apply layout to nodes
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    return getLayoutedElements(nodesWithCenter, edgesWithCenter, 'TB', CENTER_NODE_ID);
  }, [nodesWithCenter, edgesWithCenter]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  // Expose getNodePositions method via ref for screenshot capture
  useImperativeHandle(ref, () => ({
    getNodePositions: (): NodePositionInfo[] => {
      return nodes.map((node) => {
        const data = node.data as unknown as SkillNodeData;
        const isCenterNode = node.id === CENTER_NODE_ID;
        return {
          id: node.id,
          x: node.position.x,
          y: node.position.y,
          width: node.measured?.width ?? (isCenterNode ? LAYOUT_CONFIG.CENTER_NODE_SIZE : LAYOUT_CONFIG.NODE_WIDTH),
          height: node.measured?.height ?? (isCenterNode ? LAYOUT_CONFIG.CENTER_NODE_SIZE : LAYOUT_CONFIG.NODE_HEIGHT),
          isCompleted: !isCenterNode && data?.status === 'completed',
          isCenterNode,
        };
      });
    },
  }), [nodes]);

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
          // Notify parent of position changes
          onNodesChangeProp?.(currentNodes);
          return currentNodes;
        });
      }
    },
    [onNodesChange, setNodes, setEdges, onNodesChangeProp]
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
            if (data?.status === 'completed') return '#34d399'; // emerald-400
            if (data?.status === 'available') return '#fbbf24'; // amber-400
            return '#475569'; // slate-600
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
            <div className="text-xs font-semibold text-slate-400 mb-2">Status</div>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-slate-300">
                  {nodes.filter((n) => {
                    if (n.id === CENTER_NODE_ID) return false;
                    return (n.data as unknown as SkillNodeData)?.status === 'completed';
                  }).length} Completed
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="text-slate-300">
                  {nodes.filter((n) => {
                    if (n.id === CENTER_NODE_ID) return false;
                    return (n.data as unknown as SkillNodeData)?.status === 'available';
                  }).length} Available
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-600" />
                <span className="text-slate-300">
                  {nodes.filter((n) => {
                    if (n.id === CENTER_NODE_ID) return false;
                    return (n.data as unknown as SkillNodeData)?.status === 'locked';
                  }).length} Locked
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
            <SelectedNodeDetails
              node={selectedNode}
              onTakeTest={(skill) => setTestingSkill(skill)}
            />
          </GlassPanel>
        </div>
      )}

      {/* Skill Test Modal */}
      {testingSkill && (
        <SkillTestModal
          skill={testingSkill}
          careerTitle={careerTitle}
          onClose={() => setTestingSkill(null)}
          onComplete={(progress) => {
            // Update the node's progress and recalculate all statuses
            setNodes((currentNodes) => {
              // First, update the tested skill's progress
              const updatedNodes = currentNodes.map((n) => {
                if (n.id === testingSkill.id) {
                  return {
                    ...n,
                    data: {
                      ...(n.data as SkillNodeData),
                      progress,
                      status: progress >= SKILL_PASS_THRESHOLD ? 'completed' : 'available',
                    },
                  };
                }
                return n;
              });

              // Build a progress map from updated nodes
              const progressMap = new Map<string, number>();
              updatedNodes.forEach((n) => {
                if (n.id === CENTER_NODE_ID) return;
                const data = n.data as SkillNodeData;
                progressMap.set(data.id, data.progress);
              });

              // Recalculate status for all nodes based on updated progress
              const finalNodes = updatedNodes.map((n) => {
                if (n.id === CENTER_NODE_ID) return n;
                const data = n.data as SkillNodeData;

                // Skip the just-tested skill (already updated)
                if (n.id === testingSkill.id) return n;

                // Calculate new status
                let newStatus: SkillStatus;
                if (data.progress >= SKILL_PASS_THRESHOLD) {
                  newStatus = 'completed';
                } else {
                  const prereqs = data.prerequisites || [];
                  if (prereqs.length === 0) {
                    newStatus = 'available';
                  } else {
                    // Check if all prerequisites are passed
                    const allPrereqsPassed = prereqs.every((prereqId) => {
                      const prereqProgress = progressMap.get(prereqId) || 0;
                      return prereqProgress >= SKILL_PASS_THRESHOLD;
                    });
                    newStatus = allPrereqsPassed ? 'available' : 'locked';
                  }
                }

                return {
                  ...n,
                  data: { ...data, status: newStatus },
                };
              });

              // Notify parent of progress changes
              onNodesChangeProp?.(finalNodes);

              return finalNodes;
            });
            setTestingSkill(null);
            setSelectedNode(null);
          }}
        />
      )}
    </div>
  );
});

interface SelectedNodeDetailsProps {
  node: Node;
  onTakeTest: (skill: SkillNodeData) => void;
}

function SelectedNodeDetails({ node, onTakeTest }: SelectedNodeDetailsProps) {
  const data = node.data as unknown as SkillNodeData;
  const status = data.status || 'locked';
  const isCompleted = status === 'completed';
  const isAvailable = status === 'available';
  const isLocked = status === 'locked';

  const statusConfig = {
    completed: { label: 'Completed', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    available: { label: 'Available', color: 'text-amber-400', bg: 'bg-amber-400/10' },
    locked: { label: 'Locked', color: 'text-slate-500', bg: 'bg-slate-700/50' },
  };

  const { label: statusLabel, color: statusColor, bg: statusBg } = statusConfig[status];

  const progressBarColor = isCompleted
    ? 'bg-gradient-to-r from-emerald-400 to-green-500'
    : 'bg-gradient-to-r from-amber-400 to-yellow-500';

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <span className={`text-3xl ${isLocked ? 'grayscale opacity-50' : ''}`}>{data.icon}</span>
        <div className="flex-1">
          <h3 className="font-bold text-white">{data.name}</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{data.category}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusBg} ${statusColor}`}>
              {statusLabel}
            </span>
          </div>
        </div>
      </div>

      <p className="text-sm text-slate-300 mb-3">{data.description}</p>

      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">Level {data.level}</span>
        <span className={statusColor}>{data.progress}% Complete</span>
      </div>

      <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${progressBarColor}`}
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

      {/* Action buttons - only show for available nodes */}
      {isAvailable && !isCompleted && (
        <div className="mt-4 pt-3 border-t border-slate-700 space-y-2">
          <button className="w-full py-2 px-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors text-sm">
            Start Learning
          </button>
          <button
            onClick={() => onTakeTest(data)}
            className="w-full py-2 px-4 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-semibold rounded-lg transition-colors text-sm border border-emerald-500/30"
          >
            Skill Learned
          </button>
        </div>
      )}

      {isCompleted && (
        <div className="mt-4 pt-3 border-t border-slate-700 space-y-3">
          <div className="flex items-center justify-center gap-2 text-emerald-400">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">Skill Mastered!</span>
          </div>
          <button
            onClick={() => onTakeTest(data)}
            className="w-full py-2 px-4 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium rounded-lg transition-colors text-sm"
          >
            Retake Test to Improve Score
          </button>
        </div>
      )}

      {isLocked && (
        <div className="mt-4 pt-3 border-t border-slate-700">
          <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span>Complete prerequisites to unlock</span>
          </div>
        </div>
      )}
    </div>
  );
}
