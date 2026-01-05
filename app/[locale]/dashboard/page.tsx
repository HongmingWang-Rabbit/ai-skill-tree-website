'use client';

import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { SKILL_PASS_THRESHOLD, API_ROUTES, USER_NAME_MAX_LENGTH, RESUME_CONFIG } from '@/lib/constants';
import { Link, useRouter } from '@/i18n/navigation';
import dynamic from 'next/dynamic';
import { MasterSkillMap } from '@/components/dashboard/MasterSkillMap';
import { SearchInput } from '@/components/ui/SearchInput';
import { useCareerSearch } from '@/hooks/useCareerSearch';
import { ExperienceEditor } from '@/components/dashboard/ExperienceEditor';
import { EducationEditor } from '@/components/dashboard/EducationEditor';
import { ProjectEditor } from '@/components/dashboard/ProjectEditor';
import { DropdownMenu, type DropdownMenuItem, TrashIcon, MergeIcon, ConfirmModal, showToast, EditIcon, ImportIcon, BriefcaseIcon, ResumeIcon, SaveIcon, PhoneIcon, MapPinIcon, FolderIcon, BookOpenIcon } from '@/components/ui';
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
const AuthModal = dynamic(
  () => import('@/components/auth/AuthModal').then(mod => mod.AuthModal),
  { ssr: false }
);
import { type Locale } from '@/i18n/routing';
import { type WorkExperience, type Project, type UserAddress, type Education } from '@/lib/schemas';
import { clampString, sanitizeAddress, normalizeExperience, normalizeProject, normalizeEducation } from '@/lib/profile-normalize';
import { useUserGraphs, useUserProfile, useDeleteMap, useUpdateMap, useUserCredits, useUserSubscription } from '@/hooks/useQueryHooks';
import {
  mergeBio,
  mergeExperienceArrays,
  mergeProjectArrays,
  mergeEducationArrays,
  findSimilarSkillMap,
  type SavedCareerInfo,
} from '@/lib/import-merge';

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

  // Utility to strip unsupported address fields before saving
  const extractErrorMessage = async (response: Response, fallback: string) => {
    try {
      const data = await response.json();
      if (typeof data?.error === 'string') return data.error;
      if (data?.details) return JSON.stringify(data.details);
    } catch {
      // ignore parsing errors
    }
    let text = '';
    try {
      text = await response.text();
    } catch {
      // ignore
    }
    return `${fallback} (status ${response.status}${text ? `: ${text}` : ''})`;
  };

  // React Query hooks for data fetching
  const { data: savedCareers = [], isLoading: isLoadingCareers } = useUserGraphs(!!session?.user?.id);
  const { data: profile, isLoading: isLoadingProfile } = useUserProfile(!!session?.user?.id);
  const { data: credits, isLoading: isLoadingCredits } = useUserCredits(!!session?.user?.id);
  const { data: subscription, isLoading: isLoadingSubscription } = useUserSubscription(!!session?.user?.id);
  const deleteMapMutation = useDeleteMap();
  const updateMapMutation = useUpdateMap();

  // Local state synced with profile query
  const [bio, setBio] = useState('');
  const [originalBio, setOriginalBio] = useState('');
  const [phone, setPhone] = useState('');
  const [originalPhone, setOriginalPhone] = useState('');
  const [address, setAddress] = useState<UserAddress>({});
  const [originalAddress, setOriginalAddress] = useState<UserAddress>({});
  const [experience, setExperience] = useState<WorkExperience[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [education, setEducation] = useState<Education[]>([]);

  // Sync local state when profile data loads
  useEffect(() => {
    if (profile) {
      setBio(profile.bio || '');
      setOriginalBio(profile.bio || '');
      setPhone(profile.phone || '');
      setOriginalPhone(profile.phone || '');
      const cleanAddress = sanitizeAddress(profile.address || {});
      setAddress(cleanAddress);
      setOriginalAddress(cleanAddress);
      setExperience(profile.experience || []);
      setProjects(profile.projects || []);
      setEducation(profile.education || []);
    }
  }, [profile]);

  // Track if fields have unsaved changes
  const hasBioChanges = bio !== originalBio;
  const hasPhoneChanges = phone !== originalPhone;
  const hasAddressChanges = JSON.stringify(address) !== JSON.stringify(originalAddress);
  const hasContactChanges = hasPhoneChanges || hasAddressChanges;

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
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [showExperienceEditor, setShowExperienceEditor] = useState(false);
  const [showProjectEditor, setShowProjectEditor] = useState(false);
  const [showEducationEditor, setShowEducationEditor] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Career search hook for adding new skill trees
  const { isSearching: isSearchingCareer, search: searchCareer } = useCareerSearch();

  // Save bio explicitly
  const handleSaveBio = useCallback(async () => {
    setIsSavingBio(true);
    try {
      const response = await fetch(API_ROUTES.USER_PROFILE, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio }),
      });

      if (response.ok) {
        setOriginalBio(bio);
        setIsEditingBio(false);
        showToast.success(t('dashboard.bioSaved'));
      } else {
        showToast.error(await extractErrorMessage(response, t('dashboard.bioSaveFailed')));
      }
    } catch {
      showToast.error(t('dashboard.bioSaveFailed'));
    } finally {
      setIsSavingBio(false);
    }
  }, [bio, t]);

  // Cancel bio editing
  const handleCancelBioEdit = useCallback(() => {
    setBio(originalBio);
    setIsEditingBio(false);
  }, [originalBio]);

  // Save contact info (phone + address)
  const handleSaveContact = useCallback(async () => {
    setIsSavingContact(true);
    try {
      const cleanAddress = sanitizeAddress(address);
      const response = await fetch(API_ROUTES.USER_PROFILE, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, address: cleanAddress }),
      });

      if (response.ok) {
        setOriginalPhone(phone);
        setOriginalAddress(cleanAddress);
        setIsEditingContact(false);
        showToast.success(t('dashboard.contactSaved'));
      } else {
        showToast.error(await extractErrorMessage(response, t('dashboard.contactSaveFailed')));
      }
    } catch {
      showToast.error(t('dashboard.contactSaveFailed'));
    } finally {
      setIsSavingContact(false);
    }
  }, [phone, address, t]);

  // Cancel contact editing
  const handleCancelContactEdit = useCallback(() => {
    setPhone(originalPhone);
    setAddress(originalAddress);
    setIsEditingContact(false);
  }, [originalPhone, originalAddress]);

  // Save experience
  const handleSaveExperience = useCallback(async (newExperience: WorkExperience[]) => {
    const response = await fetch(API_ROUTES.USER_PROFILE, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ experience: newExperience.map(normalizeExperience) }),
    });

    if (!response.ok) {
      throw new Error(await extractErrorMessage(response, 'Failed to save experience'));
    }

    setExperience(newExperience);
    showToast.success(t('dashboard.experienceSaved'));
  }, [t]);

  // Save projects
  const handleSaveProjects = useCallback(async (newProjects: Project[]) => {
    const response = await fetch(API_ROUTES.USER_PROFILE, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projects: newProjects.map(normalizeProject) }),
    });

    if (!response.ok) {
      throw new Error(await extractErrorMessage(response, 'Failed to save projects'));
    }

    setProjects(newProjects);
    showToast.success(t('dashboard.projectsSaved'));
  }, [t]);

  // Save education
  const handleSaveEducation = useCallback(async (newEducation: Education[]) => {
    const response = await fetch(API_ROUTES.USER_PROFILE, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ education: newEducation.map(normalizeEducation) }),
    });

    if (!response.ok) {
      throw new Error(await extractErrorMessage(response, 'Failed to save education'));
    }

    setEducation(newEducation);
    showToast.success(t('dashboard.educationSaved'));
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

  // Handle import completion - smart merge with existing data or create new
  const handleImportComplete = useCallback(async (result: ImportResult) => {
    setIsCreatingMap(true);
    try {
      // Build existing maps info for similarity checking
      const existingMapsInfo: SavedCareerInfo[] = savedCareers.map(sc => ({
        mapId: sc.graph.id,
        title: sc.graph.title || sc.career?.title || '',
        skills: sc.graph.nodeData?.map(n => n.skillId) || [],
      }));

      // Check for similar existing skill map
      const similarMap = findSimilarSkillMap(
        result.suggestedTitle,
        result.nodes,
        existingMapsInfo
      );

      let targetMapId: string;

      if (similarMap) {
        // Update existing map instead of creating new
        await updateMapMutation.mutateAsync({
          mapId: similarMap.mapId,
          updates: {
            title: result.suggestedTitle,
            customNodes: result.nodes,
            customEdges: result.edges,
          },
        });
        targetMapId = similarMap.mapId;
        showToast.success(t('import.mapUpdated'));
      } else {
        // Create a new map with the imported skills
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
        targetMapId = mapData.mapId;
        showToast.success(t('import.success'));
      }

      // If any profile data was extracted, update the user profile with smart merging
      const hasProfileData = result.bio || result.phone || result.address ||
        (result.experience && result.experience.length > 0) ||
        (result.projects && result.projects.length > 0) ||
        (result.education && result.education.length > 0);

      if (hasProfileData) {
        const profileUpdate: {
          bio?: string;
          phone?: string;
          address?: UserAddress;
          experience?: WorkExperience[];
          projects?: Project[];
          education?: Education[];
        } = {};

        // Smart bio merging - merge instead of replace
        if (result.bio) {
          const bioResult = mergeBio(bio, result.bio);
          if (bioResult.action !== 'kept') {
            profileUpdate.bio = clampString(bioResult.bio, RESUME_CONFIG.bioMaxLength);
          }
        }

        // Update phone if extracted and not already set
        if (result.phone && !phone) {
          profileUpdate.phone = clampString(result.phone, RESUME_CONFIG.phoneMaxLength);
        }

        // Merge address fields - update any extracted fields
        if (result.address) {
          profileUpdate.address = sanitizeAddress({
            ...address,
            ...Object.fromEntries(
              Object.entries(result.address).filter(([, v]) => v)
            ),
          });
        }

        // Smart experience merging with fuzzy matching
        if (result.experience && result.experience.length > 0) {
          const newExperiences: WorkExperience[] = result.experience.map((exp, idx) =>
            normalizeExperience({
              id: `imported-${Date.now()}-${idx}`,
              company: exp.company,
              title: exp.title,
              startDate: exp.startDate,
              endDate: exp.endDate,
              description: exp.description,
              location: exp.location,
            })
          );

          const expResult = mergeExperienceArrays(
            experience,
            newExperiences,
            RESUME_CONFIG.experienceMaxItems
          );

          if (expResult.added > 0 || expResult.updated > 0) {
            profileUpdate.experience = expResult.merged;
          }
        }

        // Smart project merging with fuzzy matching
        if (result.projects && result.projects.length > 0) {
          const newProjects: Project[] = result.projects.map((proj, idx) =>
            normalizeProject({
              id: `imported-${Date.now()}-${idx}`,
              name: proj.name,
              description: proj.description ?? '',
              url: proj.url ?? undefined,
              technologies: proj.technologies ?? [],
              startDate: proj.startDate || undefined,
              endDate: proj.endDate ?? null,
            })
          );

          const projResult = mergeProjectArrays(
            projects,
            newProjects,
            RESUME_CONFIG.projectsMaxItems
          );

          if (projResult.added > 0 || projResult.updated > 0) {
            profileUpdate.projects = projResult.merged;
          }
        }

        // Smart education merging with fuzzy matching
        if (result.education && result.education.length > 0) {
          const newEducation: Education[] = result.education.map((edu, idx) =>
            normalizeEducation({
              id: `edu-imported-${Date.now()}-${idx}`,
              school: edu.school,
              degree: edu.degree ?? undefined,
              fieldOfStudy: edu.fieldOfStudy ?? undefined,
              startDate: edu.startDate || undefined,
              endDate: edu.endDate ?? null,
              description: edu.description ?? undefined,
              location: edu.location ?? undefined,
            })
          );

          const eduResult = mergeEducationArrays(
            education,
            newEducation,
            RESUME_CONFIG.educationMaxItems
          );

          if (eduResult.added > 0 || eduResult.updated > 0) {
            profileUpdate.education = eduResult.merged;
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
              setOriginalBio(profileUpdate.bio);
            }
            if (profileUpdate.phone) {
              setPhone(profileUpdate.phone);
              setOriginalPhone(profileUpdate.phone);
            }
            if (profileUpdate.address) {
              setAddress(profileUpdate.address);
              setOriginalAddress(profileUpdate.address);
            }
            if (profileUpdate.experience) {
              setExperience(profileUpdate.experience);
            }
            if (profileUpdate.projects) {
              setProjects(profileUpdate.projects);
            }
            if (profileUpdate.education) {
              setEducation(profileUpdate.education);
            }
            showToast.success(t('import.profileUpdated'));
          } else {
            showToast.error(await extractErrorMessage(profileResponse, t('import.importFailed')));
          }
        }
      }

      // Redirect to the map
      router.push(`/career/${targetMapId}`);
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : t('import.createFailed'));
    } finally {
      setIsCreatingMap(false);
    }
  }, [router, t, bio, phone, address, experience, projects, education, savedCareers, updateMapMutation]);

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
            onClick={() => setShowAuthModal(true)}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors"
          >
            {t('common.signIn')}
          </button>
        </div>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    );
  }

  const displayName = session.user.name || session.user.email || 'User';
  const avatarUrl = session.user.image;

  return (
    <div className="min-h-screen bg-slate-950 pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-6">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={80}
                height={80}
                className="rounded-full w-14 h-14 sm:w-20 sm:h-20"
              />
            ) : (
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-amber-500 flex items-center justify-center text-slate-900 font-bold text-2xl sm:text-3xl">
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
                      className="text-lg sm:text-2xl font-bold text-white bg-slate-800 border border-slate-600 rounded-lg px-2 sm:px-3 py-1 focus:outline-none focus:border-amber-500 disabled:opacity-50 w-full"
                      maxLength={USER_NAME_MAX_LENGTH}
                    />
                    {isSavingName && (
                      <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                ) : (
                  <>
                    <h1 className="text-lg sm:text-2xl font-bold text-white truncate">{displayName}</h1>
                    <button
                      onClick={startEditingName}
                      className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
                      title={t('dashboard.editName')}
                    >
                      <EditIcon className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
              {session.user.email && (
                <p className="text-slate-400 text-sm sm:text-base truncate">{session.user.email}</p>
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
              {!isEditingBio && !isLoadingProfile && (
                <button
                  onClick={() => setIsEditingBio(true)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-amber-400 transition-colors"
                >
                  <EditIcon className="w-3 h-3" />
                  {t('dashboard.edit')}
                </button>
              )}
            </div>
            {isLoadingProfile ? (
              <div className="w-full h-[60px] bg-slate-800/50 border border-slate-700 rounded-lg animate-pulse" />
            ) : isEditingBio ? (
              <>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={t('dashboard.bioPlaceholder')}
                  maxLength={RESUME_CONFIG.bioMaxLength}
                  rows={4}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                  autoFocus
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-slate-500">
                    {bio.length}/{RESUME_CONFIG.bioMaxLength}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCancelBioEdit}
                      disabled={isSavingBio}
                      className="px-3 py-1 text-xs text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                      {t('common.cancel')}
                    </button>
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
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-300 whitespace-pre-wrap">
                {bio || <span className="text-slate-500 italic">{t('dashboard.bioPlaceholder')}</span>}
              </p>
            )}
          </div>

          {/* Contact Info Section (Phone & Address) */}
          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-400">{t('dashboard.contactInfo')}</label>
              {!isEditingContact && !isLoadingProfile && (
                <button
                  onClick={() => setIsEditingContact(true)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-amber-400 transition-colors"
                >
                  <EditIcon className="w-3 h-3" />
                  {t('dashboard.edit')}
                </button>
              )}
            </div>
            {isLoadingProfile ? (
              <div className="h-6 w-48 bg-slate-800/50 border border-slate-700 rounded animate-pulse" />
            ) : isEditingContact ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  {/* Phone */}
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      <PhoneIcon className="w-3 h-3 inline mr-1" />
                      {t('dashboard.phone')}
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t('dashboard.phonePlaceholder')}
                      maxLength={RESUME_CONFIG.phoneMaxLength}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                      autoFocus
                    />
                  </div>
                  {/* City */}
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      <MapPinIcon className="w-3 h-3 inline mr-1" />
                      {t('dashboard.city')}
                    </label>
                    <input
                      type="text"
                      value={address.city || ''}
                      onChange={(e) => setAddress(prev => ({ ...prev, city: e.target.value }))}
                      placeholder={t('dashboard.cityPlaceholder')}
                      maxLength={RESUME_CONFIG.addressCityMaxLength}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* State/Province */}
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">{t('dashboard.state')}</label>
                    <input
                      type="text"
                      value={address.state || ''}
                      onChange={(e) => setAddress(prev => ({ ...prev, state: e.target.value }))}
                      placeholder={t('dashboard.statePlaceholder')}
                      maxLength={RESUME_CONFIG.addressStateMaxLength}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                  {/* Country */}
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">{t('dashboard.country')}</label>
                    <input
                      type="text"
                      value={address.country || ''}
                      onChange={(e) => setAddress(prev => ({ ...prev, country: e.target.value }))}
                      placeholder={t('dashboard.countryPlaceholder')}
                      maxLength={RESUME_CONFIG.addressCountryMaxLength}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-3 gap-2">
                  <button
                    onClick={handleCancelContactEdit}
                    disabled={isSavingContact}
                    className="px-3 py-1 text-xs text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleSaveContact}
                    disabled={isSavingContact}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded transition-colors disabled:opacity-50"
                  >
                    {isSavingContact ? (
                      <div className="w-3 h-3 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <SaveIcon className="w-3 h-3" />
                    )}
                    {t('dashboard.saveContact')}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-300">
                {phone && (
                  <span className="flex items-center gap-1">
                    <PhoneIcon className="w-3.5 h-3.5 text-slate-500" />
                    {phone}
                  </span>
                )}
                {(address.city || address.state || address.country) && (
                  <span className="flex items-center gap-1">
                    <MapPinIcon className="w-3.5 h-3.5 text-slate-500" />
                    {[address.city, address.state, address.country].filter(Boolean).join(', ')}
                  </span>
                )}
                {!phone && !address.city && !address.country && (
                  <span className="text-slate-500 italic">{t('dashboard.noContactInfo')}</span>
                )}
              </div>
            )}
          </div>

          {/* Experience, Projects and Resume Actions */}
          <div className="mt-4 pt-4 border-t border-slate-700 flex flex-wrap gap-2 sm:gap-3">
            {isLoadingProfile ? (
              <>
                <div className="h-9 sm:h-10 w-24 sm:w-44 bg-slate-800 rounded-lg animate-pulse" />
                <div className="h-9 sm:h-10 w-20 sm:w-40 bg-slate-800 rounded-lg animate-pulse" />
                <div className="h-9 sm:h-10 w-24 sm:w-36 bg-amber-500/30 rounded-lg animate-pulse" />
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowExperienceEditor(true)}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors text-sm"
                >
                  <BriefcaseIcon className="w-4 h-4" />
                  <span className="hidden min-[400px]:inline">{t('dashboard.manageExperience')}</span>
                  {experience.length > 0 && (
                    <span className="px-1.5 py-0.5 text-xs bg-slate-600 rounded">
                      {experience.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setShowProjectEditor(true)}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors text-sm"
                >
                  <FolderIcon className="w-4 h-4" />
                  <span className="hidden min-[400px]:inline">{t('dashboard.manageProjects')}</span>
                  {projects.length > 0 && (
                    <span className="px-1.5 py-0.5 text-xs bg-slate-600 rounded">
                      {projects.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setShowEducationEditor(true)}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors text-sm"
                >
                  <BookOpenIcon className="w-4 h-4" />
                  <span className="hidden min-[400px]:inline">{t('dashboard.manageEducation')}</span>
                  {education.length > 0 && (
                    <span className="px-1.5 py-0.5 text-xs bg-slate-600 rounded">
                      {education.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setShowResumeModal(true)}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-900 font-semibold rounded-lg transition-all text-sm"
                >
                  <ResumeIcon className="w-4 h-4" />
                  <span className="hidden min-[400px]:inline">{t('dashboard.exportResume')}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Billing Section */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-white">{t('billing.accountStatus')}</h2>
            <Link
              href="/pricing"
              className="text-xs sm:text-sm text-amber-400 hover:text-amber-300 transition-colors"
            >
              {subscription?.tier === 'free' ? t('billing.upgradePlan') : t('billing.managePlan')}
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {/* Credits Balance */}
            <div className="bg-slate-800/50 rounded-lg sm:rounded-xl p-2.5 sm:p-4 border border-slate-700">
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3 mb-1 sm:mb-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <span className="text-base sm:text-xl">💰</span>
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-[10px] sm:text-xs text-slate-400">{t('billing.credits')}</p>
                  {isLoadingCredits ? (
                    <div className="h-5 sm:h-6 w-10 sm:w-16 bg-slate-700 rounded animate-pulse mx-auto sm:mx-0" />
                  ) : (
                    <p className="text-lg sm:text-xl font-bold text-amber-400">{credits?.balance ?? 0}</p>
                  )}
                </div>
              </div>
              <Link
                href="/pricing#credits"
                className="text-[10px] sm:text-xs text-slate-400 hover:text-amber-400 transition-colors hidden sm:inline"
              >
                {t('billing.buyCredits')} →
              </Link>
            </div>

            {/* Subscription Tier */}
            <div className="bg-slate-800/50 rounded-lg sm:rounded-xl p-2.5 sm:p-4 border border-slate-700">
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3 mb-1 sm:mb-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                  <span className="text-base sm:text-xl">{subscription?.tier === 'premium' ? '👑' : subscription?.tier === 'pro' ? '⭐' : '🆓'}</span>
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-[10px] sm:text-xs text-slate-400">{t('billing.plan')}</p>
                  {isLoadingSubscription ? (
                    <div className="h-5 sm:h-6 w-10 sm:w-16 bg-slate-700 rounded animate-pulse mx-auto sm:mx-0" />
                  ) : (
                    <p className="text-lg sm:text-xl font-bold text-white capitalize">{subscription?.tier ?? 'free'}</p>
                  )}
                </div>
              </div>
              {subscription?.tier !== 'free' && subscription?.currentPeriodEnd && (
                <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">
                  {subscription.cancelAtPeriodEnd ? t('billing.expiresOn') : t('billing.renewsOn')}{' '}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Map Limit */}
            <div className="bg-slate-800/50 rounded-lg sm:rounded-xl p-2.5 sm:p-4 border border-slate-700">
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3 mb-1 sm:mb-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <span className="text-base sm:text-xl">🗺️</span>
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-[10px] sm:text-xs text-slate-400">{t('billing.skillMaps')}</p>
                  {isLoadingSubscription ? (
                    <div className="h-5 sm:h-6 w-10 sm:w-16 bg-slate-700 rounded animate-pulse mx-auto sm:mx-0" />
                  ) : (
                    <p className="text-lg sm:text-xl font-bold text-white">
                      {subscription?.limits.currentMaps ?? 0}
                      <span className="text-xs sm:text-sm font-normal text-slate-400">
                        /{subscription?.limits.maxMaps === -1 ? '∞' : subscription?.limits.maxMaps ?? 1}
                      </span>
                    </p>
                  )}
                </div>
              </div>
              {subscription?.tier === 'free' && subscription?.limits.currentMaps >= subscription?.limits.maxMaps && (
                <p className="text-[10px] sm:text-xs text-amber-400">{t('billing.mapLimitReached')}</p>
              )}
            </div>
          </div>
        </div>

        {/* Master Skill Map Hero Section */}
        <MasterSkillMap />

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg sm:rounded-xl p-3 sm:p-6">
            <div className="text-xl sm:text-3xl mb-1 sm:mb-2">📊</div>
            <h3 className="text-xs sm:text-lg font-semibold text-white mb-0.5 sm:mb-1">{t('dashboard.careerPaths')}</h3>
            <p className="text-xl sm:text-3xl font-bold text-amber-400">{stats.totalPaths}</p>
            <p className="text-[10px] sm:text-sm text-slate-400 mt-0.5 sm:mt-1 hidden sm:block">{t('dashboard.pathsExplored')}</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-lg sm:rounded-xl p-3 sm:p-6">
            <div className="text-xl sm:text-3xl mb-1 sm:mb-2">🎯</div>
            <h3 className="text-xs sm:text-lg font-semibold text-white mb-0.5 sm:mb-1">{t('dashboard.skills')}</h3>
            <p className="text-xl sm:text-3xl font-bold text-cyan-400">{stats.totalSkillsInProgress}</p>
            <p className="text-[10px] sm:text-sm text-slate-400 mt-0.5 sm:mt-1 hidden sm:block">{t('dashboard.skillsInProgress')}</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-lg sm:rounded-xl p-3 sm:p-6">
            <div className="text-xl sm:text-3xl mb-1 sm:mb-2">✨</div>
            <h3 className="text-xs sm:text-lg font-semibold text-white mb-0.5 sm:mb-1">{t('dashboard.mastered')}</h3>
            <p className="text-xl sm:text-3xl font-bold text-emerald-400">{stats.totalMastered}</p>
            <p className="text-[10px] sm:text-sm text-slate-400 mt-0.5 sm:mt-1 hidden sm:block">{t('dashboard.skillsCompleted')}</p>
          </div>
        </div>

        {/* Saved Career Paths */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-xl font-bold text-white">{t('dashboard.yourCareerPaths')}</h2>
              <button
                onClick={() => setShowImportModal(true)}
                disabled={isCreatingMap}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 rounded-lg border border-violet-500/30 transition-colors disabled:opacity-50 text-sm"
              >
                <ImportIcon className="w-4 h-4" />
                <span className="hidden sm:inline">{t('import.importButton')}</span>
              </button>
            </div>
            <SearchInput
              onSearch={searchCareer}
              placeholder={t('dashboard.addNewCareerPlaceholder')}
              mobilePlaceholder={t('dashboard.addNewCareerPlaceholderShort')}
              isLoading={isSearchingCareer}
              className="!max-w-none"
            />
          </div>

          {isLoadingCareers ? (
            <div className="text-center py-8 sm:py-12">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-400 text-sm sm:text-base">{t('dashboard.loadingPaths')}</p>
            </div>
          ) : savedCareers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
                    className={`relative bg-slate-800/50 border border-slate-700 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:bg-slate-800 hover:border-amber-500/50 transition-all ${isDeleting ? 'opacity-50' : ''}`}
                  >
                    {/* 3-dots menu */}
                    <div className="absolute top-2 right-2">
                      <DropdownMenu items={menuItems} position="bottom-right" />
                    </div>

                    <Link href={`/career/${sc.graph.id}`} className="block">
                      <h3 className="font-semibold text-white text-sm sm:text-base mb-1.5 sm:mb-2 pr-8 line-clamp-2">
                        {sc.graph.title || sc.career?.title || t('dashboard.unknownCareer')}
                      </h3>
                      <div className="flex items-center justify-between text-xs sm:text-sm text-slate-400 mb-2 sm:mb-3">
                        <span>{masteredSkills}/{totalSkills} {t('dashboard.skillsMastered')}</span>
                        <span className="text-amber-400">{progress}%</span>
                      </div>
                      <div className="h-1.5 sm:h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-[10px] sm:text-xs text-slate-500 mt-1.5 sm:mt-2">
                        {t('dashboard.lastUpdated')}: {new Date(sc.graph.updatedAt).toLocaleDateString()}
                      </p>
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🌱</div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2">{t('dashboard.startYourJourney')}</h3>
              <p className="text-slate-400 text-sm sm:text-base mb-4 sm:mb-6 max-w-md mx-auto px-4">
                {t('dashboard.startDescription')}
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors text-sm sm:text-base"
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

      {/* Project Editor Modal */}
      <ProjectEditor
        isOpen={showProjectEditor}
        onClose={() => setShowProjectEditor(false)}
        projects={projects}
        onSave={handleSaveProjects}
      />

      {/* Education Editor Modal */}
      <EducationEditor
        isOpen={showEducationEditor}
        onClose={() => setShowEducationEditor(false)}
        education={education}
        onSave={handleSaveEducation}
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
