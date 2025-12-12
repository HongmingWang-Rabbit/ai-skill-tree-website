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
    const center = { x: 1000, y: 1000 };
    const newNodes = Array.from({ length: numNodes }).map((_, i) => {
      const angle = (i / numNodes) * 2 * Math.PI;
      const radius = i === 0 ? 0 : Math.random() * 400 + 100;
      return {
        id: i,
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle),
        size: i === 0 ? 20 : Math.random() * 5 + 2,
        color:
          i === 0
            ? '#FFD700'
            : ['#FFFFFF', '#00FF00', '#FFFF00'][
                Math.floor(Math.random() * 3)
              ],
      };
    });
    setNodes(newNodes);

    const newLines = newNodes.flatMap((node1) => {
      if (node1.id === 0) return [];
      const neighbors = newNodes
        .filter((node2) => node1.id !== node2.id && node2.id !== 0)
        .sort((a, b) => {
          const distA = Math.hypot(a.x - node1.x, a.y - node1.y);
          const distB = Math.hypot(b.x - node1.x, b.y - node1.y);
          return distA - distB;
        })
        .slice(0, 1);

      const centralLine = {
        id: `${node1.id}-0`,
        x1: node1.x,
        y1: node1.y,
        x2: newNodes[0].x,
        y2: newNodes[0].y,
      };

      return [
        centralLine,
        ...neighbors.map((node2) => ({
          id: `${node1.id}-${node2.id}`,
          x1: node1.x,
          y1: node1.y,
          x2: node2.x,
          y2: node2.y,
        })),
      ];
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
            const attraction =
              distance !== -1 ? Math.max(0, 100 - distance) : 0;
            const scale =
              distance !== -1 ? Math.max(1, 1.5 - distance / 300) : 1;
            const angle =
              x !== null && y !== null ? Math.atan2(y - node.y, x - node.x) : 0;

            return (
              <motion.circle
                key={node.id}
                cx={node.x}
                cy={node.y}
                r={node.size}
                fill={node.color}
                animate={{
                  scale: scale,
                  translateX: attraction * Math.cos(angle),
                  translateY: attraction * Math.sin(angle),
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

