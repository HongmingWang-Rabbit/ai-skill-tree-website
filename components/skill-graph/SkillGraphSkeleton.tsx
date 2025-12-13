'use client';

export function SkillGraphSkeleton() {
  return (
    <div className="w-full h-full relative bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        {/* Animated skill graph placeholder */}
        <div className="relative w-72 h-72 mx-auto mb-6">
          {/* Center node */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-amber-500/20 border-2 border-amber-500/40 animate-pulse flex items-center justify-center">
            <div className="w-16 h-4 bg-amber-500/30 rounded animate-pulse" />
          </div>

          {/* Orbital nodes - ring 1 */}
          {[0, 60, 120, 180, 240, 300].map((angle, i) => {
            const radius = 110;
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;
            return (
              <div
                key={`r1-${i}`}
                className="absolute w-14 h-14 rounded-lg bg-slate-800/60 border border-slate-700 animate-pulse"
                style={{
                  left: `calc(50% + ${x}px - 28px)`,
                  top: `calc(50% + ${y}px - 28px)`,
                  animationDelay: `${i * 100}ms`,
                }}
              >
                <div className="w-full h-full flex flex-col items-center justify-center p-1">
                  <div className="w-6 h-6 bg-slate-700 rounded mb-1" />
                  <div className="w-8 h-2 bg-slate-700 rounded" />
                </div>
              </div>
            );
          })}

          {/* Connecting lines */}
          <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none">
            <defs>
              <linearGradient id="skeleton-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#C9A227" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#C9A227" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            {[0, 60, 120, 180, 240, 300].map((angle, i) => {
              const radius = 110;
              const x = Math.cos((angle * Math.PI) / 180) * radius + 144;
              const y = Math.sin((angle * Math.PI) / 180) * radius + 144;
              return (
                <line
                  key={i}
                  x1="144"
                  y1="144"
                  x2={x}
                  y2={y}
                  stroke="url(#skeleton-gradient)"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                  className="animate-pulse"
                />
              );
            })}
          </svg>
        </div>

        {/* Loading spinner and text */}
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Loading skill map...</p>
        <p className="text-slate-500 text-xs mt-1">Preparing your career path visualization</p>
      </div>

      {/* Panel placeholders */}
      <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-lg p-3 animate-pulse">
        <div className="h-3 w-16 bg-slate-700 rounded mb-2" />
        <div className="flex flex-wrap gap-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-5 w-14 bg-slate-800 rounded-full" />
          ))}
        </div>
      </div>

      <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-lg p-3 animate-pulse">
        <div className="h-3 w-12 bg-slate-700 rounded mb-2" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-700" />
              <div className="h-3 w-16 bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
