'use client';

import { useTranslations } from 'next-intl';
import { CheckCircleIcon, WarningIcon, ArrowRightIcon, PhoneIcon, MapPinIcon, FolderIcon, BookOpenIcon } from '@/components/ui';
import { type ImportResult } from './DocumentImportModal';
import { DOCUMENT_IMPORT_CONFIG } from '@/lib/constants';

const { preview: previewConfig, modal: modalConfig } = DOCUMENT_IMPORT_CONFIG;
const { confidenceThresholds, maxDisplayedSkillsPerCategory, maxDisplayedExperiences, maxDisplayedProjects } = previewConfig;
const { maxHeightVh, headerHeightPx } = modalConfig;

interface ImportPreviewProps {
  result: ImportResult;
  summaries: string[];
  warning?: string | null;
  onConfirm: () => void;
  onBack: () => void;
  mode: 'create' | 'update';
}

export function ImportPreview({
  result,
  summaries,
  warning,
  onConfirm,
  onBack,
  mode,
}: ImportPreviewProps) {
  const t = useTranslations('import');

  const { nodes, suggestedTitle, confidence, bio, phone, address, experience, projects, education } = result;

  // Format address for display
  const formatAddress = () => {
    if (!address) return null;
    const parts: string[] = [];
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.country) parts.push(address.country);
    return parts.length > 0 ? parts.join(', ') : null;
  };

  const formattedAddress = formatAddress();

  // Group skills by category
  const skillsByCategory = nodes.reduce(
    (acc, node) => {
      const category = node.category || t('uncategorized');
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(node);
      return acc;
    },
    {} as Record<string, typeof nodes>
  );

  const categories = Object.keys(skillsByCategory);

  // Confidence indicator
  const getConfidenceColor = () => {
    if (confidence >= confidenceThresholds.high) return 'text-green-400';
    if (confidence >= confidenceThresholds.medium) return 'text-amber-400';
    return 'text-red-400';
  };

  const getConfidenceLabel = () => {
    if (confidence >= confidenceThresholds.high) return t('confidenceHigh');
    if (confidence >= confidenceThresholds.medium) return t('confidenceMedium');
    return t('confidenceLow');
  };

  // Calculate scrollable content max height from constants
  const scrollableMaxHeight = `calc(${maxHeightVh}vh - ${headerHeightPx}px)`;

  return (
    <div className="flex flex-col">
      {/* Scrollable Content */}
      <div className="overflow-y-auto space-y-4" style={{ maxHeight: scrollableMaxHeight }}>
        {/* Summary Section */}
        <div className="space-y-2">
          {summaries.map((summary, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-sm text-slate-300 bg-slate-800/50 px-3 py-2 rounded-lg"
            >
              <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span>{summary}</span>
            </div>
          ))}
        </div>

        {/* Warning */}
        {warning && (
          <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <WarningIcon className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-300">{warning}</p>
          </div>
        )}

        {/* Suggested Title */}
        <div className="bg-slate-800/50 rounded-lg p-4">
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
            {t('suggestedTitle')}
          </label>
          <p className="text-lg font-semibold text-slate-100">{suggestedTitle}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs ${getConfidenceColor()}`}>
              {getConfidenceLabel()}
            </span>
            <span className="text-xs text-slate-500">
              ({Math.round(confidence * 100)}%)
            </span>
          </div>
        </div>

        {/* Contact Info Preview */}
        {(phone || formattedAddress) && (
          <div className="bg-slate-800/50 rounded-lg p-4">
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
              {t('contactInfoLabel')}
            </label>
            <div className="space-y-2">
              {phone && (
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <PhoneIcon className="w-4 h-4 text-slate-400" />
                  <span>{phone}</span>
                </div>
              )}
              {formattedAddress && (
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <MapPinIcon className="w-4 h-4 text-slate-400" />
                  <span>{formattedAddress}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bio Preview */}
        {bio && (
          <div className="bg-slate-800/50 rounded-lg p-4">
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
              {t('bioLabel')}
            </label>
            <p className="text-sm text-slate-300 leading-relaxed">{bio}</p>
          </div>
        )}

        {/* Work Experience Preview */}
        {experience && experience.length > 0 && (
          <div className="bg-slate-800/50 rounded-lg p-4">
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
              {t('experienceLabel')} ({experience.length})
            </label>
            <div className="space-y-3">
              {experience.slice(0, maxDisplayedExperiences).map((exp, idx) => (
                <div key={idx} className="border-l-2 border-violet-500/50 pl-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-200">{exp.title}</p>
                    <span className="text-xs text-slate-500">
                      {exp.startDate} - {exp.endDate || t('present')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{exp.company}{exp.location ? ` • ${exp.location}` : ''}</p>
                </div>
              ))}
              {experience.length > maxDisplayedExperiences && (
                <p className="text-xs text-slate-500 pl-3">
                  +{experience.length - maxDisplayedExperiences} {t('more')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Education Preview */}
        {education && education.length > 0 && (
          <div className="bg-slate-800/50 rounded-lg p-4">
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
              {t('educationTitle')} ({education.length})
            </label>
            <div className="space-y-3">
              {education.slice(0, maxDisplayedExperiences).map((edu, idx) => (
                <div key={idx} className="border-l-2 border-cyan-500/50 pl-3">
                  <div className="flex items-center gap-2">
                    <BookOpenIcon className="w-4 h-4 text-cyan-400" />
                    <p className="text-sm font-medium text-slate-200">{edu.school}</p>
                  </div>
                  <p className="text-xs text-slate-400">
                    {[edu.degree, edu.fieldOfStudy].filter(Boolean).join(' • ')}
                  </p>
                  {(edu.startDate || edu.endDate) && (
                    <p className="text-xs text-slate-500">
                      {[edu.startDate, edu.endDate || t('present')].filter(Boolean).join(' - ')}
                    </p>
                  )}
                </div>
              ))}
              {education.length > maxDisplayedExperiences && (
                <p className="text-xs text-slate-500 pl-3">
                  +{education.length - maxDisplayedExperiences} {t('more')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Projects Preview */}
        {projects && projects.length > 0 && (
          <div className="bg-slate-800/50 rounded-lg p-4">
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
              {t('projectsLabel')} ({projects.length})
            </label>
            <div className="space-y-3">
              {projects.slice(0, maxDisplayedProjects).map((proj, idx) => (
                <div key={idx} className="border-l-2 border-amber-500/50 pl-3">
                  <div className="flex items-center gap-2">
                    <FolderIcon className="w-4 h-4 text-amber-400" />
                    <p className="text-sm font-medium text-slate-200">{proj.name}</p>
                  </div>
                  {proj.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{proj.description}</p>
                  )}
                  {proj.technologies && proj.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {proj.technologies.slice(0, 5).map((tech, techIdx) => (
                        <span key={techIdx} className="text-xs px-1.5 py-0.5 bg-slate-700/50 text-slate-300 rounded">
                          {tech}
                        </span>
                      ))}
                      {proj.technologies.length > 5 && (
                        <span className="text-xs text-slate-500">+{proj.technologies.length - 5}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {projects.length > maxDisplayedProjects && (
                <p className="text-xs text-slate-500 pl-3">
                  +{projects.length - maxDisplayedProjects} {t('more')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Skills Preview */}
        <div className="space-y-3">
          {categories.map((category) => (
            <div key={category}>
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                {category} ({skillsByCategory[category].length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {skillsByCategory[category].slice(0, maxDisplayedSkillsPerCategory).map((skill) => (
                  <div
                    key={skill.id}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-violet-500/10 text-violet-300 rounded-lg border border-violet-500/20 text-sm"
                  >
                    <span>{skill.icon}</span>
                    <span>{skill.name}</span>
                    <span className="text-violet-400/60 text-xs">L{skill.level}</span>
                  </div>
                ))}
                {skillsByCategory[category].length > maxDisplayedSkillsPerCategory && (
                  <span className="flex items-center px-2.5 py-1.5 text-slate-400 text-sm">
                    +{skillsByCategory[category].length - maxDisplayedSkillsPerCategory} {t('more')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Total count */}
        <div className="text-center py-2">
          <span className="text-sm text-slate-400">
            {t('totalSkills', { count: nodes.length })}
          </span>
        </div>
      </div>

      {/* Actions - Fixed at bottom */}
      <div className="flex gap-3 pt-4 flex-shrink-0 border-t border-slate-700/50 mt-4">
        <button
          onClick={onBack}
          className="flex-1 px-4 py-2.5 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-colors"
        >
          {t('back')}
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          {mode === 'update' ? t('confirmUpdate') : t('confirm')}
          <ArrowRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
