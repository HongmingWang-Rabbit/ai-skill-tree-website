'use client';

export function MasterSkillGraphSkeleton() {
  return (
    <div className="h-80 bg-slate-800/30 rounded-xl relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Center user node */}
        <div className="relative">
          {/* User circle */}
          <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-500/40 animate-pulse flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-amber-500/30" />
          </div>

          {/* Career nodes around the user */}
          {[0, 72, 144, 216, 288].map((angle, i) => {
            const radius = 120;
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;
            return (
              <div key={i}>
                {/* Career node */}
                <div
                  className="absolute w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-500/40 animate-pulse flex items-center justify-center"
                  style={{
                    left: `calc(50% + ${x}px - 32px)`,
                    top: `calc(50% + ${y}px - 32px)`,
                    animationDelay: `${i * 150}ms`,
                  }}
                >
                  <div className="w-6 h-6 rounded bg-cyan-500/30" />
                </div>

                {/* Skill nodes around each career */}
                {[0, 90, 180, 270].map((skillAngle, j) => {
                  const skillRadius = 45;
                  const baseAngle = angle + skillAngle;
                  const sx = x + Math.cos((baseAngle * Math.PI) / 180) * skillRadius;
                  const sy = y + Math.sin((baseAngle * Math.PI) / 180) * skillRadius;
                  return (
                    <div
                      key={`${i}-${j}`}
                      className="absolute w-6 h-6 rounded-full bg-slate-700/50 border border-slate-600 animate-pulse"
                      style={{
                        left: `calc(50% + ${sx}px - 12px)`,
                        top: `calc(50% + ${sy}px - 12px)`,
                        animationDelay: `${(i * 4 + j) * 50}ms`,
                      }}
                    />
                  );
                })}
              </div>
            );
          })}

          {/* Connecting lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ width: 300, height: 300, left: -110, top: -110 }}>
            {[0, 72, 144, 216, 288].map((angle, i) => {
              const radius = 120;
              const x = Math.cos((angle * Math.PI) / 180) * radius + 150;
              const y = Math.sin((angle * Math.PI) / 180) * radius + 150;
              return (
                <line
                  key={i}
                  x1="150"
                  y1="150"
                  x2={x}
                  y2={y}
                  stroke="#C9A227"
                  strokeWidth="1"
                  strokeOpacity="0.3"
                  strokeDasharray="4 4"
                  className="animate-pulse"
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Loading indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
        <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-400 text-sm">Loading skill universe...</span>
      </div>
    </div>
  );
}
