'use client';

import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { SKILL_PASS_THRESHOLD, API_ROUTES, USER_NAME_MAX_LENGTH } from '@/lib/constants';
import { Link, useRouter } from '@/i18n/navigation';
import { MasterSkillMap } from '@/components/dashboard/MasterSkillMap';
import { DropdownMenu, type DropdownMenuItem, TrashIcon, MergeIcon, ConfirmModal, showToast, EditIcon } from '@/components/ui';

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
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const t = useTranslations();
  const [savedCareers, setSavedCareers] = useState<SavedCareer[]>([]);
  const [isLoadingCareers, setIsLoadingCareers] = useState(true);
  const [deletingMapId, setDeletingMapId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mapToDelete, setMapToDelete] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Fetch user's saved career graphs (single API call with joined career data)
  useEffect(() => {
    async function fetchSavedCareers() {
      if (!session?.user?.id) return;

      try {
        const response = await fetch(API_ROUTES.USER_GRAPH);
        const data = await response.json();

        if (data.graphs) {
          // API returns joined data - no N+1 calls needed
          setSavedCareers(data.graphs);
        }
      } catch {
        // Failed to fetch saved careers
      } finally {
        setIsLoadingCareers(false);
      }
    }

    fetchSavedCareers();
  }, [session?.user?.id]);

  // Open delete confirmation modal
  const openDeleteConfirm = useCallback((mapId: string) => {
    setMapToDelete(mapId);
    setShowDeleteConfirm(true);
  }, []);

  // Handle delete confirmation
  const handleConfirmDelete = useCallback(async () => {
    if (!mapToDelete) return;

    setDeletingMapId(mapToDelete);
    try {
      const response = await fetch(`${API_ROUTES.MAP}/${mapToDelete}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSavedCareers((prev) => prev.filter((sc) => sc.graph.id !== mapToDelete));
        showToast.success(t('dashboard.deleteSuccess'));
      } else {
        showToast.error(t('dashboard.deleteFailed'));
      }
    } catch {
      showToast.error(t('dashboard.deleteFailed'));
    } finally {
      setDeletingMapId(null);
      setShowDeleteConfirm(false);
      setMapToDelete(null);
    }
  }, [mapToDelete, t]);

  // Cancel delete
  const handleCancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
    setMapToDelete(null);
  }, []);

  // Navigate to merge (go to career page and open merge modal)
  const handleMergeMap = useCallback((mapId: string) => {
    router.push(`/career/${mapId}?merge=true`);
  }, [router]);

  // Start editing name
  const startEditingName = useCallback(() => {
    setEditedName(session?.user?.name || '');
    setIsEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 0);
  }, [session?.user?.name]);

  // Cancel editing name
  const cancelEditingName = useCallback(() => {
    setIsEditingName(false);
    setEditedName('');
  }, []);

  // Save edited name
  const saveEditedName = useCallback(async () => {
    const trimmedName = editedName.trim();
    if (!trimmedName || trimmedName === session?.user?.name) {
      cancelEditingName();
      return;
    }

    setIsSavingName(true);
    try {
      const response = await fetch(API_ROUTES.USER_PROFILE, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName }),
      });

      if (response.ok) {
        await updateSession({ name: trimmedName });
        showToast.success(t('dashboard.nameUpdateSuccess'));
        setIsEditingName(false);
      } else {
        showToast.error(t('dashboard.nameUpdateFailed'));
      }
    } catch {
      showToast.error(t('dashboard.nameUpdateFailed'));
    } finally {
      setIsSavingName(false);
    }
  }, [editedName, session?.user?.name, cancelEditingName, updateSession, t]);

  // Handle key press in name input
  const handleNameKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      saveEditedName();
    } else if (e.key === 'Escape') {
      cancelEditingName();
    }
  }, [saveEditedName, cancelEditingName]);

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
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      onKeyDown={handleNameKeyDown}
                      onBlur={saveEditedName}
                      placeholder={t('dashboard.namePlaceholder')}
                      disabled={isSavingName}
                      className="text-2xl font-bold text-white bg-slate-800 border border-slate-600 rounded-lg px-3 py-1 focus:outline-none focus:border-amber-500 disabled:opacity-50"
                      maxLength={USER_NAME_MAX_LENGTH}
                    />
                    {isSavingName && (
                      <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-white">{displayName}</h1>
                    <button
                      onClick={startEditingName}
                      className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title={t('dashboard.editName')}
                    >
                      <EditIcon className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
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

        {/* Master Skill Map Hero Section */}
        <MasterSkillMap />

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
                const isDeleting = deletingMapId === sc.graph.id;

                const menuItems: DropdownMenuItem[] = [
                  {
                    id: 'merge',
                    label: t('dashboard.merge'),
                    icon: <MergeIcon className="w-4 h-4" />,
                    onClick: () => handleMergeMap(sc.graph.id),
                  },
                  {
                    id: 'delete',
                    label: t('dashboard.delete'),
                    icon: <TrashIcon className="w-4 h-4" />,
                    onClick: () => openDeleteConfirm(sc.graph.id),
                    variant: 'danger',
                    disabled: isDeleting,
                  },
                ];

                return (
                  <div
                    key={sc.graph.id}
                    className={`relative bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:bg-slate-800 hover:border-amber-500/50 transition-all ${isDeleting ? 'opacity-50' : ''}`}
                  >
                    {/* 3-dots menu */}
                    <div className="absolute top-2 right-2">
                      <DropdownMenu items={menuItems} position="bottom-right" />
                    </div>

                    <Link href={`/career/${sc.graph.id}`} className="block">
                      <h3 className="font-semibold text-white mb-2 pr-8">
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
                  </div>
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title={t('dashboard.deleteTitle')}
        message={t('dashboard.confirmDelete')}
        confirmText={t('dashboard.delete')}
        cancelText={t('common.cancel')}
        variant="danger"
        isLoading={!!deletingMapId}
      />
    </div>
  );
}
