'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  GlassPanel,
  FileDropzone,
  CloseIcon,
  DocumentIcon,
  LinkIcon,
  WarningIcon,
} from '@/components/ui';
import { ImportPreview } from './ImportPreview';
import { API_ROUTES } from '@/lib/constants';
import { type SkillNode, type SkillEdge } from '@/lib/schemas';
import { type Locale } from '@/i18n/routing';

export interface ImportResult {
  nodes: SkillNode[];
  edges: SkillEdge[];
  suggestedTitle: string;
  confidence: number;
}

interface DocumentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (result: ImportResult) => void;
  locale: Locale;
  // For update mode
  existingNodes?: SkillNode[];
  existingEdges?: SkillEdge[];
  mode?: 'create' | 'update';
}

type TabType = 'document' | 'url';

export function DocumentImportModal({
  isOpen,
  onClose,
  onImportComplete,
  locale,
  existingNodes,
  existingEdges,
  mode = 'create',
}: DocumentImportModalProps) {
  const t = useTranslations('import');
  const [activeTab, setActiveTab] = useState<TabType>('document');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [summaries, setSummaries] = useState<string[]>([]);

  const resetState = useCallback(() => {
    setError(null);
    setWarning(null);
    setImportResult(null);
    setSummaries([]);
  }, []);

  const handleFileSelect = useCallback(
    async (file: File) => {
      resetState();
      setIsProcessing(true);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('locale', locale);

        if (existingNodes && existingEdges) {
          formData.append('existingNodes', JSON.stringify(existingNodes));
          formData.append('existingEdges', JSON.stringify(existingEdges));
        }

        const response = await fetch(API_ROUTES.IMPORT_DOCUMENT, {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || t('importFailed'));
        }

        setImportResult({
          nodes: data.data.nodes,
          edges: data.data.edges,
          suggestedTitle: data.data.suggestedTitle,
          confidence: data.data.confidence,
        });
        setSummaries(data.data.summaries || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('importFailed'));
      } finally {
        setIsProcessing(false);
      }
    },
    [locale, existingNodes, existingEdges, resetState, t]
  );

  const handleUrlSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!urlInput.trim()) return;

      resetState();
      setIsProcessing(true);

      try {
        const response = await fetch(API_ROUTES.IMPORT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: urlInput.trim(),
            locale,
            existingNodes,
            existingEdges,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || t('importFailed'));
        }

        if (data.data.warning) {
          setWarning(data.data.warning);
        }

        setImportResult({
          nodes: data.data.nodes,
          edges: data.data.edges,
          suggestedTitle: data.data.suggestedTitle,
          confidence: data.data.confidence,
        });
        setSummaries(data.data.summaries || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('importFailed'));
      } finally {
        setIsProcessing(false);
      }
    },
    [urlInput, locale, existingNodes, existingEdges, resetState, t]
  );

  const handleConfirmImport = useCallback(() => {
    if (importResult) {
      onImportComplete(importResult);
      onClose();
    }
  }, [importResult, onImportComplete, onClose]);

  const handleCancel = useCallback(() => {
    resetState();
    setUrlInput('');
    onClose();
  }, [resetState, onClose]);

  const handleBack = useCallback(() => {
    setImportResult(null);
    setSummaries([]);
    setWarning(null);
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={handleCancel}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg"
        >
          <GlassPanel className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center">
                  <DocumentIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">
                    {mode === 'update' ? t('updateTitle') : t('title')}
                  </h3>
                  <p className="text-sm text-slate-400">{t('subtitle')}</p>
                </div>
              </div>
              <button
                onClick={handleCancel}
                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Show preview if we have results */}
            {importResult ? (
              <ImportPreview
                result={importResult}
                summaries={summaries}
                warning={warning}
                onConfirm={handleConfirmImport}
                onBack={handleBack}
                mode={mode}
              />
            ) : (
              <>
                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => {
                      setActiveTab('document');
                      resetState();
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                      activeTab === 'document'
                        ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                    }`}
                  >
                    <DocumentIcon className="w-4 h-4" />
                    {t('documentTab')}
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('url');
                      resetState();
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                      activeTab === 'url'
                        ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                    }`}
                  >
                    <LinkIcon className="w-4 h-4" />
                    {t('urlTab')}
                  </button>
                </div>

                {/* Content */}
                {activeTab === 'document' ? (
                  <FileDropzone
                    onFileSelect={handleFileSelect}
                    isProcessing={isProcessing}
                    processingMessage={t('processing')}
                  />
                ) : (
                  <form onSubmit={handleUrlSubmit} className="space-y-4">
                    <div>
                      <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder={t('urlPlaceholder')}
                        disabled={isProcessing}
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 disabled:opacity-50"
                      />
                      <p className="mt-2 text-xs text-slate-500">{t('urlExamples')}</p>
                    </div>
                    <button
                      type="submit"
                      disabled={isProcessing || !urlInput.trim()}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          {t('processing')}
                        </>
                      ) : (
                        t('importFromUrl')
                      )}
                    </button>
                  </form>
                )}

                {/* Error */}
                {error && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
                    <WarningIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                )}
              </>
            )}
          </GlassPanel>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
