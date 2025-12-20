'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { pdf } from '@react-pdf/renderer';
import JSZip from 'jszip';
import {
  GlassPanel,
  CloseIcon,
  SparklesIcon,
  LinkIcon,
  WarningIcon,
  PreviewIcon,
  DownloadIcon,
  LetterIcon,
} from '@/components/ui';
import { API_ROUTES, RESUME_CONFIG, LOCALE_DISPLAY_NAMES } from '@/lib/constants';
import { locales, type Locale } from '@/i18n/routing';
import { type ResumeContent, type JobRequirements, type CoverLetterContent } from '@/lib/ai-resume';
import { type WorkExperience, type Project, type UserAddress, type Education } from '@/lib/schemas';
import { ResumePDF } from './ResumePDF';
import { CoverLetterPDF } from './CoverLetterPDF';

// Dynamically import PDF components to avoid SSR issues with @react-pdf/renderer
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

const PDFPreviewPanel = dynamic(
  () => import('./PDFPreviewPanel').then(mod => mod.PDFPreviewPanel),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-slate-800 rounded-lg">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Loading preview...</p>
        </div>
      </div>
    ),
  }
);

const CoverLetterPreviewPanel = dynamic(
  () => import('./CoverLetterPreviewPanel').then(mod => mod.CoverLetterPreviewPanel),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-slate-800 rounded-lg">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Loading preview...</p>
        </div>
      </div>
    ),
  }
);

export interface ResumeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: Locale;
}

type Stage = 'input' | 'generating' | 'preview' | 'pdfPreview';
type PreviewTab = 'resume' | 'coverLetter';

interface ResumeData {
  profile: {
    name: string;
    email: string;
    phone?: string;
    address?: UserAddress;
    bio: string;
  };
  experience: WorkExperience[];
  projects?: Project[];
  education?: Education[];
  resumeContent: ResumeContent;
  jobRequirements: JobRequirements | null;
  stats: {
    totalSkills: number;
    masteredSkills: number;
    careerCount: number;
  };
  hasWatermark: boolean;
}

interface CoverLetterData {
  profile: {
    name: string;
    email: string;
  };
  coverLetterContent: CoverLetterContent;
  jobRequirements: JobRequirements | null;
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
  const [outputLanguage, setOutputLanguage] = useState<Locale>(locale);
  const [includeCoverLetter, setIncludeCoverLetter] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [coverLetterData, setCoverLetterData] = useState<CoverLetterData | null>(null);
  const [editedSummary, setEditedSummary] = useState('');
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [showWatermark, setShowWatermark] = useState(false);
  const [showFooter, setShowFooter] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState<PreviewTab>('resume');
  const [isDownloading, setIsDownloading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Ensure PDF components only render after client-side mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const resetState = useCallback(() => {
    setStage('input');
    setJobTitle('');
    setJobUrl('');
    setOutputLanguage(locale);
    setIncludeCoverLetter(false);
    setError(null);
    setResumeData(null);
    setCoverLetterData(null);
    setEditedSummary('');
    setIsEditingSummary(false);
    setShowWatermark(false);
    setShowFooter(true);
    setActivePreviewTab('resume');
    setIsDownloading(false);
  }, [locale]);

  const handleClose = useCallback(() => {
    // Abort any ongoing request
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    resetState();
    onClose();
  }, [resetState, onClose]);

  const handleGenerate = useCallback(async () => {
    setError(null);
    setStage('generating');

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      // Generate resume
      const resumeResponse = await fetch(API_ROUTES.RESUME_GENERATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale: outputLanguage,
          jobTitle: jobTitle.trim() || undefined,
          jobUrl: jobUrl.trim() || undefined,
        }),
        signal: abortControllerRef.current.signal,
      });

      const resumeResult = await resumeResponse.json();

      if (!resumeResponse.ok || !resumeResult.success) {
        throw new Error(resumeResult.error || t('generateFailed'));
      }

      setResumeData(resumeResult.data);
      setEditedSummary(resumeResult.data.resumeContent.professionalSummary);

      // Generate cover letter if enabled
      if (includeCoverLetter) {
        const coverLetterResponse = await fetch(API_ROUTES.COVER_LETTER_GENERATE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            locale: outputLanguage,
            jobTitle: jobTitle.trim() || undefined,
            jobUrl: jobUrl.trim() || undefined,
          }),
          signal: abortControllerRef.current.signal,
        });

        const coverLetterResult = await coverLetterResponse.json();

        if (!coverLetterResponse.ok || !coverLetterResult.success) {
          throw new Error(coverLetterResult.error || t('coverLetterGenerateFailed'));
        }

        setCoverLetterData(coverLetterResult.data);
      }

      setStage('preview');
    } catch (err) {
      // Don't show error if request was aborted
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setError(err instanceof Error ? err.message : t('generateFailed'));
      setStage('input');
    }
  }, [outputLanguage, jobTitle, jobUrl, includeCoverLetter, t]);

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

  // Download zip with both PDFs
  const handleDownloadZip = useCallback(async () => {
    if (!resumeData) return;

    setIsDownloading(true);
    try {
      const zip = new JSZip();
      const userName = resumeData.profile.name.replace(/\s+/g, '_');

      // Generate Resume PDF
      const resumeBlob = await pdf(
        <ResumePDF
          userName={resumeData.profile.name}
          email={resumeData.profile.email}
          phone={resumeData.profile.phone}
          address={resumeData.profile.address}
          resumeContent={resumeData.resumeContent}
          experience={resumeData.experience}
          projects={resumeData.projects}
          education={resumeData.education}
          targetJob={resumeData.jobRequirements?.jobTitle}
          hasWatermark={resumeData.hasWatermark || showWatermark}
          showFooter={showFooter}
          locale={outputLanguage}
        />
      ).toBlob();
      zip.file(`${userName}_Resume.pdf`, resumeBlob);

      // Generate Cover Letter PDF if available
      if (coverLetterData) {
        const coverLetterBlob = await pdf(
          <CoverLetterPDF
            userName={coverLetterData.profile.name}
            email={coverLetterData.profile.email}
            phone={resumeData.profile.phone}
            coverLetterContent={coverLetterData.coverLetterContent}
            targetJob={coverLetterData.jobRequirements?.jobTitle}
            companyName={coverLetterData.jobRequirements?.companyName}
            hasWatermark={resumeData.hasWatermark || showWatermark}
            showFooter={showFooter}
            locale={outputLanguage}
          />
        ).toBlob();
        zip.file(`${userName}_Cover_Letter.pdf`, coverLetterBlob);
      }

      // Generate and download zip
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${userName}_Application.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError(t('downloadFailed'));
    } finally {
      setIsDownloading(false);
    }
  }, [resumeData, coverLetterData, showWatermark, showFooter, outputLanguage, t]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={`w-full overflow-hidden transition-all duration-300 ${
            stage === 'pdfPreview'
              ? 'max-w-5xl max-h-[90vh]'
              : 'max-w-2xl max-h-[85vh]'
          }`}
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
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <CloseIcon className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Tabs for PDF Preview - fixed outside scroll area */}
            {stage === 'pdfPreview' && coverLetterData && (
              <div className="flex gap-2 px-4 pt-4 border-b border-slate-700">
                <button
                  onClick={() => setActivePreviewTab('resume')}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    activePreviewTab === 'resume'
                      ? 'text-amber-400 border-amber-400'
                      : 'text-slate-400 border-transparent hover:text-slate-300'
                  }`}
                >
                  {t('resumeTab')}
                </button>
                <button
                  onClick={() => setActivePreviewTab('coverLetter')}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    activePreviewTab === 'coverLetter'
                      ? 'text-purple-400 border-purple-400'
                      : 'text-slate-400 border-transparent hover:text-slate-300'
                  }`}
                >
                  {t('coverLetterTab')}
                </button>
              </div>
            )}

            {/* Content */}
            <div className={`p-4 ${stage === 'pdfPreview' ? 'h-[65vh]' : 'max-h-[60vh] overflow-y-auto'}`}>
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

                  {/* Output Language Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      {t('outputLanguageLabel')}
                    </label>
                    <select
                      value={outputLanguage}
                      onChange={(e) => setOutputLanguage(e.target.value as Locale)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors appearance-none cursor-pointer"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                    >
                      {locales.map((loc) => (
                        <option key={loc} value={loc}>
                          {LOCALE_DISPLAY_NAMES[loc]}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Include Cover Letter Toggle */}
                  <div className="pt-2 border-t border-slate-700">
                    <label className="flex items-center justify-between cursor-pointer py-2">
                      <div className="flex items-center gap-2">
                        <LetterIcon className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-slate-300">{t('includeCoverLetter')}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIncludeCoverLetter(!includeCoverLetter)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          includeCoverLetter ? 'bg-purple-500' : 'bg-slate-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            includeCoverLetter ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </label>
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
                  {includeCoverLetter && <p className="text-sm text-purple-400 mt-2">{t('generatingCoverLetter')}</p>}
                </div>
              )}

              {/* Preview Stage */}
              {stage === 'preview' && resumeData && (
                <div className="space-y-4">
                  {/* Preview Tabs - only show if cover letter is included */}
                  {coverLetterData && (
                    <div className="flex gap-2 border-b border-slate-700 mb-4">
                      <button
                        onClick={() => setActivePreviewTab('resume')}
                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                          activePreviewTab === 'resume'
                            ? 'text-amber-400 border-amber-400'
                            : 'text-slate-400 border-transparent hover:text-slate-300'
                        }`}
                      >
                        {t('resumeTab')}
                      </button>
                      <button
                        onClick={() => setActivePreviewTab('coverLetter')}
                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                          activePreviewTab === 'coverLetter'
                            ? 'text-purple-400 border-purple-400'
                            : 'text-slate-400 border-transparent hover:text-slate-300'
                        }`}
                      >
                        {t('coverLetterTab')}
                      </button>
                    </div>
                  )}

                  {/* Resume Preview */}
                  {activePreviewTab === 'resume' && (
                    <>
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
                    </>
                  )}

                  {/* Cover Letter Preview */}
                  {activePreviewTab === 'coverLetter' && coverLetterData && (
                    <>
                      {/* Target Job */}
                      {coverLetterData.jobRequirements && (
                        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                          <p className="text-sm text-purple-300">
                            {t('targetJob')}: <span className="font-semibold">{coverLetterData.jobRequirements.jobTitle}</span>
                            {coverLetterData.jobRequirements.companyName && (
                              <span className="text-purple-400/70"> @ {coverLetterData.jobRequirements.companyName}</span>
                            )}
                          </p>
                        </div>
                      )}

                      {/* Key Strengths */}
                      <div>
                        <h3 className="text-sm font-medium text-slate-300 mb-2">{t('keyStrengths')}</h3>
                        <div className="flex flex-wrap gap-2">
                          {coverLetterData.coverLetterContent.keyStrengths.map((strength, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 text-xs rounded bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            >
                              {strength}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Cover Letter Preview */}
                      <div>
                        <h3 className="text-sm font-medium text-slate-300 mb-2">{t('coverLetterPreview')}</h3>
                        <div className="bg-slate-800/50 rounded-lg p-4 text-sm text-slate-300 whitespace-pre-wrap font-serif leading-relaxed max-h-[250px] overflow-y-auto">
                          {coverLetterData.coverLetterContent.greeting}
                          {'\n\n'}
                          {coverLetterData.coverLetterContent.opening}
                          {'\n\n'}
                          {coverLetterData.coverLetterContent.body.join('\n\n')}
                          {'\n\n'}
                          {coverLetterData.coverLetterContent.closing}
                          {'\n\n'}
                          {coverLetterData.coverLetterContent.signature.replace('\\n', '\n')}
                        </div>
                      </div>
                    </>
                  )}

                  {/* PDF Options */}
                  <div className="pt-4 border-t border-slate-700">
                    <h3 className="text-sm font-medium text-slate-300 mb-3">{t('pdfOptions')}</h3>
                    <div className="space-y-3">
                      {/* Watermark Toggle - always show, but only subscribers can turn off */}
                      <label className={`flex items-center justify-between ${resumeData.hasWatermark ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-400">{t('showWatermark')}</span>
                          {resumeData.hasWatermark && (
                            <span className="text-xs text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">{t('subscriberOnly')}</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => !resumeData.hasWatermark && setShowWatermark(!showWatermark)}
                          disabled={resumeData.hasWatermark}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            resumeData.hasWatermark
                              ? 'bg-amber-500 opacity-50 cursor-not-allowed'
                              : showWatermark
                              ? 'bg-amber-500'
                              : 'bg-slate-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              resumeData.hasWatermark || showWatermark ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </label>
                      {/* Footer Toggle */}
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm text-slate-400">{t('showFooter')}</span>
                        <button
                          type="button"
                          onClick={() => setShowFooter(!showFooter)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            showFooter ? 'bg-amber-500' : 'bg-slate-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              showFooter ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* PDF Preview Stage */}
              {stage === 'pdfPreview' && resumeData && isMounted && (
                <div className="h-full">
                  {activePreviewTab === 'resume' ? (
                    <PDFPreviewPanel
                      key={`pdf-preview-${showWatermark}-${showFooter}-${outputLanguage}`}
                      userName={resumeData.profile.name}
                      email={resumeData.profile.email}
                      phone={resumeData.profile.phone}
                      address={resumeData.profile.address}
                      resumeContent={resumeData.resumeContent}
                      experience={resumeData.experience}
                      education={resumeData.education}
                      projects={resumeData.projects}
                      targetJob={resumeData.jobRequirements?.jobTitle}
                      hasWatermark={resumeData.hasWatermark || showWatermark}
                      showFooter={showFooter}
                      locale={outputLanguage}
                    />
                  ) : coverLetterData && (
                    <CoverLetterPreviewPanel
                      key={`cover-letter-preview-${showWatermark}-${showFooter}-${outputLanguage}`}
                      userName={coverLetterData.profile.name}
                      email={coverLetterData.profile.email}
                      phone={resumeData.profile.phone}
                      coverLetterContent={coverLetterData.coverLetterContent}
                      targetJob={coverLetterData.jobRequirements?.jobTitle}
                      companyName={coverLetterData.jobRequirements?.companyName}
                      hasWatermark={resumeData.hasWatermark || showWatermark}
                      showFooter={showFooter}
                      locale={outputLanguage}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-3 p-4 border-t border-slate-700">
              {stage === 'preview' ? (
                <>
                  <button
                    onClick={() => setStage('input')}
                    className="order-3 sm:order-1 px-4 py-2.5 sm:py-2 text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {t('back')}
                  </button>
                  <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto">
                    <button
                      onClick={() => setStage('pdfPreview')}
                      className="flex-1 sm:flex-initial px-3 sm:px-4 py-2.5 sm:py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <PreviewIcon className="w-4 h-4" />
                      <span className="hidden min-[400px]:inline">{t('previewPdf')}</span>
                      <span className="min-[400px]:hidden">{t('previewPdfShort')}</span>
                    </button>
                    {resumeData && isMounted && (
                      coverLetterData ? (
                        <button
                          onClick={handleDownloadZip}
                          disabled={isDownloading}
                          className="flex-1 sm:flex-initial px-3 sm:px-4 py-2.5 sm:py-2 text-sm bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isDownloading ? (
                            <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <DownloadIcon className="w-4 h-4" />
                          )}
                          <span className="hidden min-[400px]:inline">{t('downloadZip')}</span>
                          <span className="min-[400px]:hidden">{t('downloadZipShort')}</span>
                        </button>
                      ) : (
                        <PDFDownloadButton
                          key={`pdf-btn-preview-${showWatermark}-${showFooter}-${outputLanguage}`}
                          userName={resumeData.profile.name}
                          email={resumeData.profile.email}
                          phone={resumeData.profile.phone}
                          address={resumeData.profile.address}
                          resumeContent={resumeData.resumeContent}
                          experience={resumeData.experience}
                          education={resumeData.education}
                          projects={resumeData.projects}
                          targetJob={resumeData.jobRequirements?.jobTitle}
                          hasWatermark={resumeData.hasWatermark || showWatermark}
                          showFooter={showFooter}
                          fileName={`${resumeData.profile.name.replace(/\s+/g, '_')}_Resume.pdf`}
                          buttonText={t('downloadPdf')}
                          locale={outputLanguage}
                          className="flex-1 sm:flex-initial"
                        />
                      )
                    )}
                  </div>
                </>
              ) : stage === 'pdfPreview' ? (
                <>
                  <button
                    onClick={() => setStage('preview')}
                    className="order-2 sm:order-1 px-4 py-2.5 sm:py-2 text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {t('back')}
                  </button>
                  {resumeData && isMounted && (
                    coverLetterData ? (
                      <button
                        onClick={handleDownloadZip}
                        disabled={isDownloading}
                        className="order-1 sm:order-2 w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isDownloading ? (
                          <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <DownloadIcon className="w-4 h-4" />
                        )}
                        {t('downloadZip')}
                      </button>
                    ) : (
                      <PDFDownloadButton
                        key={`pdf-btn-full-${showWatermark}-${showFooter}-${outputLanguage}`}
                        userName={resumeData.profile.name}
                        email={resumeData.profile.email}
                        phone={resumeData.profile.phone}
                        address={resumeData.profile.address}
                        resumeContent={resumeData.resumeContent}
                        experience={resumeData.experience}
                        education={resumeData.education}
                        projects={resumeData.projects}
                        targetJob={resumeData.jobRequirements?.jobTitle}
                        hasWatermark={resumeData.hasWatermark || showWatermark}
                        showFooter={showFooter}
                        fileName={`${resumeData.profile.name.replace(/\s+/g, '_')}_Resume.pdf`}
                        buttonText={t('downloadPdf')}
                        locale={outputLanguage}
                        className="order-1 sm:order-2 w-full sm:w-auto"
                      />
                    )
                  )}
                </>
              ) : (
                <button
                  onClick={handleClose}
                  className="ml-auto px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
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
