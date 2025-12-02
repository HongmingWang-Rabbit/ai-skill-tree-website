'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

export interface SkillNodeData {
  id: string;
  name: string;
  description: string;
  icon: string;
  level: number;
  category: string;
  progress: number;
  prerequisites: string[];
  [key: string]: unknown; // Index signature for React Flow compatibility
}

interface SkillNodeProps {
  data: SkillNodeData;
  selected?: boolean;
}

function SkillNodeComponent({ data, selected }: SkillNodeProps) {
  const isUnlocked = data.progress > 0;
  const isMastered = data.progress === 100;

  const getLevelColor = (level: number) => {
    if (level <= 3) return 'from-green-400 to-emerald-500';
    if (level <= 6) return 'from-blue-400 to-cyan-500';
    if (level <= 8) return 'from-purple-400 to-violet-500';
    return 'from-amber-400 to-orange-500';
  };

  const getBorderColor = () => {
    if (isMastered) return 'border-amber-400';
    if (isUnlocked) return 'border-cyan-400';
    return 'border-slate-600';
  };

  const getGlowClass = () => {
    if (isMastered) return 'shadow-[0_0_20px_rgba(251,191,36,0.5)]';
    if (isUnlocked) return 'shadow-[0_0_20px_rgba(0,240,255,0.5)]';
    return '';
  };

  return (
    <div
      className={`
        relative p-4 rounded-xl border-2 min-w-[140px] max-w-[160px]
        transition-all duration-300 cursor-pointer
        ${getBorderColor()}
        ${getGlowClass()}
        ${selected ? 'scale-110 z-10' : ''}
        ${isUnlocked ? 'bg-slate-800' : 'bg-slate-900 opacity-70'}
        hover:scale-105 hover:z-10
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-cyan-400 !border-slate-800 !w-3 !h-3"
      />

      <div className="text-center">
        {/* Icon */}
        <div className="text-3xl mb-2 drop-shadow-lg">{data.icon}</div>

        {/* Name */}
        <div className="font-bold text-white text-sm mb-1 leading-tight">
          {data.name}
        </div>

        {/* Level badge */}
        <div
          className={`
            inline-block px-2 py-0.5 rounded-full text-xs font-semibold
            bg-gradient-to-r ${getLevelColor(data.level)} text-white
          `}
        >
          Lvl {data.level}
        </div>

        {/* Category */}
        <div className="text-xs text-slate-400 mt-1 truncate">
          {data.category}
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`
              h-full transition-all duration-500
              ${isMastered
                ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                : 'bg-gradient-to-r from-cyan-400 to-purple-500'}
            `}
            style={{ width: `${data.progress}%` }}
          />
        </div>

        {/* Progress text */}
        <div className="text-xs text-slate-500 mt-1">
          {data.progress}% Complete
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-purple-400 !border-slate-800 !w-3 !h-3"
      />

      {/* Mastered indicator */}
      {isMastered && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center text-xs">
          ✓
        </div>
      )}
    </div>
  );
}

export const SkillNode = memo(SkillNodeComponent);
