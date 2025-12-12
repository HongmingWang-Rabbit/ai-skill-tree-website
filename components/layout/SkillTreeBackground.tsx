'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useMouse } from '@/hooks/useMouse';

const SkillTreeBackground = () => {
  const [nodes, setNodes] = useState<any[]>([]);
  const [lines, setLines] = useState<any[]>([]);
  const { x, y } = useMouse();

  useEffect(() => {
    const numNodes = 20;
    const newNodes = Array.from({ length: numNodes }).map((_, i) => ({
      id: i,
      x: Math.random() * 2000,
      y: Math.random() * 2000,
      size: i < 5 ? Math.random() * 10 + 10 : Math.random() * 3 + 2,
      color: i < 5 ? '#FFD700' : ['#FFFFFF', '#00FF00', '#FFFF00'][Math.floor(Math.random() * 3)],
    }));
    setNodes(newNodes);

    const newLines = newNodes.flatMap((node1) => {
      const neighbors = newNodes
        .filter((node2) => node1.id !== node2.id)
        .sort((a, b) => {
          const distA = Math.hypot(a.x - node1.x, a.y - node1.y);
          const distB = Math.hypot(b.x - node1.x, b.y - node1.y);
          return distA - distB;
        })
        .slice(0, 2);

      return neighbors.map((node2) => ({
        id: `${node1.id}-${node2.id}`,
        x1: node1.x,
        y1: node1.y,
        x2: node2.x,
        y2: node2.y,
      }));
    });
    setLines(newLines);
  }, []);

  return (
    <div
      className="absolute inset-0 z-0 overflow-hidden"
      style={{ opacity: 0.3 }}
    >
      <svg width="2000" height="2000" className="absolute top-0 left-0">
        <g>
          {lines.map((line) => (
            <motion.line
              key={line.id}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="#A78BFA"
              strokeWidth="0.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 2, delay: 1 }}
            />
          ))}
          {nodes.map((node) => {
            const distance =
              x !== null && y !== null
                ? Math.hypot(node.x - x, node.y - y)
                : -1;
            const scale =
              distance !== -1 ? Math.max(1, 2 - distance / 200) : 1;
            return (
              <motion.circle
                key={node.id}
                cx={node.x}
                cy={node.y}
                r={node.size}
                fill={node.color}
                animate={{
                  scale: scale,
                  translateX: (x || 0) / 20,
                  translateY: (y || 0) / 20,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 100,
                  damping: 10,
                }}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
};

export default SkillTreeBackground;
