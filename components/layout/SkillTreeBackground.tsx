'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const SkillTreeBackground = () => {
  const [nodes, setNodes] = useState<any[]>([]);
  const [lines, setLines] = useState<any[]>([]);

  useEffect(() => {
    const newNodes = Array.from({ length: 100 }).map((_, i) => ({
      id: i,
      x: Math.random() * 2000,
      y: Math.random() * 2000,
      size: Math.random() * 5 + 1,
    }));
    setNodes(newNodes);

    const newLines = newNodes.map((node, i) => {
      if (i === 0) return null;
      const prevNode = newNodes[i - 1];
      return {
        id: i,
        x1: prevNode.x,
        y1: prevNode.y,
        x2: node.x,
        y2: node.y,
      };
    }).filter(Boolean);
    setLines(newLines as any[]);
  }, []);

  return (
    <div
      className="absolute inset-0 z-0 overflow-hidden"
      style={{ opacity: 0.5 }}
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
              strokeWidth="1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 2 }}
            />
          ))}
          {nodes.map((node) => (
            <motion.circle
              key={node.id}
              cx={node.x}
              cy={node.y}
              r={node.size}
              fill="#A78BFA"
              animate={{
                x: [node.x, node.x + (Math.random() - 0.5) * 200],
                y: [node.y, node.y + (Math.random() - 0.5) * 200],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: Math.random() * 20 + 10,
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
