'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { LazyMasterSkillGraph } from './LazyMasterSkillGraph';
import { Link } from '@/i18n/navigation';
import { useMasterMap } from '@/hooks/useQueryHooks';

export function MasterSkillMap() {
  const t = useTranslations('masterMap');
  const router = useRouter();

  // Use React Query hook for data fetching (replaces manual useEffect)
  const { data, isLoading, error } = useMasterMap();

  // Handle career click - navigate to career page
  const handleCareerClick = (careerId: string) => {
    router.push(`/career/${careerId}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">{t('loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">{t('errorTitle')}</h2>
          <p className="text-slate-400 max-w-md mx-auto">
            {t('errorDescription')}
          </p>
        </div>
      </div>
    );
  }

  // Empty state (no careers)
  if (!data || data.stats.totalCareers === 0) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🌌</div>
          <h2 className="text-xl font-bold text-white mb-2">{t('emptyTitle')}</h2>
          <p className="text-slate-400 max-w-md mx-auto mb-6">
            {t('emptyDescription')}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors"
          >
            <span>{t('exploreCareers')}</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🌌</span>
            {t('title')}
          </h2>
          <p className="text-sm text-slate-400 mt-1">{t('subtitle')}</p>
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <p className="text-lg font-bold text-amber-400">{data.stats.totalSkills}</p>
            <p className="text-xs text-slate-400">{t('totalSkills')}</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-emerald-400">{data.stats.masteredSkills}</p>
            <p className="text-xs text-slate-400">{t('mastered')}</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-cyan-400">{data.stats.inProgressSkills}</p>
            <p className="text-xs text-slate-400">{t('inProgress')}</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-purple-400">{data.stats.totalCareers}</p>
            <p className="text-xs text-slate-400">{t('careers')}</p>
          </div>
        </div>
      </div>

      {/* Graph Visualization */}
      <LazyMasterSkillGraph
        userName={data.userName}
        careers={data.careers}
        onCareerClick={handleCareerClick}
      />

      {/* Help text */}
      <p className="text-xs text-slate-500 text-center mt-4">
        {t('helpText')}
      </p>
    </div>
  );
}
