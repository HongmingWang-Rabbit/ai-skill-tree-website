'use client';

import { useEffect, useState, use, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import { SkillGraph, type SkillGraphHandle } from '@/components/skill-graph/SkillGraph';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { XPProgressRing } from '@/components/ui/XPProgressRing';
import { ShareModal } from '@/components/ui/ShareModal';
import { useShareScreenshot, type ShareSlideType } from '@/hooks/useShareScreenshot';
import { SKILL_PASS_THRESHOLD } from '@/lib/constants';
import { useRouter } from '@/i18n/navigation';
import type { Node, Edge } from '@xyflow/react';
import type { SkillNodeData } from '@/components/skill-graph/SkillNode';

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
}

interface SkillGraphData {
  id: string;
  careerId: string | null;
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

export default function CareerPage({ params }: { params: Promise<{ careerId: string; locale: string }> }) {
  const resolvedParams = use(params);
  const careerId = resolvedParams.careerId;
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();
  const { data: session, status: authStatus } = useSession();
  const [data, setData] = useState<CareerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userNodeData, setUserNodeData] = useState<UserNodeData[] | null>(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentSlide, setCurrentSlide] = useState<ShareSlideType>('full');
  const [slidePreviews, setSlidePreviews] = useState<Record<ShareSlideType, string | null>>({
    full: null,
    completed: null,
    summary: null,
  });
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasShownPromptRef = useRef(false);
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const skillGraphRef = useRef<SkillGraphHandle>(null);
  const { isCapturing, capturePreview, downloadFromDataUrl, copyFromDataUrl, shareFromDataUrl } = useShareScreenshot();

  // Fetch career data
  useEffect(() => {
    async function fetchOrGenerateCareer() {
      setIsLoading(true);
      setError(null);

      try {
        // First try to fetch existing career (with locale for cache lookup)
        const fetchResponse = await fetch(`/api/career/${careerId}?locale=${locale}`);
        const fetchResult = await fetchResponse.json();

        if (fetchResult.success) {
          setData(fetchResult.data);
          setIsLoading(false);
          return;
        }

        // If not found, generate new career in the current locale
        setIsGenerating(true);
        const generateResponse = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ career: careerId.replace(/-/g, ' '), locale }),
        });

        const generateResult = await generateResponse.json();

        if (generateResult.success) {
          setData(generateResult.data);
        } else {
          setError(generateResult.error || t('career.failedToLoad'));
        }
      } catch (err) {
        setError(t('career.failedToLoad'));
        console.error(err);
      } finally {
        setIsLoading(false);
        setIsGenerating(false);
      }
    }

    fetchOrGenerateCareer();
  }, [careerId, locale, t]);

  // Load user's saved progress if signed in
  useEffect(() => {
    async function loadUserProgress() {
      if (!session?.user?.id || !data?.career?.id) {
        setIsLoadingUserData(false);
        return;
      }

      setIsLoadingUserData(true);
      try {
        const response = await fetch(`/api/user/graph/${data.career.id}`);
        const result = await response.json();

        if (result.saved && result.graph) {
          setUserNodeData(result.graph.nodeData);
          setIsSaved(true);
        }
      } catch (err) {
        console.error('Failed to load user progress:', err);
      } finally {
        setIsLoadingUserData(false);
      }
    }

    // Set loading state immediately if user is signed in
    if (session?.user?.id && data?.career?.id) {
      setIsLoadingUserData(true);
    }
    loadUserProgress();
  }, [session?.user?.id, data?.career?.id]);

  // Show sign-in prompt after graph loads (only once)
  useEffect(() => {
    if (!isLoading && data && authStatus === 'unauthenticated' && !hasShownPromptRef.current) {
      // Small delay to let user see the graph first
      const timeout = setTimeout(() => {
        setShowSignInPrompt(true);
        hasShownPromptRef.current = true;
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [isLoading, data, authStatus]);

  // Save function
  const saveGraph = useCallback(async (nodeData: UserNodeData[]) => {
    if (!session?.user?.id || !data?.career?.id) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/user/graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          careerId: data.career.id,
          nodeData,
        }),
      });

      if (response.ok) {
        setIsSaved(true);
        setUserNodeData(nodeData);
      }
    } catch (err) {
      console.error('Failed to save graph:', err);
    } finally {
      setIsSaving(false);
    }
  }, [session?.user?.id, data?.career?.id]);

  // Debounced save on changes
  const handleGraphChange = useCallback((nodes: Node[]) => {
    if (!session?.user?.id) {
      // Show sign-in prompt if not shown yet
      if (!hasShownPromptRef.current) {
        setShowSignInPrompt(true);
        hasShownPromptRef.current = true;
      }
      return;
    }

    // Extract node data for saving
    const nodeData: UserNodeData[] = nodes
      .filter(n => n.type === 'skill')
      .map(n => ({
        skillId: n.id,
        progress: (n.data as SkillNodeData).progress,
        position: n.position,
      }));

    // Debounce saves
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveGraph(nodeData);
    }, 1000);
  }, [session?.user?.id, saveGraph]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Convert skill data to React Flow format, applying user's saved data if available
  const convertToReactFlowFormat = (
    nodes: SkillNodeData[],
    edges: SkillEdgeData[],
    savedData?: UserNodeData[] | null
  ): { nodes: Node[]; edges: Edge[] } => {
    // Create a map of saved data for quick lookup
    const savedMap = new Map<string, UserNodeData>();
    if (savedData) {
      savedData.forEach((item) => savedMap.set(item.skillId, item));
    }

    const flowNodes: Node[] = nodes.map((skill) => {
      const saved = savedMap.get(skill.id);
      return {
        id: skill.id,
        type: 'skill',
        position: saved?.position || { x: 0, y: 0 }, // Use saved position or default
        data: {
          ...skill,
          progress: saved?.progress ?? skill.progress, // Use saved progress if available
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

  // Loading state - wait for career data and user progress (if signed in)
  const shouldShowLoading = isLoading || (session?.user?.id && isLoadingUserData);

  if (shouldShowLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-slate-400">
            {isGenerating
              ? t('career.generating')
              : isLoadingUserData
                ? t('career.loadingProgress')
                : t('career.loading')}
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
  const skillNodes = skillGraph.nodes as SkillNodeData[];
  const skillEdges = skillGraph.edges as SkillEdgeData[];
  const { nodes, edges } = convertToReactFlowFormat(skillNodes, skillEdges, userNodeData);

  // Calculate progress from nodes (which may include saved progress)
  const nodesWithProgress = userNodeData
    ? skillNodes.map((n) => {
        const saved = userNodeData.find((s) => s.skillId === n.id);
        return { ...n, progress: saved?.progress ?? n.progress };
      })
    : skillNodes;
  const overallProgress = calculateProgress(nodesWithProgress);

  // Get completed skills for summary slide
  const completedSkills = nodesWithProgress
    .filter((n) => n.progress >= SKILL_PASS_THRESHOLD)
    .map((n) => n.name);

  // Capture preview for a specific slide type
  const captureSlidePreview = async (slideType: ShareSlideType) => {
    // Get node positions from SkillGraph ref
    const nodePositions = skillGraphRef.current?.getNodePositions() || [];

    const preview = await capturePreview(graphContainerRef.current, {
      careerTitle: career.title,
      progress: overallProgress,
      slideType,
      completedSkills,
      totalSkills: nodesWithProgress.length,
      nodePositions,
    });
    setSlidePreviews(prev => ({ ...prev, [slideType]: preview }));
    return preview;
  };

  // Handle slide change
  const handleSlideChange = async (slideType: ShareSlideType) => {
    setCurrentSlide(slideType);
    // Capture if not already captured
    if (!slidePreviews[slideType]) {
      await captureSlidePreview(slideType);
    }
  };

  return (
    <div className="min-h-screen flex flex-col pt-16">
      {/* Career Sub-header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
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
              <h1 className="text-xl font-bold text-white">{career.title}</h1>
              <p className="text-sm text-slate-400">{career.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Save status indicator */}
            {session?.user && (
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
            {/* Share Button */}
            <button
              onClick={async () => {
                setShowShareModal(true);
                setCurrentSlide('full');
                setSlidePreviews({ full: null, completed: null, summary: null });
                // Capture first slide
                await captureSlidePreview('full');
              }}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors group"
              title={t('career.share')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-slate-400 group-hover:text-amber-400 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </button>
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
          <SkillGraph
            ref={skillGraphRef}
            key={userNodeData ? 'loaded' : 'initial'}
            initialNodes={nodes}
            initialEdges={edges}
            careerTitle={career.title}
            careerDescription={career.description || ''}
            onNodesChange={handleGraphChange}
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
        careerTitle={career.title}
        progress={overallProgress}
        filename={`${career.title.toLowerCase().replace(/\s+/g, '-')}-${currentSlide}.png`}
        currentSlide={currentSlide}
        onSlideChange={handleSlideChange}
        onDownload={(slideType) => {
          const preview = slidePreviews[slideType];
          if (preview) {
            downloadFromDataUrl(preview, `${career.title.toLowerCase().replace(/\s+/g, '-')}-${slideType}.png`);
          }
        }}
        onCopy={(slideType) => {
          const preview = slidePreviews[slideType];
          return preview ? copyFromDataUrl(preview) : Promise.resolve(false);
        }}
        onNativeShare={(slideType) => {
          const preview = slidePreviews[slideType];
          return preview
            ? shareFromDataUrl(
                preview,
                `My ${career.title} Skill Tree`,
                `Check out my ${career.title} skill tree progress - ${overallProgress}% complete!`
              )
            : Promise.resolve(false);
        }}
      />
    </div>
  );
}
