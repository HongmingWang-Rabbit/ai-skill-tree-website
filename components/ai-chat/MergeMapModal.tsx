'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { GlassPanel, MergeIcon, CloseIcon } from '@/components/ui';
import { type SkillNode, type SkillEdge } from '@/lib/schemas';
import { type Locale } from '@/i18n/routing';
import { API_ROUTES, MERGE_CONFIG } from '@/lib/constants';

interface UserMap {
  id: string;
  title: string;
  careerTitle: string;
  updatedAt?: string;
  isSimilar?: boolean;
}

// Check if two strings are similar (share common words)
function calculateSimilarity(str1: string, str2: string): number {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/g, ' ').split(/\s+/).filter(Boolean);
  const words1 = new Set(normalize(str1));
  const words2 = new Set(normalize(str2));

  if (words1.size === 0 || words2.size === 0) return 0;

  let matches = 0;
  for (const word of words1) {
    if (words2.has(word) || [...words2].some(w => w.includes(word) || word.includes(w))) {
      matches++;
    }
  }

  return matches / Math.max(words1.size, words2.size);
}

interface MergeMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMapId: string;
  currentMapTitle: string;
  currentNodes: SkillNode[];
  currentEdges: SkillEdge[];
  locale: Locale;
  onMergeComplete: (nodes: SkillNode[], edges: SkillEdge[], newTitle: string, sourceMapId: string) => void;
}

export function MergeMapModal({
  isOpen,
  onClose,
  currentMapId,
  currentMapTitle,
  currentNodes,
  currentEdges,
  locale,
  onMergeComplete,
}: MergeMapModalProps) {
  const t = useTranslations('aiChat');
  const [userMaps, setUserMaps] = useState<UserMap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [isMerging, setIsMerging] = useState(false);
  const [mergePreview, setMergePreview] = useState<{
    nodes: SkillNode[];
    edges: SkillEdge[];
    title: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's maps
  useEffect(() => {
    if (!isOpen) return;

    async function fetchMaps() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(API_ROUTES.USER_GRAPH);
        if (response.ok) {
          const result = await response.json();
          // API returns { graphs: [{ graph: {...}, career: {...} }] }
          // Filter out the current map, calculate similarity, and sort
          const maps: (UserMap & { similarity: number })[] = (result.graphs || [])
            .filter((item: { graph: { id: string } }) => item.graph.id !== currentMapId)
            .map((item: { graph: { id: string; title: string | null }; career: { title: string } | null }) => {
              const mapTitle = item.graph.title || item.career?.title || '';
              const careerTitle = item.career?.title || '';
              // Calculate similarity with current map title
              const titleSimilarity = calculateSimilarity(currentMapTitle, mapTitle);
              const careerSimilarity = calculateSimilarity(currentMapTitle, careerTitle);
              const similarity = Math.max(titleSimilarity, careerSimilarity);

              return {
                id: item.graph.id,
                title: item.graph.title || item.career?.title || t('untitled'),
                careerTitle: item.career?.title || t('unknownCareer'),
                isSimilar: similarity >= MERGE_CONFIG.similarityThreshold,
                similarity,
              };
            })
            // Sort by similarity (highest first), then by title
            .sort((a: { similarity: number; title: string }, b: { similarity: number; title: string }) => {
              if (b.similarity !== a.similarity) return b.similarity - a.similarity;
              return a.title.localeCompare(b.title);
            });

          setUserMaps(maps);
        }
      } catch {
        setError(t('errorLoadingMaps'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchMaps();
  }, [isOpen, currentMapId, currentMapTitle, t]);

  const handleSelectMap = useCallback((mapId: string) => {
    setSelectedMapId(mapId);
    setMergePreview(null);
  }, []);

  const handlePreviewMerge = useCallback(async () => {
    if (!selectedMapId) return;

    const selectedMap = userMaps.find(m => m.id === selectedMapId);
    if (!selectedMap) return;

    setIsMerging(true);
    setError(null);

    try {
      // Fetch the selected map's data
      const mapResponse = await fetch(`${API_ROUTES.MAP}/${selectedMapId}`);
      if (!mapResponse.ok) throw new Error('Failed to fetch map');

      const mapResult = await mapResponse.json();
      if (!mapResult.success) throw new Error(mapResult.error);

      const sourceNodes = mapResult.data.skillGraph.nodes as SkillNode[];
      const sourceEdges = mapResult.data.skillGraph.edges as SkillEdge[];

      // Call merge API to generate smart merge
      const mergeResponse = await fetch(API_ROUTES.AI_MERGE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceNodes,
          sourceEdges,
          sourceCareerTitle: selectedMap.careerTitle,
          targetNodes: currentNodes,
          targetEdges: currentEdges,
          targetCareerTitle: currentMapTitle,
          locale,
        }),
      });

      if (!mergeResponse.ok) throw new Error('Failed to merge maps');

      const mergeResult = await mergeResponse.json();
      if (!mergeResult.success) throw new Error(mergeResult.error);

      setMergePreview({
        nodes: mergeResult.data.nodes,
        edges: mergeResult.data.edges,
        title: mergeResult.data.mergedTitle,
      });
    } catch (err) {
      setError(t('errorMerging'));
      console.error('Merge error:', err);
    } finally {
      setIsMerging(false);
    }
  }, [selectedMapId, userMaps, currentNodes, currentEdges, currentMapTitle, locale, t]);

  const handleApplyMerge = useCallback(() => {
    if (!mergePreview || !selectedMapId) return;
    onMergeComplete(mergePreview.nodes, mergePreview.edges, mergePreview.title, selectedMapId);
    // Reset state before closing so modal is fresh when reopened
    setSelectedMapId(null);
    setMergePreview(null);
    setError(null);
    onClose();
  }, [mergePreview, selectedMapId, onMergeComplete, onClose]);

  const handleClose = useCallback(() => {
    setSelectedMapId(null);
    setMergePreview(null);
    setError(null);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg max-h-[80vh] overflow-hidden"
        >
          <GlassPanel className="p-6 flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center">
                  <MergeIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">{t('mergeTitle')}</h3>
                  <p className="text-sm text-slate-400">{t('mergeDescription')}</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full" />
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-400">{error}</p>
                </div>
              ) : userMaps.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-400">{t('noOtherMaps')}</p>
                </div>
              ) : !mergePreview ? (
                <div className="space-y-2">
                  <p className="text-sm text-slate-400 mb-3">{t('selectMapToMerge')}</p>
                  {userMaps.map((map) => (
                    <button
                      key={map.id}
                      onClick={() => handleSelectMap(map.id)}
                      className={`
                        w-full text-left p-3 rounded-lg border transition-all relative
                        ${selectedMapId === map.id
                          ? 'border-violet-500 bg-violet-500/10'
                          : map.isSimilar
                            ? 'border-amber-500/50 bg-amber-500/5 hover:border-amber-500 hover:bg-amber-500/10'
                            : 'border-slate-700/50 hover:border-slate-600 bg-slate-800/30'
                        }
                      `}
                    >
                      {map.isSimilar && (
                        <span className="absolute top-2 right-2 text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                          {t('recommended')}
                        </span>
                      )}
                      <div className={`font-medium ${map.isSimilar ? 'text-amber-200' : 'text-slate-200'}`}>{map.title}</div>
                      <div className={`text-sm ${map.isSimilar ? 'text-amber-400/70' : 'text-slate-400'}`}>{map.careerTitle}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <h4 className="font-medium text-green-400 mb-2">{t('mergePreview')}</h4>
                    <div className="text-sm text-slate-300 space-y-1">
                      <p><span className="text-slate-400">{t('newTitle')}:</span> {mergePreview.title}</p>
                      <p><span className="text-slate-400">{t('totalSkillsAfterMerge')}:</span> {mergePreview.nodes.length}</p>
                      <p><span className="text-slate-400">{t('totalConnectionsAfterMerge')}:</span> {mergePreview.edges.length}</p>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500">
                    {t('mergeWarning')}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-4 pt-4 border-t border-slate-700/50">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-colors"
              >
                {t('cancel')}
              </button>
              {!mergePreview ? (
                <button
                  onClick={handlePreviewMerge}
                  disabled={!selectedMapId || isMerging}
                  className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isMerging ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      {t('merging')}
                    </>
                  ) : (
                    t('previewMerge')
                  )}
                </button>
              ) : (
                <button
                  onClick={handleApplyMerge}
                  className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:opacity-90 transition-opacity"
                >
                  {t('applyMerge')}
                </button>
              )}
            </div>
          </GlassPanel>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
