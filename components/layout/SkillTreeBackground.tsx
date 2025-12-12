'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const SkillTreeBackground = () => {
  const [nodes, setNodes] = useState<any[]>([]);
  const [lines, setLines] = useState<any[]>([]);

  useEffect(() => {
    const numNodes = 20;
    const newNodes = Array.from({ length: numNodes }).map((_, i) => ({
      id: i,
      x: Math.random() * 2000,
      y: Math.random() * 2000,
      size: Math.random() * 3 + 1,
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
      style={{ opacity: 0.2 }}
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
          {nodes.map((node) => (
            <motion.circle
              key={node.id}
              cx={node.x}
              cy={node.y}
              r={node.size}
              fill="#A78BFA"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{
                duration: Math.random() * 10 + 5,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
};

export default SkillTreeBackground;
