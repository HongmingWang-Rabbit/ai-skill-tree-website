'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { BACKGROUND_CONFIG } from '@/lib/constants';

interface Node {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
  animationDelay: number;
}

interface Line {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  opacity: number;
}

// Seeded random for consistent generation
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const SkillTreeBackground = () => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const nodesRef = useRef<SVGGElement>(null);
  const mousePos = useRef({ x: -1000, y: -1000 });
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Throttled mouse handler using RAF
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Animation loop for mouse interaction
  useEffect(() => {
    if (!nodesRef.current) return;

    const animate = () => {
      const nodeElements = nodesRef.current?.querySelectorAll('.interactive-node');
      if (nodeElements) {
        nodeElements.forEach((node) => {
          const el = node as SVGCircleElement;
          const baseX = parseFloat(el.dataset.x || '0');
          const baseY = parseFloat(el.dataset.y || '0');
          const { x: mx, y: my } = mousePos.current;

          const distance = Math.hypot(baseX - mx, baseY - my);
          const maxDist = BACKGROUND_CONFIG.MOUSE_INTERACTION_RADIUS;

          if (distance < maxDist) {
            const strength = (1 - distance / maxDist) * BACKGROUND_CONFIG.MOUSE_ATTRACTION_STRENGTH;
            const angle = Math.atan2(my - baseY, mx - baseX);
            const offsetX = Math.cos(angle) * strength;
            const offsetY = Math.sin(angle) * strength;
            const scale = 1 + (1 - distance / maxDist) * BACKGROUND_CONFIG.MOUSE_SCALE_FACTOR;

            el.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
          } else {
            el.style.transform = 'translate(0, 0) scale(1)';
          }
        });
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [dimensions]);

  const { nodes, lines } = useMemo(() => {
    if (dimensions.width === 0 || dimensions.height === 0) {
      return { nodes: [], lines: [] };
    }

    const { width, height } = dimensions;
    const centerX = width / 2;
    const centerY = height / 2;

    // Sparser grid for better performance
    const gridCols = Math.ceil(width / BACKGROUND_CONFIG.GRID_CELL_SIZE);
    const gridRows = Math.ceil(height / BACKGROUND_CONFIG.GRID_CELL_SIZE);
    const cellWidth = width / gridCols;
    const cellHeight = height / gridRows;

    const generatedNodes: Node[] = [];
    let nodeId = 0;

    // Color palette from config
    const colors = BACKGROUND_CONFIG.COLORS;

    // Center node
    generatedNodes.push({
      id: nodeId++,
      x: centerX,
      y: centerY,
      size: 5,
      color: '#A78BFA',
      opacity: 0.7,
      animationDelay: 0,
    });

    // Grid nodes with organic variation
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const seed = row * gridCols + col + 1;

        // Skip nodes for sparser look
        if (seededRandom(seed * 7) < BACKGROUND_CONFIG.NODE_SKIP_RATE) continue;

        const baseX = col * cellWidth + cellWidth / 2;
        const baseY = row * cellHeight + cellHeight / 2;
        const offsetX = (seededRandom(seed * 3) - 0.5) * cellWidth * 0.6;
        const offsetY = (seededRandom(seed * 5) - 0.5) * cellHeight * 0.6;

        const x = baseX + offsetX;
        const y = baseY + offsetY;

        const distFromCenter = Math.hypot(x - centerX, y - centerY);
        const maxDist = Math.hypot(width / 2, height / 2);
        const normalizedDist = distFromCenter / maxDist;

        // Opacity based on distance from center
        const opacity = Math.max(0.15, 0.6 - normalizedDist * 0.5);
        const size = 2 + seededRandom(seed * 13) * 3;

        generatedNodes.push({
          id: nodeId++,
          x,
          y,
          size,
          color: colors[Math.floor(seededRandom(seed * 17) * colors.length)],
          opacity,
          animationDelay: seededRandom(seed * 19) * 2,
        });
      }
    }

    // Extra center cluster
    for (let i = 0; i < BACKGROUND_CONFIG.CENTER_CLUSTER_COUNT; i++) {
      const seed = 1000 + i;
      const angle = (i / BACKGROUND_CONFIG.CENTER_CLUSTER_COUNT) * Math.PI * 2;
      const radius = 60 + seededRandom(seed * 29) * 100;

      generatedNodes.push({
        id: nodeId++,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        size: 3 + seededRandom(seed * 31) * 2,
        color: colors[Math.floor(seededRandom(seed * 37) * colors.length)],
        opacity: 0.5,
        animationDelay: seededRandom(seed * 41) * 2,
      });
    }

    // Generate connections
    const generatedLines: Line[] = [];
    const maxConnectionDist = BACKGROUND_CONFIG.MAX_CONNECTION_DISTANCE;

    for (let i = 0; i < generatedNodes.length; i++) {
      const node1 = generatedNodes[i];
      const nearbyNodes = generatedNodes
        .filter((node2, j) => {
          if (i >= j) return false;
          const dist = Math.hypot(node1.x - node2.x, node1.y - node2.y);
          return dist < maxConnectionDist;
        })
        .sort((a, b) => {
          const distA = Math.hypot(node1.x - a.x, node1.y - a.y);
          const distB = Math.hypot(node1.x - b.x, node1.y - b.y);
          return distA - distB;
        })
        .slice(0, BACKGROUND_CONFIG.MAX_CONNECTIONS_PER_NODE);

      nearbyNodes.forEach((node2) => {
        const dist = Math.hypot(node1.x - node2.x, node1.y - node2.y);
        const opacity = Math.max(0.05, (1 - dist / maxConnectionDist) * 0.3);

        generatedLines.push({
          id: `${node1.id}-${node2.id}`,
          x1: node1.x,
          y1: node1.y,
          x2: node2.x,
          y2: node2.y,
          opacity,
        });
      });
    }

    return { nodes: generatedNodes, lines: generatedLines };
  }, [dimensions]);

  if (dimensions.width === 0 || dimensions.height === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Static lines */}
        <g className="lines">
          {lines.map((line) => (
            <line
              key={line.id}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="#A78BFA"
              strokeWidth="0.5"
              opacity={line.opacity}
              className="animate-fade-in"
            />
          ))}
        </g>

        {/* Nodes with CSS animations */}
        <g ref={nodesRef} className="nodes">
          {nodes.map((node) => (
            <circle
              key={node.id}
              className="interactive-node"
              cx={node.x}
              cy={node.y}
              r={node.size}
              fill={node.color}
              opacity={node.opacity}
              filter={node.opacity > 0.4 ? 'url(#glow)' : undefined}
              data-x={node.x}
              data-y={node.y}
              style={{
                transformOrigin: `${node.x}px ${node.y}px`,
                transition: 'transform 0.15s ease-out',
                animation: `pulse ${3 + node.animationDelay}s ease-in-out infinite`,
                animationDelay: `${node.animationDelay}s`,
              }}
            />
          ))}
        </g>
      </svg>

      {/* Depth gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, transparent 0%, rgba(15, 23, 42, 0.4) 70%, rgba(15, 23, 42, 0.7) 100%)`,
        }}
      />

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: var(--base-opacity, 0.5); }
          50% { opacity: calc(var(--base-opacity, 0.5) * 1.3); }
        }
        .animate-fade-in {
          animation: fadeIn 1s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: var(--line-opacity, 0.2); }
        }
      `}</style>
    </div>
  );
};

export default SkillTreeBackground;
