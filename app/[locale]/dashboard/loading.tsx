export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-950 pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header Skeleton */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-8 animate-pulse">
          <div className="flex items-center gap-6">
            {/* Avatar skeleton */}
            <div className="w-20 h-20 rounded-full bg-slate-700" />
            <div className="flex-1">
              <div className="h-7 w-48 bg-slate-700 rounded mb-2" />
              <div className="h-5 w-36 bg-slate-800 rounded" />
            </div>
          </div>

          {/* Bio skeleton */}
          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="h-4 w-12 bg-slate-700 rounded mb-2" />
            <div className="h-16 bg-slate-800 rounded" />
          </div>

          {/* Action buttons skeleton */}
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="h-10 w-40 bg-slate-800 rounded-lg" />
            <div className="h-10 w-36 bg-amber-500/20 rounded-lg" />
          </div>
        </div>

        {/* Master Skill Map Skeleton */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-8 animate-pulse">
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="h-6 w-40 bg-slate-700 rounded mb-2" />
              <div className="h-4 w-56 bg-slate-800 rounded" />
            </div>
            <div className="flex gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="text-center">
                  <div className="h-6 w-8 bg-slate-700 rounded mx-auto mb-1" />
                  <div className="h-3 w-12 bg-slate-800 rounded" />
                </div>
              ))}
            </div>
          </div>
          {/* Graph area skeleton */}
          <div className="h-80 bg-slate-800/50 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <div className="h-4 w-32 bg-slate-700 rounded mx-auto" />
            </div>
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 animate-pulse">
              <div className="h-8 w-8 bg-slate-700 rounded mb-2" />
              <div className="h-5 w-24 bg-slate-700 rounded mb-1" />
              <div className="h-8 w-12 bg-amber-500/20 rounded" />
              <div className="h-4 w-20 bg-slate-800 rounded mt-1" />
            </div>
          ))}
        </div>

        {/* Saved Career Paths Skeleton */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 w-40 bg-slate-700 rounded" />
            <div className="h-10 w-24 bg-violet-500/20 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <div className="h-5 w-3/4 bg-slate-700 rounded mb-2" />
                <div className="flex justify-between mb-3">
                  <div className="h-4 w-20 bg-slate-800 rounded" />
                  <div className="h-4 w-10 bg-amber-500/20 rounded" />
                </div>
                <div className="h-2 bg-slate-700 rounded-full" />
                <div className="h-3 w-32 bg-slate-800 rounded mt-2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
