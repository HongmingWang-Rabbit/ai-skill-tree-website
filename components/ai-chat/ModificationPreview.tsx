'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { type ChatModification } from '@/lib/ai-chat';
import {
  GlassPanel,
  PreviewIcon,
  CheckCircleIcon,
  EditIcon,
  TrashIcon,
  ConnectionIcon,
  ArrowRightIcon,
} from '@/components/ui';

interface ModificationPreviewProps {
  modifications: ChatModification['modifications'];
  summaries: string[];
  onApply: () => void;
  onReject: () => void;
}

export function ModificationPreview({
  modifications,
  summaries,
  onApply,
  onReject,
}: ModificationPreviewProps) {
  const t = useTranslations('aiChat');

  if (!modifications) return null;

  const { addNodes, updateNodes, removeNodes, addEdges, removeEdges } = modifications;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onReject}
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
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center">
                <PreviewIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-100">{t('previewTitle')}</h3>
                <p className="text-sm text-slate-400">{t('previewDescription')}</p>
              </div>
            </div>

            {/* Changes Summary */}
            <div className="space-y-3 mb-6">
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

            {/* Detailed Changes */}
            <div className="max-h-60 overflow-y-auto space-y-4 mb-6">
              {/* New Skills */}
              {addNodes.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                    {t('newSkills')}
                  </h4>
                  <div className="space-y-1">
                    {addNodes.map((node) => (
                      <div
                        key={node.id}
                        className="flex items-center gap-2 text-sm bg-green-500/10 text-green-300 px-3 py-2 rounded-lg border border-green-500/20"
                      >
                        <span className="text-lg">{node.icon}</span>
                        <div>
                          <span className="font-medium">{node.name}</span>
                          <span className="text-green-400/70 ml-2">L{node.level}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Updated Skills */}
              {updateNodes.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                    {t('updatedSkills')}
                  </h4>
                  <div className="space-y-1">
                    {updateNodes.map((update) => (
                      <div
                        key={update.id}
                        className="flex items-center gap-2 text-sm bg-amber-500/10 text-amber-300 px-3 py-2 rounded-lg border border-amber-500/20"
                      >
                        <EditIcon className="w-4 h-4" />
                        <span>{update.id}</span>
                        {update.updates.name && (
                          <span className="text-amber-400/70">→ {update.updates.name}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Removed Skills */}
              {removeNodes.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                    {t('removedSkills')}
                  </h4>
                  <div className="space-y-1">
                    {removeNodes.map((nodeId) => (
                      <div
                        key={nodeId}
                        className="flex items-center gap-2 text-sm bg-red-500/10 text-red-300 px-3 py-2 rounded-lg border border-red-500/20"
                      >
                        <TrashIcon className="w-4 h-4" />
                        <span>{nodeId}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Connections */}
              {addEdges.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                    {t('newConnections')}
                  </h4>
                  <div className="space-y-1">
                    {addEdges.map((edge) => (
                      <div
                        key={edge.id}
                        className="flex items-center gap-2 text-sm bg-blue-500/10 text-blue-300 px-3 py-2 rounded-lg border border-blue-500/20"
                      >
                        <ConnectionIcon className="w-4 h-4" />
                        <span>{edge.source}</span>
                        <ArrowRightIcon className="w-3 h-3" />
                        <span>{edge.target}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Removed Connections */}
              {removeEdges.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                    {t('removedConnections')}
                  </h4>
                  <div className="space-y-1">
                    {removeEdges.map((edgeId) => (
                      <div
                        key={edgeId}
                        className="flex items-center gap-2 text-sm bg-slate-500/10 text-slate-400 px-3 py-2 rounded-lg border border-slate-500/20 line-through"
                      >
                        <ConnectionIcon className="w-4 h-4" />
                        <span>{edgeId}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onReject}
                className="flex-1 px-4 py-2 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={onApply}
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:opacity-90 transition-opacity"
              >
                {t('applyChanges')}
              </button>
            </div>
          </GlassPanel>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

