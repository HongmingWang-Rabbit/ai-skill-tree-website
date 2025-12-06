'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-2xl font-bold text-white mb-4">Sign In Required</h1>
          <p className="text-slate-400 mb-6">
            Please sign in to access your dashboard and track your skill progress.
          </p>
          <button
            onClick={() => router.push('/?signin=true')}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const displayName = session.user.name || session.user.email || 'User';
  const avatarUrl = session.user.image;

  return (
    <div className="min-h-screen bg-slate-950 pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-6">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={80}
                height={80}
                className="rounded-full"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-amber-500 flex items-center justify-center text-slate-900 font-bold text-3xl">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-white">{displayName}</h1>
              {session.user.email && (
                <p className="text-slate-400">{session.user.email}</p>
              )}
              {session.user.walletAddress && (
                <p className="text-amber-400 text-sm mt-1">
                  {session.user.walletAddress.slice(0, 6)}...{session.user.walletAddress.slice(-4)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="text-lg font-semibold text-white mb-1">Career Paths</h3>
            <p className="text-3xl font-bold text-amber-400">0</p>
            <p className="text-sm text-slate-400 mt-1">Paths explored</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <div className="text-3xl mb-2">🎯</div>
            <h3 className="text-lg font-semibold text-white mb-1">Skills</h3>
            <p className="text-3xl font-bold text-cyan-400">0</p>
            <p className="text-sm text-slate-400 mt-1">Skills in progress</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <div className="text-3xl mb-2">✨</div>
            <h3 className="text-lg font-semibold text-white mb-1">Mastered</h3>
            <p className="text-3xl font-bold text-purple-400">0</p>
            <p className="text-sm text-slate-400 mt-1">Skills completed</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>

          <div className="text-center py-12">
            <div className="text-6xl mb-4">🌱</div>
            <h3 className="text-lg font-semibold text-white mb-2">Start Your Journey</h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Explore career paths and start tracking your skill progress. Your activity will appear here.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors"
            >
              <span>Explore Careers</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
