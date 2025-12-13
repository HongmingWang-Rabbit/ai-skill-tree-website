export default function CareerLoading() {
  return (
    <div className="min-h-screen flex flex-col pt-16">
      {/* Career Sub-header Skeleton */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Back button */}
            <div className="w-9 h-9 bg-slate-800 rounded-lg animate-pulse" />
            <div>
              <div className="h-6 w-48 bg-slate-700 rounded mb-2 animate-pulse" />
              <div className="h-4 w-64 bg-slate-800 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Progress ring skeleton */}
            <div className="w-[60px] h-[60px] rounded-full bg-slate-800 animate-pulse" />
          </div>
        </div>
      </header>

      {/* Stats Bar Skeleton */}
      <div className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2 animate-pulse">
              <div className="h-4 w-20 bg-slate-700 rounded" />
              <div className="h-4 w-8 bg-slate-600 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Skill Graph Skeleton */}
      <main className="flex-1 relative bg-slate-950">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            {/* Animated skill graph placeholder */}
            <div className="relative w-64 h-64 mx-auto mb-6">
              {/* Center node */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-amber-500/20 border-2 border-amber-500/40 animate-pulse" />

              {/* Orbital nodes */}
              {[0, 60, 120, 180, 240, 300].map((angle, i) => {
                const radius = 100;
                const x = Math.cos((angle * Math.PI) / 180) * radius;
                const y = Math.sin((angle * Math.PI) / 180) * radius;
                return (
                  <div
                    key={i}
                    className="absolute w-12 h-12 rounded-lg bg-slate-700/50 border border-slate-600 animate-pulse"
                    style={{
                      left: `calc(50% + ${x}px - 24px)`,
                      top: `calc(50% + ${y}px - 24px)`,
                      animationDelay: `${i * 100}ms`,
                    }}
                  />
                );
              })}

              {/* Connecting lines (decorative) */}
              <svg className="absolute inset-0 w-full h-full opacity-20">
                {[0, 60, 120, 180, 240, 300].map((angle, i) => {
                  const radius = 100;
                  const x = Math.cos((angle * Math.PI) / 180) * radius + 128;
                  const y = Math.sin((angle * Math.PI) / 180) * radius + 128;
                  return (
                    <line
                      key={i}
                      x1="128"
                      y1="128"
                      x2={x}
                      y2={y}
                      stroke="#C9A227"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                  );
                })}
              </svg>
            </div>

            {/* Loading spinner and text */}
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400 text-sm">Loading skill map...</p>
          </div>
        </div>

        {/* Panel placeholders */}
        <div className="absolute top-4 left-4 w-48 h-32 bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-lg animate-pulse" />
        <div className="absolute top-4 right-4 w-36 h-40 bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-lg animate-pulse" />
      </main>
    </div>
  );
}
