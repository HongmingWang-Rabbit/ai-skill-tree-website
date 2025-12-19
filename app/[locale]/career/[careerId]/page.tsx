'use client';

import { useEffect, useState, use, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { LazySkillGraph, type SkillGraphHandle } from '@/components/skill-graph/LazySkillGraph';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { XPProgressRing } from '@/components/ui/XPProgressRing';
import { ShareModal } from '@/components/ui/ShareModal';
import { DropdownMenu, type DropdownMenuItem, MergeIcon, TrashIcon, SortIcon, ShareIcon, ConfirmModal, showToast } from '@/components/ui';
import { useShareScreenshot, type ShareSlideType } from '@/hooks/useShareScreenshot';
import { useUpdateMap } from '@/hooks/useQueryHooks';

// Lazy load heavy AI chat components
const AIChatPanel = dynamic(
  () => import('@/components/ai-chat').then(mod => mod.AIChatPanel),
  { ssr: false }
);
const MergeMapModal = dynamic(
  () => import('@/components/ai-chat').then(mod => mod.MergeMapModal),
  { ssr: false }
);
import { SKILL_PASS_THRESHOLD, SIGN_IN_PROMPT_DELAY_MS, AUTO_SAVE_DEBOUNCE_MS, API_ROUTES } from '@/lib/constants';
import { isUUID, isShareSlug } from '@/lib/normalize-career';
import { useRouter } from '@/i18n/navigation';
import type { Node, Edge } from '@xyflow/react';
import type { SkillNodeData } from '@/components/skill-graph/SkillNode';
import type { SkillNode, SkillEdge } from '@/lib/schemas';
import type { Locale } from '@/i18n/routing';

interface SkillEdgeData {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
}

interface Career {
  id: string;
  canonicalKey: string;
  title: string;
  description: string | null;
  locale?: string;
}

interface SkillGraphData {
  id: string;
  careerId?: string | null;
  nodes: SkillNodeData[];
  edges: SkillEdgeData[];
}

interface CareerData {
  career: Career;
  skillGraph: SkillGraphData;
}

interface UserNodeData {
  skillId: string;
  progress: number;
  position?: { x: number; y: number };
}

interface UserMapData {
  id: string;
  title: string;
  nodeData: UserNodeData[];
  isPublic: boolean;
  shareSlug: string | null;
}

interface MapOwner {
  id: string;
  name: string | null;
  image: string | null;
}

// View modes for the page
type ViewMode = 'base' | 'own-map' | 'other-map';

export default function CareerPage({ params }: { params: Promise<{ careerId: string; locale: string }> }) {
  const resolvedParams = use(params);
  const careerId = resolvedParams.careerId;
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { data: session, status: authStatus } = useSession();

  // Core state
  const [data, setData] = useState<CareerData | null>(null);
  const [userMap, setUserMap] = useState<UserMapData | null>(null);
  const [mapOwner, setMapOwner] = useState<MapOwner | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('base');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // UI state
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isForking, setIsForking] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentSlide, setCurrentSlide] = useState<ShareSlideType>('full');
  const [slidePreviews, setSlidePreviews] = useState<Record<ShareSlideType, string | null>>({
    full: null,
    completed: null,
    summary: null,
  });

  // Graph expansion state
  const [showExpandModal, setShowExpandModal] = useState(false);
  const [hasShownExpandPrompt, setHasShownExpandPrompt] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);

  // AI Chat state
  const [chatModifiedNodes, setChatModifiedNodes] = useState<SkillNode[] | null>(null);
  const [chatModifiedEdges, setChatModifiedEdges] = useState<SkillEdge[] | null>(null);
  const [previousGraphState, setPreviousGraphState] = useState<{
    nodes: SkillNode[];
    edges: SkillEdge[];
  } | null>(null);
  const [showMergeModal, setShowMergeModal] = useState(false);

  // Refs
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasShownPromptRef = useRef(false);
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const skillGraphRef = useRef<SkillGraphHandle>(null);
  const { isCapturing, capturePreview, downloadFromDataUrl, copyFromDataUrl, shareFromDataUrl } = useShareScreenshot();

  // Mutations
  const updateMapMutation = useUpdateMap();

  // Auto-open merge modal if ?merge=true query param is present
  useEffect(() => {
    if (searchParams.get('merge') === 'true' && viewMode === 'own-map' && !showMergeModal) {
      setShowMergeModal(true);
    }
  }, [searchParams, viewMode, showMergeModal]);

  // Determine what type of ID we're dealing with and fetch accordingly
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        // Check if this is a user map (UUID or share slug)
        if (isUUID(careerId) || isShareSlug(careerId)) {
          // Try to fetch as a user map first
          const mapResponse = await fetch(`/api/map/${careerId}`);

          if (mapResponse.ok) {
            const mapResult = await mapResponse.json();

            if (mapResult.success) {
              // It's a user map
              setData({
                career: mapResult.data.career,
                skillGraph: mapResult.data.skillGraph,
              });
              setUserMap(mapResult.data.map);
              setMapOwner(mapResult.data.owner);
              setViewMode(mapResult.data.isOwner ? 'own-map' : 'other-map');
              setIsSaved(true);
              setIsLoading(false);
              return;
            }
          }

          // If it's a UUID but not a user map, try as career ID
          if (isUUID(careerId)) {
            const careerResponse = await fetch(`/api/career/${careerId}?locale=${locale}`);
            const careerResult = await careerResponse.json();

            if (careerResult.success) {
              setData(careerResult.data);
              setViewMode('base');
              setIsLoading(false);
              return;
            }
          }

          // Not found as either
          setError(t('career.notFound'));
          setIsLoading(false);
          return;
        }

        // It's a canonical key - fetch or generate career
        const fetchResponse = await fetch(`/api/career/${careerId}?locale=${locale}`);
        const fetchResult = await fetchResponse.json();

        if (fetchResult.success) {
          setData(fetchResult.data);
          setViewMode('base');
          setIsLoading(false);
          return;
        }

        // Generate new career
        setIsGenerating(true);
        const generateResponse = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ career: careerId.replace(/-/g, ' '), locale }),
        });

        const generateResult = await generateResponse.json();

        if (generateResult.success) {
          setData(generateResult.data);
          setViewMode('base');
        } else {
          setError(generateResult.error || t('career.failedToLoad'));
        }
      } catch {
        setError(t('career.failedToLoad'));
      } finally {
        setIsLoading(false);
        setIsGenerating(false);
      }
    }

    fetchData();
  }, [careerId, locale, t]);

  // Show sign-in prompt for unauthenticated users on base career (only once)
  useEffect(() => {
    if (!isLoading && data && viewMode === 'base' && authStatus === 'unauthenticated' && !hasShownPromptRef.current) {
      const timeout = setTimeout(() => {
        setShowSignInPrompt(true);
        hasShownPromptRef.current = true;
      }, SIGN_IN_PROMPT_DELAY_MS);
      return () => clearTimeout(timeout);
    }
  }, [isLoading, data, viewMode, authStatus]);

  // Fork a base career to create user's own map
  const forkCareer = useCallback(async () => {
    if (!session?.user?.id || !data?.career?.id) return null;

    setIsForking(true);
    try {
      const response = await fetch('/api/map/fork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ careerId: data.career.id }),
      });

      const result = await response.json();

      if (result.success && result.map?.id) {
        // Redirect to the new map URL
        router.replace(`/career/${result.map.id}`);
        return result.map.id;
      }
    } catch {
      // Fork failed silently - user can retry
    } finally {
      setIsForking(false);
    }
    return null;
  }, [session?.user?.id, data?.career?.id, router]);

  // Auto-fork for logged-in users viewing a base career
  const hasAutoForkedRef = useRef(false);
  useEffect(() => {
    if (
      !isLoading &&
      data?.career?.id &&
      viewMode === 'base' &&
      authStatus === 'authenticated' &&
      session?.user?.id &&
      !hasAutoForkedRef.current &&
      !isForking
    ) {
      hasAutoForkedRef.current = true;
      forkCareer();
    }
  }, [isLoading, data?.career?.id, viewMode, authStatus, session?.user?.id, isForking, forkCareer]);

  // Copy someone else's public map
  const copyMap = useCallback(async () => {
    if (!session?.user?.id || !userMap?.id) return;

    setIsCopying(true);
    try {
      const response = await fetch(`/api/map/${userMap.id}/copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const result = await response.json();

      if (result.success) {
        router.push(`/career/${result.map.id}`);
      }
    } catch {
      // Copy failed silently - user can retry
    } finally {
      setIsCopying(false);
    }
  }, [session?.user?.id, userMap?.id, router]);

  // Save changes to user's own map
  const saveGraph = useCallback(async (nodeData: UserNodeData[]) => {
    if (!session?.user?.id || !userMap?.id) return;

    setIsSaving(true);
    try {
      await updateMapMutation.mutateAsync({
        mapId: userMap.id,
        updates: { nodeData },
      });
      setIsSaved(true);
      setUserMap(prev => prev ? { ...prev, nodeData } : null);
    } catch {
      // Save failed silently - will retry on next change
    } finally {
      setIsSaving(false);
    }
  }, [session?.user?.id, userMap?.id, updateMapMutation]);

  // Handle graph changes
  const handleGraphChange = useCallback(async (nodes: Node[]) => {
    // If viewing someone else's map or base career, do nothing
    // (base career auto-forks on page load, so changes won't persist until redirected)
    if (viewMode !== 'own-map') return;

    // If not signed in, do nothing
    if (!session?.user?.id) return;

    // Save to existing map
    const nodeData: UserNodeData[] = nodes
      .filter(n => n.type === 'skill')
      .map(n => ({
        skillId: n.id,
        progress: (n.data as SkillNodeData).progress,
        position: n.position,
      }));

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveGraph(nodeData);
    }, AUTO_SAVE_DEBOUNCE_MS);
  }, [viewMode, session?.user?.id, saveGraph]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Handle AI chat modifications
  const handleApplyModifications = useCallback((newNodes: SkillNode[], newEdges: SkillEdge[]) => {
    if (!data) return;

    // Store previous state for undo
    const currentNodes = chatModifiedNodes || data.skillGraph.nodes as SkillNode[];
    const currentEdges = chatModifiedEdges || data.skillGraph.edges as SkillEdge[];
    setPreviousGraphState({ nodes: currentNodes, edges: currentEdges });

    // Apply new state
    setChatModifiedNodes(newNodes);
    setChatModifiedEdges(newEdges);

    // Mark as unsaved
    setIsSaved(false);
  }, [data, chatModifiedNodes, chatModifiedEdges]);

  // Handle undo
  const handleUndo = useCallback(() => {
    if (previousGraphState) {
      setChatModifiedNodes(previousGraphState.nodes);
      setChatModifiedEdges(previousGraphState.edges);
      setPreviousGraphState(null);
      setIsSaved(false);
    }
  }, [previousGraphState]);

  // Delete confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Open delete confirmation
  const openDeleteConfirm = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  // Handle delete confirmation
  const handleConfirmDelete = useCallback(async () => {
    if (!userMap?.id) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`${API_ROUTES.MAP}/${userMap.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showToast.success(t('career.deleteSuccess'));
        router.push('/dashboard');
      } else {
        showToast.error(t('career.deleteFailed'));
      }
    } catch {
      showToast.error(t('career.deleteFailed'));
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [userMap?.id, router, t]);

  // Cancel delete
  const handleCancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
  }, []);

  // Check for graph completion and show expand prompt
  useEffect(() => {
    // Only for own-map view, logged-in users
    if (viewMode !== 'own-map' || !session?.user?.id) return;
    if (hasShownExpandPrompt) return;
    if (!data?.skillGraph?.nodes || data.skillGraph.nodes.length === 0) return;

    // Get current nodes with progress
    const currentNodes = chatModifiedNodes || data.skillGraph.nodes;
    const savedNodeData = userMap?.nodeData || [];

    // Check if all skills are completed (>= SKILL_PASS_THRESHOLD)
    const allCompleted = currentNodes.length > 0 && currentNodes.every(node => {
      const saved = savedNodeData.find(s => s.skillId === node.id);
      const progress = saved?.progress ?? node.progress;
      return progress >= SKILL_PASS_THRESHOLD;
    });

    if (allCompleted) {
      setShowExpandModal(true);
      setHasShownExpandPrompt(true);
    }
  }, [viewMode, session?.user?.id, data?.skillGraph?.nodes, chatModifiedNodes, userMap?.nodeData, hasShownExpandPrompt]);

  // Handle expand skills
  const handleExpandSkills = useCallback(async () => {
    if (!data || !userMap?.id) return;

    setShowExpandModal(false);
    setIsExpanding(true);

    const loadingToast = showToast.loading(t('career.graphComplete.expanding'));

    try {
      const currentNodes = chatModifiedNodes || data.skillGraph.nodes;
      const currentEdges = chatModifiedEdges || data.skillGraph.edges;

      const response = await fetch('/api/ai/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          careerTitle: userMap.title || data.career.title,
          nodes: currentNodes,
          edges: currentEdges,
          locale,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        if (result.code === 'INSUFFICIENT_CREDITS') {
          showToast.dismiss(loadingToast);
          showToast.error(t('common.insufficientCredits'));
          return;
        }
        throw new Error(result.error || 'Failed to generate advanced skills');
      }

      if (result.data.nodes.length === 0) {
        showToast.dismiss(loadingToast);
        showToast.error(t('career.graphComplete.expandFailed'));
        return;
      }

      // Store previous state for undo
      setPreviousGraphState({
        nodes: currentNodes as SkillNode[],
        edges: currentEdges as SkillEdge[],
      });

      // Merge new skills with existing
      const mergedNodes = [...currentNodes, ...result.data.nodes];
      const mergedEdges = [...currentEdges, ...result.data.edges];

      // Apply to local state
      setChatModifiedNodes(mergedNodes as SkillNode[]);
      setChatModifiedEdges(mergedEdges as SkillEdge[]);

      // Save to database
      await updateMapMutation.mutateAsync({
        mapId: userMap.id,
        updates: {
          customNodes: mergedNodes,
          customEdges: mergedEdges,
        },
      });

      setIsSaved(true);
      showToast.dismiss(loadingToast);
      showToast.success(t('career.graphComplete.expandSuccess', { count: result.data.nodes.length }));
    } catch (error) {
      console.error('Failed to expand skills:', error);
      showToast.dismiss(loadingToast);
      showToast.error(t('career.graphComplete.expandFailed'));
    } finally {
      setIsExpanding(false);
    }
  }, [data, userMap, chatModifiedNodes, chatModifiedEdges, locale, t, updateMapMutation]);

  // Sort/organize nodes
  const handleSortNodes = useCallback(() => {
    skillGraphRef.current?.sortNodes();
  }, []);

  // Open share modal
  const handleOpenShare = useCallback(async () => {
    setShowShareModal(true);
    setCurrentSlide('full');
    setSlidePreviews({ full: null, completed: null, summary: null });
    await captureSlidePreview('full');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save merged graph to database
  const saveMergedGraph = useCallback(async (
    nodes: SkillNode[],
    edges: SkillEdge[],
    title: string,
    sourceMapIdToDelete?: string
  ) => {
    if (!session?.user?.id || !userMap?.id) return false;

    try {
      await updateMapMutation.mutateAsync({
        mapId: userMap.id,
        updates: {
          title,
          customNodes: nodes,
          customEdges: edges,
          deleteSourceMapId: sourceMapIdToDelete,
        },
      });
      setIsSaved(true);
      return true;
    } catch {
      // Save failed silently
    }
    return false;
  }, [session?.user?.id, userMap?.id, updateMapMutation]);

  // Handle merge complete
  const handleMergeComplete = useCallback(async (
    newNodes: SkillNode[],
    newEdges: SkillEdge[],
    newTitle: string,
    sourceMapId: string
  ) => {
    // Store previous state for undo
    if (data) {
      const currentNodes = chatModifiedNodes || data.skillGraph.nodes as SkillNode[];
      const currentEdges = chatModifiedEdges || data.skillGraph.edges as SkillEdge[];
      setPreviousGraphState({ nodes: currentNodes, edges: currentEdges });
    }

    // Apply merged state locally
    setChatModifiedNodes(newNodes);
    setChatModifiedEdges(newEdges);

    // Update user map title if we have one
    if (userMap) {
      setUserMap(prev => prev ? { ...prev, title: newTitle } : null);
    }

    // Save to database (including deleting source map)
    const saved = await saveMergedGraph(newNodes, newEdges, newTitle, sourceMapId);
    setIsSaved(saved);
  }, [data, chatModifiedNodes, chatModifiedEdges, userMap, saveMergedGraph]);

  // Convert skill data to React Flow format
  const convertToReactFlowFormat = (
    nodes: SkillNodeData[],
    edges: SkillEdgeData[],
    savedData?: UserNodeData[] | null
  ): { nodes: Node[]; edges: Edge[] } => {
    const savedMap = new Map<string, UserNodeData>();
    if (savedData) {
      savedData.forEach((item) => savedMap.set(item.skillId, item));
    }

    const flowNodes: Node[] = nodes.map((skill) => {
      const saved = savedMap.get(skill.id);
      return {
        id: skill.id,
        type: 'skill',
        position: saved?.position || { x: 0, y: 0 },
        data: {
          ...skill,
          progress: saved?.progress ?? skill.progress,
        },
      };
    });

    const flowEdges: Edge[] = edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      animated: edge.animated ?? true,
      type: 'skill',
    }));

    return { nodes: flowNodes, edges: flowEdges };
  };

  // Calculate overall progress
  const calculateProgress = (nodes: SkillNodeData[]): number => {
    if (nodes.length === 0) return 0;
    const totalProgress = nodes.reduce((sum, node) => sum + node.progress, 0);
    return Math.round(totalProgress / nodes.length);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-slate-400">
            {isGenerating ? t('career.generating') : t('career.loading')}
          </p>
          {isGenerating && (
            <p className="text-sm text-slate-500 mt-2">
              {t('career.generatingSubtext')}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassPanel className="p-8 text-center max-w-md">
          <div className="text-4xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-white mb-2">{t('career.oops')}</h2>
          <p className="text-slate-400 mb-4">{error || t('career.failedToLoad')}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 rounded-lg text-white transition-colors"
          >
            {t('common.goBackHome')}
          </button>
        </GlassPanel>
      </div>
    );
  }

  const { career, skillGraph } = data;
  // Use chat-modified nodes/edges if available, otherwise use original
  const skillNodes = (chatModifiedNodes || skillGraph.nodes) as SkillNodeData[];
  const skillEdges = (chatModifiedEdges || skillGraph.edges) as SkillEdgeData[];
  const nodeData = userMap?.nodeData || null;
  const { nodes, edges } = convertToReactFlowFormat(skillNodes, skillEdges, nodeData);

  // Calculate progress
  const nodesWithProgress = nodeData
    ? skillNodes.map((n) => {
        const saved = nodeData.find((s) => s.skillId === n.id);
        return { ...n, progress: saved?.progress ?? n.progress };
      })
    : skillNodes;
  const overallProgress = calculateProgress(nodesWithProgress);

  const completedSkills = nodesWithProgress
    .filter((n) => n.progress >= SKILL_PASS_THRESHOLD)
    .map((n) => n.name);

  const captureSlidePreview = async (slideType: ShareSlideType) => {
    const nodePositions = skillGraphRef.current?.getNodePositions() || [];
    const preview = await capturePreview(graphContainerRef.current, {
      careerTitle: userMap?.title || career.title,
      progress: overallProgress,
      slideType,
      completedSkills,
      totalSkills: nodesWithProgress.length,
      nodePositions,
    });
    setSlidePreviews(prev => ({ ...prev, [slideType]: preview }));
    return preview;
  };

  const handleSlideChange = async (slideType: ShareSlideType) => {
    setCurrentSlide(slideType);
    if (!slidePreviews[slideType]) {
      await captureSlidePreview(slideType);
    }
  };

  const displayTitle = userMap?.title || career.title;
  const isReadOnly = viewMode === 'other-map';

  return (
    <div className="min-h-screen flex flex-col pt-16">
      {/* Career Sub-header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">{displayTitle}</h1>
                {viewMode === 'other-map' && mapOwner && (
                  <span className="text-sm text-slate-400">
                    {t('career.by')} {mapOwner.name || t('career.anonymous')}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400">{career.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* View mode indicators and actions */}
            {viewMode === 'other-map' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
                  {t('career.viewOnly')}
                </span>
                {session?.user && (
                  <button
                    onClick={copyMap}
                    disabled={isCopying}
                    className="px-3 py-1.5 text-sm bg-amber-500 hover:bg-amber-400 disabled:bg-slate-600 text-slate-900 font-medium rounded-lg transition-colors flex items-center gap-1"
                  >
                    {isCopying ? (
                      <>
                        <div className="w-3 h-3 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                        {t('career.copying')}
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        {t('career.copyToMyMaps')}
                      </>
                    )}
                  </button>
                )}
              </div>
            )}


            {/* Save status for own map */}
            {viewMode === 'own-map' && session?.user && (
              <div className="flex items-center gap-2 text-sm">
                {isSaving ? (
                  <span className="text-slate-400 flex items-center gap-1">
                    <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                    {t('common.saving')}
                  </span>
                ) : isSaved ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t('common.saved')}
                  </span>
                ) : null}
              </div>
            )}

            {/* 3-dots menu for own map */}
            {viewMode === 'own-map' && session?.user && (
              <DropdownMenu
                items={[
                  {
                    id: 'merge',
                    label: t('career.menu.merge'),
                    icon: <MergeIcon className="w-4 h-4" />,
                    onClick: () => setShowMergeModal(true),
                  },
                  {
                    id: 'sort',
                    label: t('career.menu.sort'),
                    icon: <SortIcon className="w-4 h-4" />,
                    onClick: handleSortNodes,
                  },
                  {
                    id: 'share',
                    label: t('career.menu.share'),
                    icon: <ShareIcon className="w-4 h-4" />,
                    onClick: handleOpenShare,
                  },
                  {
                    id: 'delete',
                    label: t('career.menu.delete'),
                    icon: <TrashIcon className="w-4 h-4" />,
                    onClick: openDeleteConfirm,
                    variant: 'danger',
                    disabled: isDeleting,
                  },
                ]}
                position="bottom-right"
              />
            )}

            {/* Share button for non-owner views */}
            {viewMode !== 'own-map' && (
              <button
                onClick={handleOpenShare}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors group"
                title={t('career.share')}
              >
                <ShareIcon className="h-5 w-5 text-slate-400 group-hover:text-amber-400 transition-colors" />
              </button>
            )}
            <XPProgressRing progress={overallProgress} size={60} strokeWidth={4} />
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">{t('career.totalSkills')}:</span>
            <span className="text-white font-semibold">{nodes.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">{t('career.unlocked')}:</span>
            <span className="text-cyan-400 font-semibold">
              {nodesWithProgress.filter((n) => n.progress > 0).length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">{t('career.mastered')}:</span>
            <span className="text-amber-400 font-semibold">
              {nodesWithProgress.filter((n) => n.progress >= SKILL_PASS_THRESHOLD).length}
            </span>
          </div>
        </div>
      </div>

      {/* Skill Graph */}
      <main className="flex-1 relative">
        <div ref={graphContainerRef} className="absolute inset-0">
          <LazySkillGraph
            ref={skillGraphRef}
            key={userMap?.id || 'base'}
            initialNodes={nodes}
            initialEdges={edges}
            careerTitle={displayTitle}
            careerDescription={career.description || ''}
            onNodesChange={isReadOnly ? undefined : handleGraphChange}
            readOnly={isReadOnly}
          />
        </div>
      </main>

      {/* Sign-in Prompt Modal */}
      {showSignInPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <GlassPanel className="max-w-md w-full p-6">
            <div className="text-center">
              <div className="text-5xl mb-4">💾</div>
              <h2 className="text-xl font-bold text-white mb-2">{t('career.saveProgress')}</h2>
              <p className="text-slate-400 mb-6">
                {t('career.saveDescription')}
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setShowSignInPrompt(false);
                    router.push('/?signin=true');
                  }}
                  className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors"
                >
                  {t('career.signInToSave')}
                </button>
                <button
                  onClick={() => setShowSignInPrompt(false)}
                  className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium rounded-lg transition-colors"
                >
                  {t('career.continueWithoutSaving')}
                </button>
              </div>
            </div>
          </GlassPanel>
        </div>
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setSlidePreviews({ full: null, completed: null, summary: null });
        }}
        previews={slidePreviews}
        isCapturing={isCapturing}
        careerTitle={displayTitle}
        progress={overallProgress}
        filename={`${displayTitle.toLowerCase().replace(/\s+/g, '-')}-${currentSlide}.png`}
        currentSlide={currentSlide}
        onSlideChange={handleSlideChange}
        onDownload={(slideType) => {
          const preview = slidePreviews[slideType];
          if (preview) {
            downloadFromDataUrl(preview, `${displayTitle.toLowerCase().replace(/\s+/g, '-')}-${slideType}.png`);
          }
        }}
        onCopy={(slideType) => {
          const preview = slidePreviews[slideType];
          return preview ? copyFromDataUrl(preview) : Promise.resolve(false);
        }}
        onNativeShare={(slideType) => {
          const preview = slidePreviews[slideType];
          const shareUrl = userMap?.shareSlug
            ? `${window.location.origin}/${locale}/career/${userMap.shareSlug}`
            : userMap?.id
            ? `${window.location.origin}/${locale}/career/${userMap.id}`
            : window.location.href;
          return preview
            ? shareFromDataUrl(
                preview,
                `My ${displayTitle} Skill Map`,
                `Check out my ${displayTitle} skill map! ${overallProgress}% complete 🗺️\n\n${shareUrl}`
              )
            : Promise.resolve(false);
        }}
        // Link sharing props
        mapId={userMap?.id}
        shareSlug={userMap?.shareSlug}
        locale={locale}
      />

      {/* AI Chat Panel */}
      <AIChatPanel
        careerTitle={displayTitle}
        careerDescription={career.description || ''}
        currentNodes={skillNodes as SkillNode[]}
        currentEdges={skillEdges as SkillEdge[]}
        onApplyModifications={handleApplyModifications}
        onUndo={handleUndo}
        canUndo={previousGraphState !== null}
        locale={locale as Locale}
        isReadOnly={isReadOnly}
      />

      {/* Merge Map Modal */}
      <MergeMapModal
        isOpen={showMergeModal}
        onClose={() => setShowMergeModal(false)}
        currentMapId={userMap?.id || ''}
        currentMapTitle={displayTitle}
        currentNodes={skillNodes as SkillNode[]}
        currentEdges={skillEdges as SkillEdge[]}
        locale={locale as Locale}
        onMergeComplete={handleMergeComplete}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title={t('career.deleteTitle')}
        message={t('career.confirmDelete')}
        confirmText={t('career.menu.delete')}
        cancelText={t('common.cancel')}
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Graph Completion Expand Modal */}
      <ConfirmModal
        isOpen={showExpandModal}
        onConfirm={handleExpandSkills}
        onCancel={() => setShowExpandModal(false)}
        title={t('career.graphComplete.title')}
        message={t('career.graphComplete.message')}
        confirmText={t('career.graphComplete.expand')}
        cancelText={t('career.graphComplete.later')}
        variant="default"
        isLoading={isExpanding}
      />
    </div>
  );
}
