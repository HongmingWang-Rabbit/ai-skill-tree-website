'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

const SkillTreeBackground = () => {
  const nodes = useMemo(() => {
    return Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      x: Math.random() * 2000,
      y: Math.random() * 2000,
      size: Math.random() * 5 + 1,
    }));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 z-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.3 }}
      transition={{ duration: 2 }}
    >
      <svg width="2000" height="2000" className="absolute top-0 left-0">
        <g>
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
    </motion.div>
  );
};

export default SkillTreeBackground;
