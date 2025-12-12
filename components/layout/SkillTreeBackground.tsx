'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { useMouse } from '@/hooks/useMouse';

interface Node {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  layer: number;
  floatOffset: number;
  floatSpeed: number;
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
  const { x: mouseX, y: mouseY } = useMouse();

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { nodes, lines } = useMemo(() => {
    if (dimensions.width === 0 || dimensions.height === 0) {
      return { nodes: [], lines: [] };
    }

    const { width, height } = dimensions;
    const centerX = width / 2;
    const centerY = height / 2;

    // Create grid-based distribution with organic variation
    const gridCols = Math.ceil(width / 150);
    const gridRows = Math.ceil(height / 150);
    const cellWidth = width / gridCols;
    const cellHeight = height / gridRows;

    const generatedNodes: Node[] = [];
    let nodeId = 0;

    // Color palette matching the dark theme
    const colors = [
      '#A78BFA', // Purple (primary)
      '#34D399', // Emerald
      '#60A5FA', // Blue
      '#FBBF24', // Amber
      '#F472B6', // Pink
    ];

    // Generate main center node (focal point)
    generatedNodes.push({
      id: nodeId++,
      x: centerX,
      y: centerY,
      size: 6,
      color: '#A78BFA',
      layer: 3,
      floatOffset: 0,
      floatSpeed: 0.5,
    });

    // Generate nodes in a grid pattern with organic variation
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const seed = row * gridCols + col + 1;

        // Skip some cells for organic feel (30% skip rate)
        if (seededRandom(seed * 7) < 0.3) continue;

        // Base position with random offset
        const baseX = col * cellWidth + cellWidth / 2;
        const baseY = row * cellHeight + cellHeight / 2;
        const offsetX = (seededRandom(seed * 3) - 0.5) * cellWidth * 0.7;
        const offsetY = (seededRandom(seed * 5) - 0.5) * cellHeight * 0.7;

        const x = baseX + offsetX;
        const y = baseY + offsetY;

        // Distance from center affects properties
        const distFromCenter = Math.hypot(x - centerX, y - centerY);
        const maxDist = Math.hypot(width / 2, height / 2);
        const normalizedDist = distFromCenter / maxDist;

        // Determine layer (depth) based on distance and randomness
        const layerRandom = seededRandom(seed * 11);
        const layer = normalizedDist < 0.3 ? 3 : normalizedDist < 0.6 ? (layerRandom > 0.5 ? 2 : 3) : (layerRandom > 0.7 ? 2 : 1);

        // Size based on layer
        const baseSize = layer === 3 ? 4 : layer === 2 ? 3 : 2;
        const sizeVariation = seededRandom(seed * 13) * 2;

        generatedNodes.push({
          id: nodeId++,
          x,
          y,
          size: baseSize + sizeVariation,
          color: colors[Math.floor(seededRandom(seed * 17) * colors.length)],
          layer,
          floatOffset: seededRandom(seed * 19) * Math.PI * 2,
          floatSpeed: 0.3 + seededRandom(seed * 23) * 0.4,
        });
      }
    }

    // Add some extra nodes near the center for density
    const centerNodeCount = 8;
    for (let i = 0; i < centerNodeCount; i++) {
      const seed = 1000 + i;
      const angle = (i / centerNodeCount) * Math.PI * 2;
      const radius = 80 + seededRandom(seed * 29) * 120;

      generatedNodes.push({
        id: nodeId++,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        size: 3 + seededRandom(seed * 31) * 3,
        color: colors[Math.floor(seededRandom(seed * 37) * colors.length)],
        layer: 3,
        floatOffset: seededRandom(seed * 41) * Math.PI * 2,
        floatSpeed: 0.4 + seededRandom(seed * 43) * 0.3,
      });
    }

    // Generate connections between nearby nodes
    const generatedLines: Line[] = [];
    const maxConnectionDist = 180;

    for (let i = 0; i < generatedNodes.length; i++) {
      const node1 = generatedNodes[i];

      // Find nearby nodes
      const nearbyNodes = generatedNodes
        .filter((node2, j) => {
          if (i >= j) return false; // Avoid duplicate lines
          const dist = Math.hypot(node1.x - node2.x, node1.y - node2.y);
          return dist < maxConnectionDist;
        })
        .sort((a, b) => {
          const distA = Math.hypot(node1.x - a.x, node1.y - a.y);
          const distB = Math.hypot(node1.x - b.x, node1.y - b.y);
          return distA - distB;
        })
        .slice(0, 3); // Max 3 connections per node

      nearbyNodes.forEach((node2) => {
        const dist = Math.hypot(node1.x - node2.x, node1.y - node2.y);
        // Opacity based on distance (closer = more visible)
        const opacity = Math.max(0.1, 1 - dist / maxConnectionDist) * 0.6;

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
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className="absolute inset-0"
      >
        {/* Gradient definitions for glow effects */}
        <defs>
          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Connection lines */}
        <g opacity="0.3">
          {lines.map((line, index) => (
            <motion.line
              key={line.id}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="#A78BFA"
              strokeWidth="0.5"
              opacity={line.opacity}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: line.opacity }}
              transition={{
                duration: 1.5,
                delay: index * 0.01,
                ease: 'easeOut',
              }}
            />
          ))}
        </g>

        {/* Nodes by layer (back to front) */}
        {[1, 2, 3].map((layer) => (
          <g key={layer} opacity={layer === 1 ? 0.2 : layer === 2 ? 0.4 : 0.6}>
            {nodes
              .filter((node) => node.layer === layer)
              .map((node) => {
                // Calculate mouse interaction
                const hasMousePos = mouseX !== null && mouseY !== null;
                const distance = hasMousePos
                  ? Math.hypot(node.x - mouseX!, node.y - mouseY!)
                  : Infinity;

                // Subtle attraction effect (max 10px when very close)
                const attractionStrength = Math.max(0, 1 - distance / 300);
                const angle = hasMousePos
                  ? Math.atan2(mouseY! - node.y, mouseX! - node.x)
                  : 0;
                const attractX = attractionStrength * 10 * Math.cos(angle);
                const attractY = attractionStrength * 10 * Math.sin(angle);

                // Scale up slightly when mouse is near
                const scale = 1 + attractionStrength * 0.3;

                return (
                  <motion.g key={node.id}>
                    {/* Glow effect */}
                    <motion.circle
                      cx={node.x}
                      cy={node.y}
                      r={node.size * 3}
                      fill={node.color}
                      opacity={0.1}
                      initial={{ scale: 0 }}
                      animate={{
                        scale: [1, 1.2, 1],
                        translateX: attractX,
                        translateY: attractY,
                      }}
                      transition={{
                        scale: {
                          duration: 3 + node.floatSpeed,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          delay: node.floatOffset,
                        },
                        translateX: { type: 'spring', stiffness: 100, damping: 15 },
                        translateY: { type: 'spring', stiffness: 100, damping: 15 },
                      }}
                    />
                    {/* Main node */}
                    <motion.circle
                      cx={node.x}
                      cy={node.y}
                      r={node.size}
                      fill={node.color}
                      filter={layer === 3 ? 'url(#glow)' : undefined}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{
                        scale: scale,
                        opacity: 1,
                        translateX: attractX,
                        translateY: attractY,
                      }}
                      transition={{
                        scale: { type: 'spring', stiffness: 150, damping: 15 },
                        opacity: { duration: 0.5, delay: node.id * 0.02 },
                        translateX: { type: 'spring', stiffness: 100, damping: 15 },
                        translateY: { type: 'spring', stiffness: 100, damping: 15 },
                      }}
                    />
                  </motion.g>
                );
              })}
          </g>
        ))}
      </svg>

      {/* Subtle radial gradient overlay for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, transparent 0%, rgba(15, 23, 42, 0.3) 70%, rgba(15, 23, 42, 0.6) 100%)`,
        }}
      />
    </div>
  );
};

export default SkillTreeBackground;
