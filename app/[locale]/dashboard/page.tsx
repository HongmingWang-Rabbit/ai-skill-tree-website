'use client';

import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { SKILL_PASS_THRESHOLD } from '@/lib/constants';
import { Link, useRouter } from '@/i18n/navigation';

interface SavedGraph {
  id: string;
  careerId: string;
  title: string | null;
  nodeData: Array<{
    skillId: string;
    progress: number;
    position?: { x: number; y: number };
  }>;
  isPublic: boolean;
  shareSlug: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CareerInfo {
  id: string;
  title: string;
  canonicalKey: string;
  locale: string;
}

// API returns joined data in single query
interface SavedCareer {
  graph: SavedGraph;
  career: CareerInfo | null;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations();
  const [savedCareers, setSavedCareers] = useState<SavedCareer[]>([]);
  const [isLoadingCareers, setIsLoadingCareers] = useState(true);

  // Fetch user's saved career graphs (single API call with joined career data)
  useEffect(() => {
    async function fetchSavedCareers() {
      if (!session?.user?.id) return;

      try {
        const response = await fetch('/api/user/graph');
        const data = await response.json();

        if (data.graphs) {
          // API returns joined data - no N+1 calls needed
          setSavedCareers(data.graphs);
        }
      } catch (err) {
        console.error('Failed to fetch saved careers:', err);
      } finally {
        setIsLoadingCareers(false);
      }
    }

    fetchSavedCareers();
  }, [session?.user?.id]);

  // Calculate stats from saved careers
  const stats = {
    totalPaths: savedCareers.length,
    totalSkillsInProgress: savedCareers.reduce((sum, sc) => {
      return sum + sc.graph.nodeData.filter((n) => n.progress > 0 && n.progress < SKILL_PASS_THRESHOLD).length;
    }, 0),
    totalMastered: savedCareers.reduce((sum, sc) => {
      return sum + sc.graph.nodeData.filter((n) => n.progress >= SKILL_PASS_THRESHOLD).length;
    }, 0),
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-2xl font-bold text-white mb-4">{t('dashboard.signInRequired')}</h1>
          <p className="text-slate-400 mb-6">
            {t('dashboard.signInDescription')}
          </p>
          <button
            onClick={() => router.push('/?signin=true')}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors"
          >
            {t('common.signIn')}
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
            <h3 className="text-lg font-semibold text-white mb-1">{t('dashboard.careerPaths')}</h3>
            <p className="text-3xl font-bold text-amber-400">{stats.totalPaths}</p>
            <p className="text-sm text-slate-400 mt-1">{t('dashboard.pathsExplored')}</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <div className="text-3xl mb-2">🎯</div>
            <h3 className="text-lg font-semibold text-white mb-1">{t('dashboard.skills')}</h3>
            <p className="text-3xl font-bold text-cyan-400">{stats.totalSkillsInProgress}</p>
            <p className="text-sm text-slate-400 mt-1">{t('dashboard.skillsInProgress')}</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <div className="text-3xl mb-2">✨</div>
            <h3 className="text-lg font-semibold text-white mb-1">{t('dashboard.mastered')}</h3>
            <p className="text-3xl font-bold text-emerald-400">{stats.totalMastered}</p>
            <p className="text-sm text-slate-400 mt-1">{t('dashboard.skillsCompleted')}</p>
          </div>
        </div>

        {/* Saved Career Paths */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">{t('dashboard.yourCareerPaths')}</h2>

          {isLoadingCareers ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-400">{t('dashboard.loadingPaths')}</p>
            </div>
          ) : savedCareers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedCareers.map((sc) => {
                const totalSkills = sc.graph.nodeData.length;
                const masteredSkills = sc.graph.nodeData.filter((n) => n.progress >= SKILL_PASS_THRESHOLD).length;
                const progress = totalSkills > 0 ? Math.round((masteredSkills / totalSkills) * 100) : 0;

                return (
                  <Link
                    key={sc.graph.id}
                    href={`/career/${sc.graph.id}`}
                    className="block bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:bg-slate-800 hover:border-amber-500/50 transition-all"
                  >
                    <h3 className="font-semibold text-white mb-2">
                      {sc.graph.title || sc.career?.title || t('dashboard.unknownCareer')}
                    </h3>
                    <div className="flex items-center justify-between text-sm text-slate-400 mb-3">
                      <span>{masteredSkills}/{totalSkills} {t('dashboard.skillsMastered')}</span>
                      <span className="text-amber-400">{progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      {t('dashboard.lastUpdated')}: {new Date(sc.graph.updatedAt).toLocaleDateString()}
                    </p>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🌱</div>
              <h3 className="text-lg font-semibold text-white mb-2">{t('dashboard.startYourJourney')}</h3>
              <p className="text-slate-400 mb-6 max-w-md mx-auto">
                {t('dashboard.startDescription')}
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors"
              >
                <span>{t('dashboard.exploreCareers')}</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
