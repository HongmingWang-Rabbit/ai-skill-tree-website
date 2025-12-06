'use client';

import { memo } from 'react';
import { NodeHandles } from './NodeHandles';

export interface SkillNodeData {
  id: string;
  name: string;
  description: string;
  icon: string;
  level: number;
  category: string;
  progress: number;
  prerequisites: string[];
  [key: string]: unknown;
}

interface SkillNodeProps {
  data: SkillNodeData;
  selected?: boolean;
}

const LEVEL_COLORS = [
  { max: 3, gradient: 'from-green-400 to-emerald-500' },
  { max: 6, gradient: 'from-blue-400 to-cyan-500' },
  { max: 8, gradient: 'from-purple-400 to-violet-500' },
  { max: Infinity, gradient: 'from-amber-400 to-orange-500' },
] as const;

function getLevelColor(level: number): string {
  return LEVEL_COLORS.find(({ max }) => level <= max)?.gradient || LEVEL_COLORS[0].gradient;
}

function SkillNodeComponent({ data, selected }: SkillNodeProps) {
  const isUnlocked = data.progress > 0;
  const isMastered = data.progress === 100;

  const borderColor = isMastered
    ? 'border-amber-400'
    : isUnlocked
      ? 'border-cyan-400'
      : 'border-slate-600';

  const glowClass = isMastered
    ? 'shadow-[0_0_20px_rgba(251,191,36,0.5)]'
    : isUnlocked
      ? 'shadow-[0_0_20px_rgba(0,240,255,0.5)]'
      : '';

  const progressBarColor = isMastered
    ? 'bg-gradient-to-r from-amber-400 to-orange-500'
    : 'bg-gradient-to-r from-cyan-400 to-purple-500';

  return (
    <div
      className={`
        relative p-4 rounded-xl border-2 min-w-[140px] max-w-[160px]
        transition-all duration-300 cursor-pointer
        ${borderColor} ${glowClass}
        ${selected ? 'scale-110 z-10' : ''}
        ${isUnlocked ? 'bg-slate-800' : 'bg-slate-900 opacity-70'}
        hover:scale-105 hover:z-10
      `}
    >
      <NodeHandles />

      <div className="text-center">
        <div className="text-3xl mb-2 drop-shadow-lg">{data.icon}</div>

        <div className="font-bold text-white text-sm mb-1 leading-tight">
          {data.name}
        </div>

        <div
          className={`
            inline-block px-2 py-0.5 rounded-full text-xs font-semibold
            bg-gradient-to-r ${getLevelColor(data.level)} text-white
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

        <div className="text-xs text-slate-500 mt-1">
          {data.progress}% Complete
        </div>
      </div>

      {isMastered && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center text-xs">
          ✓
        </div>
      )}
    </div>
  );
}

export const SkillNode = memo(SkillNodeComponent);
