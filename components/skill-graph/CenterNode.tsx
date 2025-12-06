'use client';

import { memo } from 'react';
import { NodeHandles } from './NodeHandles';

export interface CenterNodeData {
  title: string;
  description: string;
  progress: number;
  [key: string]: unknown;
}

interface CenterNodeProps {
  data: CenterNodeData;
  selected?: boolean;
}

function CenterNodeComponent({ data, selected }: CenterNodeProps) {
  return (
    <div
      className={`
        relative flex items-center justify-center
        w-[200px] h-[200px] rounded-full
        bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800
        border-4 border-amber-500/60
        shadow-[0_0_60px_rgba(201,162,39,0.4),inset_0_0_30px_rgba(0,0,0,0.5)]
        transition-all duration-300 cursor-pointer
        ${selected ? 'scale-110 border-amber-400' : ''}
        hover:scale-105 hover:border-amber-400
      `}
    >
      {/* Decorative rings */}
      <div className="absolute inset-[-12px] rounded-full border-2 border-amber-600/30 pointer-events-none" />
      <div className="absolute inset-[-24px] rounded-full border border-amber-700/20 pointer-events-none" />

      {/* Source handles only - center node is always the origin */}
      <NodeHandles
        includeTargets={false}
        className="!bg-amber-500 !border-amber-700 !w-3 !h-3"
      />

      {/* Content */}
      <div className="text-center px-4">
        <h2 className="text-xl font-bold text-amber-100 mb-1 drop-shadow-lg">
          {data.title}
        </h2>
        <div className="text-xs text-amber-300/70 line-clamp-2">
          {data.description}
        </div>

        {/* Progress ring */}
        <div className="mt-3 flex justify-center">
          <div className="relative w-12 h-12">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="rgba(0,0,0,0.3)"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="url(#center-progress-gradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${data.progress * 0.94} 100`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-amber-200">{data.progress}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* SVG gradient definition */}
      <svg className="absolute w-0 h-0">
        <defs>
          <linearGradient id="center-progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C9A227" />
            <stop offset="100%" stopColor="#E8D5A3" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export const CenterNode = memo(CenterNodeComponent);
