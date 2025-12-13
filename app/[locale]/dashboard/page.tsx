'use client';

import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { SKILL_PASS_THRESHOLD, API_ROUTES, USER_NAME_MAX_LENGTH, RESUME_CONFIG } from '@/lib/constants';
import { Link, useRouter } from '@/i18n/navigation';
import dynamic from 'next/dynamic';
import { MasterSkillMap } from '@/components/dashboard/MasterSkillMap';
import { ExperienceEditor } from '@/components/dashboard/ExperienceEditor';
import { DropdownMenu, type DropdownMenuItem, TrashIcon, MergeIcon, ConfirmModal, showToast, EditIcon, ImportIcon, BriefcaseIcon, ResumeIcon, SaveIcon } from '@/components/ui';
import type { ImportResult } from '@/components/import';

// Lazy load heavy modals to reduce initial bundle size
const DocumentImportModal = dynamic(
  () => import('@/components/import/DocumentImportModal').then(mod => mod.DocumentImportModal),
  { ssr: false }
);
const ResumeExportModal = dynamic(
  () => import('@/components/resume/ResumeExportModal').then(mod => mod.ResumeExportModal),
  { ssr: false }
);
import { type Locale } from '@/i18n/routing';
import { type WorkExperience } from '@/lib/schemas';
import { useUserGraphs, useUserProfile, useDeleteMap } from '@/hooks/useQueryHooks';

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
  const locale = useLocale() as Locale;

  // React Query hooks for data fetching
  const { data: savedCareers = [], isLoading: isLoadingCareers } = useUserGraphs(!!session?.user?.id);
  const { data: profile, isLoading: isLoadingProfile } = useUserProfile(!!session?.user?.id);
  const deleteMapMutation = useDeleteMap();

  // Local state synced with profile query
  const [bio, setBio] = useState('');
  const [originalBio, setOriginalBio] = useState('');
  const [experience, setExperience] = useState<WorkExperience[]>([]);

  // Sync local state when profile data loads
  useEffect(() => {
    if (profile) {
      setBio(profile.bio || '');
      setOriginalBio(profile.bio || '');
      setExperience(profile.experience || []);
    }
  }, [profile]);

  // Track if bio has unsaved changes
  const hasBioChanges = bio !== originalBio;

  // UI state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mapToDelete, setMapToDelete] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isCreatingMap, setIsCreatingMap] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Profile UI state
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [showExperienceEditor, setShowExperienceEditor] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);

  // Save bio explicitly
  const handleSaveBio = useCallback(async () => {
    if (!hasBioChanges) return;

    setIsSavingBio(true);
    try {
      const response = await fetch(API_ROUTES.USER_PROFILE, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio }),
      });

      if (response.ok) {
        setOriginalBio(bio);
        showToast.success(t('dashboard.bioSaved'));
      } else {
        showToast.error(t('dashboard.bioSaveFailed'));
      }
    } catch {
      showToast.error(t('dashboard.bioSaveFailed'));
    } finally {
      setIsSavingBio(false);
    }
  }, [bio, hasBioChanges, t]);

  // Handle bio change (no auto-save)
  const handleBioChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBio(e.target.value);
  }, []);

  // Save experience
  const handleSaveExperience = useCallback(async (newExperience: WorkExperience[]) => {
    const response = await fetch(API_ROUTES.USER_PROFILE, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ experience: newExperience }),
    });

    if (!response.ok) {
      throw new Error('Failed to save experience');
    }

    setExperience(newExperience);
    showToast.success(t('dashboard.experienceSaved'));
  }, [t]);

  // Open delete confirmation modal
  const openDeleteConfirm = useCallback((mapId: string) => {
    setMapToDelete(mapId);
    setShowDeleteConfirm(true);
  }, []);

  // Handle delete confirmation (using React Query mutation)
  const handleConfirmDelete = useCallback(async () => {
    if (!mapToDelete) return;

    deleteMapMutation.mutate(mapToDelete, {
      onSuccess: () => {
        showToast.success(t('dashboard.deleteSuccess'));
        setShowDeleteConfirm(false);
        setMapToDelete(null);
      },
      onError: () => {
        showToast.error(t('dashboard.deleteFailed'));
        setShowDeleteConfirm(false);
        setMapToDelete(null);
      },
    });
  }, [mapToDelete, t, deleteMapMutation]);

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

  // Handle import completion - create new map with imported skills and update profile
  const handleImportComplete = useCallback(async (result: ImportResult) => {
    setIsCreatingMap(true);
    try {
      // Create a new map with the imported skills as custom nodes/edges
      const mapResponse = await fetch(`${API_ROUTES.MAP}/fork`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: result.suggestedTitle,
          customNodes: result.nodes,
          customEdges: result.edges,
        }),
      });

      const mapData = await mapResponse.json();

      if (!mapResponse.ok || !mapData.mapId) {
        throw new Error(mapData.error || 'Failed to create map');
      }

      // If bio or experience were extracted, update the user profile
      if (result.bio || (result.experience && result.experience.length > 0)) {
        const profileUpdate: { bio?: string; experience?: WorkExperience[] } = {};

        // Update bio if extracted and user doesn't have one
        if (result.bio && !bio) {
          profileUpdate.bio = result.bio;
        }

        // Merge extracted experience with existing experience
        if (result.experience && result.experience.length > 0) {
          // Convert ExtractedExperience to WorkExperience by adding unique IDs
          const newExperiences: WorkExperience[] = result.experience.map((exp, idx) => ({
            id: `imported-${Date.now()}-${idx}`,
            company: exp.company,
            title: exp.title,
            startDate: exp.startDate,
            endDate: exp.endDate,
            description: exp.description,
            location: exp.location,
          }));

          // Merge with existing, avoiding duplicates (by company + title + startDate)
          const existingKeys = new Set(
            experience.map(e => `${e.company}-${e.title}-${e.startDate}`)
          );
          const uniqueNewExps = newExperiences.filter(
            e => !existingKeys.has(`${e.company}-${e.title}-${e.startDate}`)
          );

          if (uniqueNewExps.length > 0) {
            // Combine and sort by start date (most recent first)
            const combinedExperience = [...experience, ...uniqueNewExps]
              .sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''))
              .slice(0, RESUME_CONFIG.experienceMaxItems);
            profileUpdate.experience = combinedExperience;
          }
        }

        // Save profile updates if any
        if (Object.keys(profileUpdate).length > 0) {
          const profileResponse = await fetch(API_ROUTES.USER_PROFILE, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileUpdate),
          });

          if (profileResponse.ok) {
            // Update local state
            if (profileUpdate.bio) {
              setBio(profileUpdate.bio);
            }
            if (profileUpdate.experience) {
              setExperience(profileUpdate.experience);
            }
            showToast.success(t('import.profileUpdated'));
          }
        }
      }

      showToast.success(t('import.success'));
      // Redirect to the new map
      router.push(`/career/${mapData.mapId}`);
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : t('import.createFailed'));
    } finally {
      setIsCreatingMap(false);
    }
  }, [router, t, bio, experience]);

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

          {/* Bio Section */}
          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-400">{t('dashboard.bio')}</label>
              <div className="flex items-center gap-2">
                {hasBioChanges && !isSavingBio && (
                  <span className="text-xs text-amber-400">{t('dashboard.unsavedChanges')}</span>
                )}
                {isSavingBio && (
                  <span className="text-xs text-slate-500">{t('dashboard.saving')}</span>
                )}
              </div>
            </div>
            {isLoadingProfile ? (
              <div className="w-full h-[100px] bg-slate-800/50 border border-slate-700 rounded-lg animate-pulse" />
            ) : (
              <textarea
                value={bio}
                onChange={handleBioChange}
                placeholder={t('dashboard.bioPlaceholder')}
                maxLength={RESUME_CONFIG.bioMaxLength}
                rows={4}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors resize-none"
              />
            )}
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-slate-500">
                {bio.length}/{RESUME_CONFIG.bioMaxLength}
              </p>
              {hasBioChanges && (
                <button
                  onClick={handleSaveBio}
                  disabled={isSavingBio}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded transition-colors disabled:opacity-50"
                >
                  {isSavingBio ? (
                    <div className="w-3 h-3 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <SaveIcon className="w-3 h-3" />
                  )}
                  {t('dashboard.saveBio')}
                </button>
              )}
            </div>
          </div>

          {/* Experience and Resume Actions */}
          <div className="mt-4 flex flex-wrap gap-3">
            {isLoadingProfile ? (
              <>
                <div className="h-10 w-44 bg-slate-800 rounded-lg animate-pulse" />
                <div className="h-10 w-36 bg-amber-500/30 rounded-lg animate-pulse" />
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowExperienceEditor(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
                >
                  <BriefcaseIcon className="w-4 h-4" />
                  <span>{t('dashboard.manageExperience')}</span>
                  {experience.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-slate-600 rounded">
                      {experience.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setShowResumeModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-900 font-semibold rounded-lg transition-all"
                >
                  <ResumeIcon className="w-4 h-4" />
                  <span>{t('dashboard.exportResume')}</span>
                </button>
              </>
            )}
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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">{t('dashboard.yourCareerPaths')}</h2>
            <button
              onClick={() => setShowImportModal(true)}
              disabled={isCreatingMap}
              className="flex items-center gap-2 px-4 py-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 rounded-lg border border-violet-500/30 transition-colors disabled:opacity-50"
            >
              <ImportIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{t('import.importButton')}</span>
            </button>
          </div>

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
                const isDeleting = deleteMapMutation.isPending && mapToDelete === sc.graph.id;

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
        isLoading={deleteMapMutation.isPending}
      />

      {/* Document Import Modal */}
      <DocumentImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={handleImportComplete}
        locale={locale}
        mode="create"
      />

      {/* Experience Editor Modal */}
      <ExperienceEditor
        isOpen={showExperienceEditor}
        onClose={() => setShowExperienceEditor(false)}
        experience={experience}
        onSave={handleSaveExperience}
      />

      {/* Resume Export Modal */}
      <ResumeExportModal
        isOpen={showResumeModal}
        onClose={() => setShowResumeModal(false)}
        locale={locale}
      />
    </div>
  );
}
