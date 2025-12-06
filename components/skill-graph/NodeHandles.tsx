'use client';

import { Handle, Position } from '@xyflow/react';

interface NodeHandlesProps {
  /** Whether to include target handles (for nodes that can receive connections) */
  includeTargets?: boolean;
  /** Custom class name for handles */
  className?: string;
}

const POSITIONS = [
  { position: Position.Top, id: 'top' },
  { position: Position.Right, id: 'right' },
  { position: Position.Bottom, id: 'bottom' },
  { position: Position.Left, id: 'left' },
] as const;

/**
 * Renders connection handles on all four sides of a node.
 * Each side has a source handle, and optionally a target handle.
 */
export function NodeHandles({
  includeTargets = true,
  className = "!bg-amber-500 !border-slate-800 !w-2 !h-2 !opacity-40"
}: NodeHandlesProps) {
  return (
    <>
      {POSITIONS.map(({ position, id }) => (
        <span key={id}>
          <Handle
            type="source"
            position={position}
            id={`${id}-source`}
            className={className}
          />
          {includeTargets && (
            <Handle
              type="target"
              position={position}
              id={`${id}-target`}
              className={className}
            />
          )}
        </span>
      ))}
    </>
  );
}
