'use client';

import { memo } from 'react';
import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react';

function SkillEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.3,
  });

  return (
    <>
      {/* Glow effect layer */}
      <BaseEdge
        id={`${id}-glow`}
        path={edgePath}
        style={{
          strokeWidth: 6,
          stroke: 'rgba(180, 130, 70, 0.3)',
          filter: 'blur(3px)',
        }}
      />
      {/* Main edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: 2,
          stroke: 'url(#edge-gradient-gold)',
        }}
      />
    </>
  );
}

export const SkillEdge = memo(SkillEdgeComponent);

export function EdgeGradientDefs() {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs>
        {/* Original cyan-purple gradient (kept for compatibility) */}
        <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00f0ff" />
          <stop offset="100%" stopColor="#bf00ff" />
        </linearGradient>
        {/* New golden/bronze gradient for POE aesthetic */}
        <linearGradient id="edge-gradient-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B6914" />
          <stop offset="30%" stopColor="#C9A227" />
          <stop offset="50%" stopColor="#E8D5A3" />
          <stop offset="70%" stopColor="#C9A227" />
          <stop offset="100%" stopColor="#8B6914" />
        </linearGradient>
        {/* Animated gradient for special edges */}
        <linearGradient id="edge-gradient-animated" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#C9A227">
            <animate attributeName="stop-color" values="#C9A227;#E8D5A3;#C9A227" dur="2s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="#E8D5A3">
            <animate attributeName="stop-color" values="#E8D5A3;#C9A227;#E8D5A3" dur="2s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="#C9A227">
            <animate attributeName="stop-color" values="#C9A227;#E8D5A3;#C9A227" dur="2s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
    </svg>
  );
}
