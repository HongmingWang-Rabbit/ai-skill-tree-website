import { ReactNode } from 'react';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
}

export function GlassPanel({ children, className = '' }: GlassPanelProps) {
  return (
    <div
      className={`
        bg-slate-900/80 backdrop-blur-xl
        border border-slate-700/50
        rounded-xl
        ${className}
      `}
    >
      {children}
    </div>
  );
}
