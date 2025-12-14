'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  GlassPanel,
  CloseIcon,
  BookOpenIcon,
  ExternalLinkIcon,
  StarIcon,
} from '@/components/ui';
import { API_ROUTES, LEARNING_CONFIG } from '@/lib/constants';
import type { SkillNodeData } from '@/lib/db/schema';
import type { LearningResource } from '@/lib/schemas';

interface LearningResourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  skill: SkillNodeData | null;
}

export function LearningResourcesModal({
  isOpen,
  onClose,
  skill,
}: LearningResourcesModalProps) {
  const t = useTranslations('learning');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [affiliatedLinks, setAffiliatedLinks] = useState<LearningResource[]>([]);
  const [webResults, setWebResults] = useState<LearningResource[]>([]);

  const fetchResources = useCallback(async () => {
    if (!skill) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        skillName: skill.name,
        ...(skill.category && { category: skill.category }),
        ...(skill.level && { level: skill.level.toString() }),
      });

      const response = await fetch(`${API_ROUTES.LEARNING_RESOURCES}?${params}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || t('fetchFailed'));
      }

      setAffiliatedLinks(data.data.affiliatedLinks);
      setWebResults(data.data.webResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('fetchFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [skill, t]);

  useEffect(() => {
    if (isOpen && skill) {
      fetchResources();
    }
  }, [isOpen, skill, fetchResources]);

  const handleResourceClick = (resource: LearningResource) => {
    // Open in new tab
    window.open(resource.url, '_blank', 'noopener,noreferrer');
  };

  const getPlatformInfo = (platform: string) => {
    return LEARNING_CONFIG.platformInfo[platform as keyof typeof LEARNING_CONFIG.platformInfo]
      || LEARNING_CONFIG.platformInfo.other;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-2xl overflow-hidden"
          style={{ maxHeight: `${LEARNING_CONFIG.modal.maxHeightVh}vh` }}
        >
          <GlassPanel className="p-0 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <BookOpenIcon className="w-6 h-6 text-amber-400" />
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {t('title', { skill: skill?.name ?? '' })}
                  </h2>
                  <p className="text-sm text-slate-400">{t('subtitle')}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <CloseIcon className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div
              className="overflow-y-auto p-4 space-y-4"
              style={{ maxHeight: `calc(${LEARNING_CONFIG.modal.maxHeightVh}vh - ${LEARNING_CONFIG.modal.headerHeightPx}px)` }}
            >
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <p className="mt-3 text-slate-400">{t('searching')}</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-400">{error}</p>
                  <button
                    onClick={fetchResources}
                    className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg"
                  >
                    {t('tryAgain')}
                  </button>
                </div>
              ) : (
                <>
                  {/* Affiliated Links Section */}
                  {affiliatedLinks.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <StarIcon className="w-4 h-4 text-amber-400" />
                        <h3 className="text-sm font-semibold text-amber-400">
                          {t('recommended')}
                        </h3>
                      </div>
                      <div className="space-y-2">
                        {affiliatedLinks.map((resource) => (
                          <ResourceCard
                            key={resource.id}
                            resource={resource}
                            onClick={() => handleResourceClick(resource)}
                            getPlatformInfo={getPlatformInfo}
                            isHighlighted
                            recommendedLabel={t('recommended')}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Web Search Results */}
                  {webResults.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-slate-400">
                        {t('moreResources')}
                      </h3>
                      <div className="space-y-2">
                        {webResults.map((resource) => (
                          <ResourceCard
                            key={resource.id}
                            resource={resource}
                            onClick={() => handleResourceClick(resource)}
                            getPlatformInfo={getPlatformInfo}
                            recommendedLabel={t('recommended')}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {affiliatedLinks.length === 0 && webResults.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-slate-400">{t('noResults')}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </GlassPanel>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

interface ResourceCardProps {
  resource: LearningResource;
  onClick: () => void;
  getPlatformInfo: (platform: string) => { name: string; icon: string; color: string };
  isHighlighted?: boolean;
  recommendedLabel: string;
}

function ResourceCard({ resource, onClick, getPlatformInfo, isHighlighted, recommendedLabel }: ResourceCardProps) {
  const platformInfo = getPlatformInfo(resource.platform);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg transition-all hover:scale-[1.01] ${
        isHighlighted
          ? 'bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20'
          : 'bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{platformInfo.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-white truncate">{resource.title}</h4>
            <ExternalLinkIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
          </div>
          <p className="text-sm text-slate-400 line-clamp-2 mt-1">
            {resource.description}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${platformInfo.color}20`, color: platformInfo.color }}
            >
              {platformInfo.name}
            </span>
            {resource.isAffiliated && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                {recommendedLabel}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
