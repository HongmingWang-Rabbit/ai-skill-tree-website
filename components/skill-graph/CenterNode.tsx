'use client';

import { memo } from 'react';
import { NodeHandles } from './NodeHandles';
import { LAYOUT_CONFIG } from './constants';

const {
  CENTER_NODE_SIZE,
  CENTER_NODE_MAX_SIZE,
  CENTER_NODE_TITLE_THRESHOLD,
  CENTER_NODE_GROWTH_FACTOR,
  CENTER_NODE_CONTENT_PADDING,
  CENTER_NODE_FONT_SIZE_SMALL_THRESHOLD,
  CENTER_NODE_FONT_SIZE_MEDIUM_THRESHOLD,
} = LAYOUT_CONFIG;

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
  // Calculate dynamic size based on title length
  const titleLength = data.title.length;
  // Increase size for longer titles
  const dynamicSize = Math.max(
    CENTER_NODE_SIZE,
    CENTER_NODE_SIZE + Math.max(0, titleLength - CENTER_NODE_TITLE_THRESHOLD) * CENTER_NODE_GROWTH_FACTOR
  );
  // Cap at maximum size
  const size = Math.min(dynamicSize, CENTER_NODE_MAX_SIZE);
  const contentMaxWidth = size - CENTER_NODE_CONTENT_PADDING;

  return (
    <div
      className={`
        relative flex items-center justify-center
        rounded-full
        bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800
        border-4 border-amber-500/60
        shadow-[0_0_60px_rgba(201,162,39,0.4),inset_0_0_30px_rgba(0,0,0,0.5)]
        transition-all duration-300 cursor-pointer
        ${selected ? 'scale-110 border-amber-400' : ''}
        hover:scale-105 hover:border-amber-400
      `}
      style={{ width: size, height: size }}
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
      <div className="text-center px-6 py-4 flex flex-col items-center justify-center h-full">
        <h2
          className="font-bold text-amber-100 mb-1 drop-shadow-lg leading-tight"
          style={{
            fontSize: titleLength > CENTER_NODE_FONT_SIZE_SMALL_THRESHOLD
              ? '0.875rem'
              : titleLength > CENTER_NODE_FONT_SIZE_MEDIUM_THRESHOLD
                ? '1rem'
                : '1.25rem',
            maxWidth: contentMaxWidth,
          }}
        >
          {data.title}
        </h2>
        <div
          className="text-xs text-amber-300/70 line-clamp-2"
          style={{ maxWidth: contentMaxWidth }}
        >
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
