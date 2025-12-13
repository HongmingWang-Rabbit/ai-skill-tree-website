'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import {
  GlassPanel,
  CloseIcon,
  SparklesIcon,
  LinkIcon,
  WarningIcon,
} from '@/components/ui';
import { API_ROUTES, RESUME_CONFIG } from '@/lib/constants';
import { type ResumeContent, type JobRequirements } from '@/lib/ai-resume';
import { type WorkExperience } from '@/lib/schemas';
import { type Locale } from '@/i18n/routing';

// Dynamically import PDF download button to avoid SSR issues with @react-pdf/renderer
const PDFDownloadButton = dynamic(
  () => import('./PDFDownloadButton').then(mod => mod.PDFDownloadButton),
  {
    ssr: false,
    loading: () => (
      <div className="px-4 py-2 text-sm bg-amber-500/50 text-slate-900 font-semibold rounded-lg flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
        Loading...
      </div>
    ),
  }
);

export interface ResumeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: Locale;
}

type Stage = 'input' | 'generating' | 'preview';

interface ResumeData {
  profile: {
    name: string;
    email: string;
    bio: string;
  };
  experience: WorkExperience[];
  resumeContent: ResumeContent;
  jobRequirements: JobRequirements | null;
  stats: {
    totalSkills: number;
    masteredSkills: number;
    careerCount: number;
  };
}

export function ResumeExportModal({
  isOpen,
  onClose,
  locale,
}: ResumeExportModalProps) {
  const t = useTranslations('resume');
  const tCommon = useTranslations('common');

  const [stage, setStage] = useState<Stage>('input');
  const [jobTitle, setJobTitle] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [editedSummary, setEditedSummary] = useState('');
  const [isEditingSummary, setIsEditingSummary] = useState(false);

  const resetState = useCallback(() => {
    setStage('input');
    setJobTitle('');
    setJobUrl('');
    setError(null);
    setResumeData(null);
    setEditedSummary('');
    setIsEditingSummary(false);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  const handleGenerate = useCallback(async () => {
    setError(null);
    setStage('generating');

    try {
      const response = await fetch(API_ROUTES.RESUME_GENERATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale,
          jobTitle: jobTitle.trim() || undefined,
          jobUrl: jobUrl.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || t('generateFailed'));
      }

      setResumeData(data.data);
      setEditedSummary(data.data.resumeContent.professionalSummary);
      setStage('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('generateFailed'));
      setStage('input');
    }
  }, [locale, jobTitle, jobUrl, t]);

  const handleSaveSummary = useCallback(() => {
    if (resumeData) {
      setResumeData({
        ...resumeData,
        resumeContent: {
          ...resumeData.resumeContent,
          professionalSummary: editedSummary,
        },
      });
    }
    setIsEditingSummary(false);
  }, [resumeData, editedSummary]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && stage !== 'generating' && handleClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-2xl max-h-[85vh] overflow-hidden"
        >
          <GlassPanel className="p-0 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-semibold text-white">{t('modalTitle')}</h2>
              </div>
              <button
                onClick={handleClose}
                disabled={stage === 'generating'}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <CloseIcon className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-start gap-2">
                  <WarningIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              {/* Input Stage */}
              {stage === 'input' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-400">{t('modalSubtitle')}</p>

                  {/* Job Title Input */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      {t('jobTitleLabel')}
                    </label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      maxLength={RESUME_CONFIG.jobTitleMaxLength}
                      placeholder={t('jobTitlePlaceholder')}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-slate-700" />
                    <span className="text-xs text-slate-500 uppercase">{t('orText')}</span>
                    <div className="flex-1 h-px bg-slate-700" />
                  </div>

                  {/* Job URL Input */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <LinkIcon className="w-4 h-4 inline-block mr-1" />
                      {t('jobUrlLabel')}
                    </label>
                    <input
                      type="url"
                      value={jobUrl}
                      onChange={(e) => setJobUrl(e.target.value)}
                      placeholder={t('jobUrlPlaceholder')}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    <p className="mt-1 text-xs text-slate-500">{t('jobUrlHelp')}</p>
                  </div>

                  {/* Generate Button */}
                  <div className="pt-4">
                    <button
                      onClick={handleGenerate}
                      className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-900 font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <SparklesIcon className="w-5 h-5" />
                      {jobTitle || jobUrl ? t('generateTargeted') : t('generateGeneral')}
                    </button>
                  </div>
                </div>
              )}

              {/* Generating Stage */}
              {stage === 'generating' && (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-slate-300">{t('generating')}</p>
                  {jobUrl && <p className="text-sm text-slate-500 mt-2">{t('analyzingJob')}</p>}
                </div>
              )}

              {/* Preview Stage */}
              {stage === 'preview' && resumeData && (
                <div className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-amber-400">{resumeData.stats.totalSkills}</p>
                      <p className="text-xs text-slate-400">{t('totalSkills')}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-emerald-400">{resumeData.stats.masteredSkills}</p>
                      <p className="text-xs text-slate-400">{t('masteredSkills')}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-cyan-400">{resumeData.stats.careerCount}</p>
                      <p className="text-xs text-slate-400">{t('careerPaths')}</p>
                    </div>
                  </div>

                  {/* Target Job */}
                  {resumeData.jobRequirements && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                      <p className="text-sm text-amber-300">
                        {t('targetJob')}: <span className="font-semibold">{resumeData.jobRequirements.jobTitle}</span>
                        {resumeData.jobRequirements.companyName && (
                          <span className="text-amber-400/70"> @ {resumeData.jobRequirements.companyName}</span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Professional Summary */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-slate-300">{t('professionalSummary')}</h3>
                      <button
                        onClick={() => setIsEditingSummary(!isEditingSummary)}
                        className="text-xs text-amber-400 hover:text-amber-300"
                      >
                        {isEditingSummary ? t('cancel') : t('edit')}
                      </button>
                    </div>
                    {isEditingSummary ? (
                      <div className="space-y-2">
                        <textarea
                          value={editedSummary}
                          onChange={(e) => setEditedSummary(e.target.value)}
                          rows={4}
                          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 resize-none"
                        />
                        <button
                          onClick={handleSaveSummary}
                          className="px-3 py-1.5 text-xs bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded transition-colors"
                        >
                          {t('saveSummary')}
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 bg-slate-800/50 rounded-lg p-3">
                        {resumeData.resumeContent.professionalSummary}
                      </p>
                    )}
                  </div>

                  {/* Skills Preview */}
                  <div>
                    <h3 className="text-sm font-medium text-slate-300 mb-2">{t('skillsIncluded')}</h3>
                    <div className="flex flex-wrap gap-2">
                      {resumeData.resumeContent.skills.slice(0, RESUME_CONFIG.previewSkillCategories).flatMap(group =>
                        group.skills.slice(0, RESUME_CONFIG.previewSkillsPerCategory).map((skill, idx) => (
                          <span
                            key={`${group.category}-${idx}`}
                            className={`px-2 py-1 text-xs rounded ${
                              skill.relevance === 'high'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : skill.relevance === 'medium'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {skill.name}
                          </span>
                        ))
                      )}
                      {(() => {
                        const totalSkills = resumeData.resumeContent.skills.reduce((sum, g) => sum + g.skills.length, 0);
                        const previewCount = RESUME_CONFIG.previewSkillCategories * RESUME_CONFIG.previewSkillsPerCategory;
                        const remaining = totalSkills - previewCount;
                        return remaining > 0 ? (
                          <span className="px-2 py-1 text-xs text-slate-500">
                            +{remaining} {t('more')}
                          </span>
                        ) : null;
                      })()}
                    </div>
                  </div>

                  {/* Highlights */}
                  {resumeData.resumeContent.highlights.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-300 mb-2">{t('highlights')}</h3>
                      <ul className="space-y-1">
                        {resumeData.resumeContent.highlights.slice(0, RESUME_CONFIG.previewHighlightsCount).map((highlight, idx) => (
                          <li key={idx} className="text-sm text-slate-400 flex items-start gap-2">
                            <span className="text-amber-400">•</span>
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between gap-3 p-4 border-t border-slate-700">
              {stage === 'preview' ? (
                <>
                  <button
                    onClick={() => setStage('input')}
                    className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {t('back')}
                  </button>
                  {resumeData && (
                    <PDFDownloadButton
                      userName={resumeData.profile.name}
                      email={resumeData.profile.email}
                      bio={resumeData.profile.bio}
                      resumeContent={resumeData.resumeContent}
                      experience={resumeData.experience}
                      targetJob={resumeData.jobRequirements?.jobTitle}
                      fileName={`${resumeData.profile.name.replace(/\s+/g, '_')}_Resume.pdf`}
                      buttonText={t('downloadPdf')}
                    />
                  )}
                </>
              ) : (
                <button
                  onClick={handleClose}
                  disabled={stage === 'generating'}
                  className="ml-auto px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                >
                  {tCommon('cancel')}
                </button>
              )}
            </div>
          </GlassPanel>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
