'use client';

import { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  BackgroundVariant,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { SKILL_PASS_THRESHOLD, MASTER_GRAPH_CONFIG } from '@/lib/constants';

// Types
interface SkillData {
  id: string;
  name: string;
  icon: string;
  level: number;
  category: string;
  progress: number;
}

interface CareerWithSkills {
  id: string;
  careerId: string;
  title: string;
  skills: SkillData[];
}

interface MasterSkillGraphProps {
  userName: string;
  careers: CareerWithSkills[];
  onCareerClick?: (careerId: string) => void;
}

// Custom node components
function UserCenterNode({ data }: { data: { label: string; progress: number } }) {
  return (
    <div className="flex items-center justify-center w-[140px] h-[140px] rounded-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 border-4 border-amber-500/60 shadow-[0_0_40px_rgba(201,162,39,0.4)]">
      <div className="text-center px-2">
        <div className="text-3xl mb-1">👤</div>
        <div className="text-sm font-bold text-amber-100 truncate max-w-[100px]">{data.label}</div>
        <div className="text-xs text-amber-300/70 mt-1">{data.progress}% mastery</div>
      </div>
    </div>
  );
}

function CareerNode({ data }: { data: { label: string; icon: string; skillCount: number; progress: number; color: string } }) {
  return (
    <div
      className={`flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 border-2 ${data.color} shadow-lg min-w-[120px] cursor-pointer hover:scale-105 transition-transform`}
    >
      <div className="text-2xl">{data.icon}</div>
      <div>
        <div className="text-sm font-semibold text-white truncate max-w-[100px]">{data.label}</div>
        <div className="text-xs text-slate-400">{data.skillCount} skills • {data.progress}%</div>
      </div>
    </div>
  );
}

function MiniSkillNode({ data }: { data: { label: string; icon: string; progress: number } }) {
  const isCompleted = data.progress >= SKILL_PASS_THRESHOLD;
  const isInProgress = data.progress > 0 && !isCompleted;

  return (
    <div
      className={`
        flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs
        ${isCompleted ? 'bg-emerald-900/50 border border-emerald-500/50' :
          isInProgress ? 'bg-amber-900/30 border border-amber-500/30' :
          'bg-slate-800/50 border border-slate-700/50'}
        hover:scale-110 transition-transform cursor-default
      `}
    >
      <span>{data.icon}</span>
      <span className={`truncate max-w-[80px] ${isCompleted ? 'text-emerald-300' : isInProgress ? 'text-amber-300' : 'text-slate-400'}`}>
        {data.label}
      </span>
    </div>
  );
}

const nodeTypes = {
  userCenter: UserCenterNode,
  career: CareerNode,
  miniSkill: MiniSkillNode,
};

// Career colors for visual distinction
const CAREER_COLORS = [
  'border-blue-500/60',
  'border-purple-500/60',
  'border-cyan-500/60',
  'border-pink-500/60',
  'border-green-500/60',
  'border-orange-500/60',
];

// Career icons (fallback if not provided)
const CAREER_ICONS = ['💼', '🎯', '🚀', '⚡', '🔮', '🎨'];

export function MasterSkillGraph({ userName, careers, onCareerClick }: MasterSkillGraphProps) {
  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Calculate overall progress
    const totalSkills = careers.reduce((sum, c) => sum + c.skills.length, 0);
    const masteredSkills = careers.reduce((sum, c) =>
      sum + c.skills.filter(s => s.progress >= SKILL_PASS_THRESHOLD).length, 0);
    const overallProgress = totalSkills > 0 ? Math.round((masteredSkills / totalSkills) * 100) : 0;

    const {
      centerNodeSize,
      careerRadius,
      careerNodeWidth,
      careerNodeHeight,
      skillRadius,
      skillNodeWidth,
      skillNodeHeight,
      maxDisplayedSkillsPerCareer,
      edgeColors,
    } = MASTER_GRAPH_CONFIG;

    // Center user node (offset by half node size to center it at origin)
    nodes.push({
      id: 'user-center',
      type: 'userCenter',
      position: { x: -centerNodeSize / 2, y: -centerNodeSize / 2 },
      data: { label: userName, progress: overallProgress },
      draggable: false,
    });

    // Position careers in a circle around center
    const angleStep = (2 * Math.PI) / Math.max(careers.length, 1);

    careers.forEach((career, careerIndex) => {
      const angle = careerIndex * angleStep - Math.PI / 2; // Start from top
      const careerX = Math.cos(angle) * careerRadius;
      const careerY = Math.sin(angle) * careerRadius;

      // Calculate career progress
      const careerMastered = career.skills.filter(s => s.progress >= SKILL_PASS_THRESHOLD).length;
      const careerProgress = career.skills.length > 0
        ? Math.round((careerMastered / career.skills.length) * 100)
        : 0;

      // Career node (offset to center the node at the calculated position)
      const careerNodeId = `career-${career.id}`;
      nodes.push({
        id: careerNodeId,
        type: 'career',
        position: { x: careerX - careerNodeWidth / 2, y: careerY - careerNodeHeight / 2 },
        data: {
          label: career.title,
          icon: CAREER_ICONS[careerIndex % CAREER_ICONS.length],
          skillCount: career.skills.length,
          progress: careerProgress,
          color: CAREER_COLORS[careerIndex % CAREER_COLORS.length],
        },
        draggable: false,
      });

      // Edge from center to career
      edges.push({
        id: `edge-center-${career.id}`,
        source: 'user-center',
        target: careerNodeId,
        type: 'default',
        style: { stroke: edgeColors.default, strokeWidth: 2 },
        animated: careerProgress > 0,
      });

      // Position skills around each career
      const skillAngleStep = (2 * Math.PI) / Math.max(career.skills.length, 1);
      const baseAngle = angle; // Skills fan out from career's direction

      // Limit displayed skills for performance
      const displayedSkills = career.skills.slice(0, maxDisplayedSkillsPerCareer);

      displayedSkills.forEach((skill, skillIndex) => {
        const skillAngle = baseAngle + (skillIndex - displayedSkills.length / 2) * (skillAngleStep * 0.6);
        const skillX = careerX + Math.cos(skillAngle) * skillRadius;
        const skillY = careerY + Math.sin(skillAngle) * skillRadius;

        const skillNodeId = `skill-${skill.id}`;
        nodes.push({
          id: skillNodeId,
          type: 'miniSkill',
          position: { x: skillX - skillNodeWidth / 2, y: skillY - skillNodeHeight / 2 },
          data: {
            label: skill.name,
            icon: skill.icon,
            progress: skill.progress,
          },
          draggable: false,
          sourcePosition: Position.Left,
          targetPosition: Position.Right,
        });

        // Edge from career to skill
        const edgeColor = skill.progress >= SKILL_PASS_THRESHOLD
          ? edgeColors.mastered
          : skill.progress > 0
            ? edgeColors.inProgress
            : edgeColors.notStarted;

        edges.push({
          id: `edge-${career.id}-${skill.id}`,
          source: careerNodeId,
          target: skillNodeId,
          type: 'default',
          style: { stroke: edgeColor, strokeWidth: 1 },
        });
      });
    });

    return { nodes, edges };
  }, [userName, careers]);

  if (careers.length === 0) {
    return null;
  }

  return (
    <div className="w-full h-[500px] bg-slate-900/30 rounded-xl border border-slate-800">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2, includeHiddenNodes: false }}
        minZoom={0.2}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={true}
        zoomOnScroll={true}
        onNodeClick={(_, node) => {
          if (node.id.startsWith('career-') && onCareerClick) {
            const careerId = node.id.replace('career-', '');
            onCareerClick(careerId);
          }
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#334155" />
        <Controls showInteractive={false} className="!bg-slate-800 !border-slate-700" />
      </ReactFlow>
    </div>
  );
}
