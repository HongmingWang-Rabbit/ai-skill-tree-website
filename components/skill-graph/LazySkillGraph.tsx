'use client';

import dynamic from 'next/dynamic';
import { forwardRef, Suspense } from 'react';
import { SkillGraphSkeleton } from './SkillGraphSkeleton';
import type { SkillGraphHandle } from './SkillGraph';
import type { Node, Edge } from '@xyflow/react';

// Dynamically import the heavy SkillGraph component
// This reduces initial bundle size by ~100KB (React Flow)
const DynamicSkillGraph = dynamic(
  () => import('./SkillGraph').then((mod) => mod.SkillGraph),
  {
    ssr: false,
    loading: () => <SkillGraphSkeleton />,
  }
);

interface LazySkillGraphProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  careerTitle?: string;
  careerDescription?: string;
  onNodeClick?: (node: Node) => void;
  onNodesChange?: (nodes: Node[]) => void;
  readOnly?: boolean;
}

export const LazySkillGraph = forwardRef<SkillGraphHandle, LazySkillGraphProps>(
  function LazySkillGraphInner(props, ref) {
    return (
      <Suspense fallback={<SkillGraphSkeleton />}>
        <DynamicSkillGraph {...props} ref={ref} />
      </Suspense>
    );
  }
);

// Re-export types for convenience
export type { SkillGraphHandle, NodePositionInfo } from './SkillGraph';
