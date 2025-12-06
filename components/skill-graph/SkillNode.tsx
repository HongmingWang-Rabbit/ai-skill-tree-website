'use client';

import { memo } from 'react';
import { NodeHandles } from './NodeHandles';

export type SkillStatus = 'locked' | 'available' | 'completed';

export interface SkillNodeData {
  id: string;
  name: string;
  description: string;
  icon: string;
  level: number;
  category: string;
  progress: number;
  prerequisites: string[];
  status?: SkillStatus;
  [key: string]: unknown;
}

interface SkillNodeProps {
  data: SkillNodeData;
  selected?: boolean;
}

const LEVEL_COLORS = [
  { max: 3, gradient: 'from-emerald-400 to-green-500' },
  { max: 6, gradient: 'from-blue-400 to-cyan-500' },
  { max: 8, gradient: 'from-purple-400 to-violet-500' },
  { max: Infinity, gradient: 'from-amber-400 to-orange-500' },
] as const;

function getLevelColor(level: number): string {
  return LEVEL_COLORS.find(({ max }) => level <= max)?.gradient || LEVEL_COLORS[0].gradient;
}

function SkillNodeComponent({ data, selected }: SkillNodeProps) {
  // Determine status: completed (100%), available (can study), or locked
  const status: SkillStatus = data.status || (
    data.progress === 100 ? 'completed' :
    data.progress > 0 || data.prerequisites?.length === 0 ? 'available' :
    'locked'
  );

  const isCompleted = status === 'completed';
  const isAvailable = status === 'available';
  const isLocked = status === 'locked';

  // Styling based on status
  const borderColor = isCompleted
    ? 'border-emerald-400'
    : isAvailable
      ? 'border-amber-400'
      : 'border-slate-600/50';

  const glowClass = isCompleted
    ? 'shadow-[0_0_20px_rgba(52,211,153,0.5)]'
    : isAvailable
      ? 'shadow-[0_0_20px_rgba(251,191,36,0.4)]'
      : '';

  const bgClass = isCompleted
    ? 'bg-slate-800'
    : isAvailable
      ? 'bg-slate-800'
      : 'bg-slate-900/60';

  const opacityClass = isLocked ? 'opacity-50' : '';

  const progressBarColor = isCompleted
    ? 'bg-gradient-to-r from-emerald-400 to-green-500'
    : 'bg-gradient-to-r from-amber-400 to-yellow-500';

  return (
    <div
      className={`
        relative p-4 rounded-xl border-2 min-w-[140px] max-w-[160px]
        transition-all duration-300 cursor-pointer
        ${borderColor} ${glowClass} ${bgClass} ${opacityClass}
        ${selected ? 'scale-110 z-10' : ''}
        hover:scale-105 hover:z-10 hover:opacity-100
      `}
    >
      <NodeHandles />

      <div className="text-center">
        <div className={`text-3xl mb-2 drop-shadow-lg ${isLocked ? 'grayscale' : ''}`}>
          {data.icon}
        </div>

        <div className={`font-bold text-sm mb-1 leading-tight ${isLocked ? 'text-slate-400' : 'text-white'}`}>
          {data.name}
        </div>

        <div
          className={`
            inline-block px-2 py-0.5 rounded-full text-xs font-semibold
            ${isLocked ? 'bg-slate-700 text-slate-400' : `bg-gradient-to-r ${getLevelColor(data.level)} text-white`}
          `}
        >
          Lvl {data.level}
        </div>

        <div className="text-xs text-slate-400 mt-1 truncate">
          {data.category}
        </div>

        <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${progressBarColor}`}
            style={{ width: `${data.progress}%` }}
          />
        </div>

        <div className={`text-xs mt-1 ${isLocked ? 'text-slate-600' : 'text-slate-500'}`}>
          {isLocked ? 'Locked' : `${data.progress}% Complete`}
        </div>
      </div>

      {isCompleted && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center text-xs text-slate-900 font-bold">
          ✓
        </div>
      )}

      {isAvailable && !isCompleted && data.progress === 0 && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-slate-900 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
}

export const SkillNode = memo(SkillNodeComponent);
