'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassPanel, ChatIcon, MinimizeIcon, ImportIcon, SparklesIcon } from '@/components/ui';
import { ChatMessage } from './ChatMessage';
import { ChatInput, type SlashCommand } from './ChatInput';
import { ModificationPreview } from './ModificationPreview';
import type { ImportResult } from '@/components/import/DocumentImportModal';
import { type SkillNode, type SkillEdge } from '@/lib/schemas';

// Lazy load heavy modal
const DocumentImportModal = dynamic(
  () => import('@/components/import/DocumentImportModal').then(mod => mod.DocumentImportModal),
  { ssr: false }
);
import { type ChatModification, generateModificationSummary, applyModifications } from '@/lib/ai-chat';
import { type Locale } from '@/i18n/routing';
import { AI_CHAT_CONFIG, API_ROUTES } from '@/lib/constants';

export interface ChatMessageType {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  modifications?: ChatModification['modifications'];
  isOffTopic?: boolean;
  pending?: boolean;
  skill?: { id: string; name: string };
}

interface AIChatPanelProps {
  careerTitle: string;
  careerDescription: string;
  currentNodes: SkillNode[];
  currentEdges: SkillEdge[];
  onApplyModifications: (nodes: SkillNode[], edges: SkillEdge[]) => void;
  onUndo: () => void;
  canUndo: boolean;
  userMaps?: { id: string; title: string; careerTitle: string }[];
  locale: Locale;
  isReadOnly?: boolean;
}

export function AIChatPanel({
  careerTitle,
  careerDescription,
  currentNodes,
  currentEdges,
  onApplyModifications,
  onUndo,
  canUndo,
  userMaps,
  locale,
  isReadOnly = false,
}: AIChatPanelProps) {
  const t = useTranslations('aiChat');
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingModification, setPendingModification] = useState<{
    messageId: string;
    modifications: ChatModification['modifications'];
  } | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [slashCommands, setSlashCommands] = useState<SlashCommand[]>([]);
  const [activeSkill, setActiveSkill] = useState<{ id: string; name: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch slash commands on mount
  useEffect(() => {
    async function fetchCommands() {
      try {
        const response = await fetch(API_ROUTES.AI_CHAT);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setSlashCommands(data.data);
          }
        }
      } catch {
        // Silently fail - commands will just not be available
      }
    }
    fetchCommands();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessageId = `user-${Date.now()}`;
    const assistantMessageId = `assistant-${Date.now()}`;

    // Add user message
    setMessages(prev => [...prev, {
      id: userMessageId,
      role: 'user',
      content: content.trim(),
    }]);

    setIsLoading(true);
    setStreamingContent('');
    setActiveSkill(null);

    try {
      const response = await fetch(API_ROUTES.AI_CHAT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content.trim(),
          careerTitle,
          careerDescription,
          currentNodes,
          currentEdges,
          chatHistory: messages.map(m => ({ role: m.role, content: m.content })),
          userMaps,
          locale,
          stream: true,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response body');

      let fullContent = '';
      let finalResult: (ChatModification & { _skill?: { id: string; name: string } }) | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));

            if (data.chunk) {
              fullContent += data.chunk;
              // Try to extract message content for display
              const messageMatch = fullContent.match(/"message"\s*:\s*"([^"]*)/);
              if (messageMatch) {
                setStreamingContent(messageMatch[1].replace(/\\n/g, '\n'));
              }
            }

            if (data.done && data.result) {
              finalResult = data.result;
              // Set active skill from response
              if (data.result._skill) {
                setActiveSkill(data.result._skill);
              }
            }

            if (data.error) {
              throw new Error(data.error);
            }
          } catch {
            // Skip malformed lines
          }
        }
      }

      if (finalResult) {
        // If auth is required, append localized message
        const messageContent = (finalResult as { requiresAuth?: boolean }).requiresAuth
          ? `${finalResult.message}\n\n${t('signInToApply')}`
          : finalResult.message;

        const assistantMessage: ChatMessageType = {
          id: assistantMessageId,
          role: 'assistant',
          content: messageContent,
          modifications: finalResult.modifications,
          isOffTopic: finalResult.isOffTopic,
          skill: finalResult._skill,
        };

        setMessages(prev => [...prev, assistantMessage]);
        setStreamingContent('');

        // If there are modifications, show preview
        const hasModifications = finalResult.modifications && (
          finalResult.modifications.addNodes.length > 0 ||
          finalResult.modifications.updateNodes.length > 0 ||
          finalResult.modifications.removeNodes.length > 0 ||
          finalResult.modifications.addEdges.length > 0 ||
          finalResult.modifications.removeEdges.length > 0
        );

        if (hasModifications && !isReadOnly) {
          setPendingModification({
            messageId: assistantMessageId,
            modifications: finalResult.modifications,
          });
        }
      }
    } catch {
      setMessages(prev => [...prev, {
        id: assistantMessageId,
        role: 'assistant',
        content: t('errorMessage'),
        isOffTopic: false,
      }]);
      setStreamingContent('');
    } finally {
      setIsLoading(false);
      setActiveSkill(null);
    }
  }, [careerTitle, careerDescription, currentNodes, currentEdges, messages, userMaps, locale, isLoading, isReadOnly, t]);

  const handleApplyModification = useCallback(() => {
    if (!pendingModification?.modifications) return;

    const { nodes, edges } = applyModifications(
      currentNodes,
      currentEdges,
      pendingModification.modifications
    );

    onApplyModifications(nodes, edges);
    setPendingModification(null);
  }, [pendingModification, currentNodes, currentEdges, onApplyModifications]);

  const handleRejectModification = useCallback(() => {
    setPendingModification(null);
  }, []);

  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const handleImportComplete = useCallback((result: ImportResult) => {
    // Convert imported skills to modifications
    const existingNodeIds = new Set(currentNodes.map(n => n.id));
    const existingEdgeIds = new Set(currentEdges.map(e => `${e.source}-${e.target}`));

    // Filter out nodes that already exist
    const newNodes = result.nodes.filter(n => !existingNodeIds.has(n.id));
    const newEdges = result.edges.filter(e => !existingEdgeIds.has(`${e.source}-${e.target}`));

    if (newNodes.length === 0) {
      // No new skills to add
      return;
    }

    // Create modifications
    const modifications: ChatModification['modifications'] = {
      addNodes: newNodes,
      updateNodes: [],
      removeNodes: [],
      addEdges: newEdges,
      removeEdges: [],
    };

    // Show preview
    setPendingModification({
      messageId: `import-${Date.now()}`,
      modifications,
    });
  }, [currentNodes, currentEdges]);

  return (
    <>
      {/* Chat Toggle Button */}
      <motion.button
        onClick={toggleExpand}
        className={`
          fixed bottom-4 right-4 z-40
          w-14 h-14 rounded-full
          bg-gradient-to-r from-violet-500 to-purple-600
          text-white shadow-lg shadow-violet-500/25
          flex items-center justify-center
          hover:scale-105 active:scale-95
          transition-transform
        `}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={t('toggleChat')}
      >
        <ChatIcon className={`w-6 h-6 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', damping: AI_CHAT_CONFIG.springDamping, stiffness: AI_CHAT_CONFIG.springStiffness }}
            className="fixed bottom-20 right-4 z-40 max-w-[calc(100vw-2rem)]"
            style={{ width: AI_CHAT_CONFIG.panelWidth }}
          >
            <GlassPanel className="flex flex-col h-[500px] max-h-[70vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <h3 className="text-sm font-medium text-slate-200">{t('title')}</h3>
                  {/* Active skill indicator */}
                  <AnimatePresence>
                    {activeSkill && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-xs"
                      >
                        <SparklesIcon className="w-3 h-3" />
                        {activeSkill.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex items-center gap-2">
                  {canUndo && (
                    <button
                      onClick={onUndo}
                      className="text-xs text-slate-400 hover:text-slate-200 transition-colors px-2 py-1 rounded hover:bg-slate-700/50"
                    >
                      {t('undo')}
                    </button>
                  )}
                  <button
                    onClick={toggleExpand}
                    className="text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <MinimizeIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && !streamingContent && (
                  <div className="text-center text-slate-400 text-sm py-8">
                    <p>{t('welcomeMessage')}</p>
                    <div className="mt-4 space-y-2">
                      <SuggestionChip onClick={() => handleSendMessage(t('suggestion1'))} text={t('suggestion1')} />
                      <SuggestionChip onClick={() => handleSendMessage(t('suggestion2'))} text={t('suggestion2')} />
                      <SuggestionChip onClick={() => handleSendMessage(t('suggestion3'))} text={t('suggestion3')} />
                      {!isReadOnly && (
                        <button
                          onClick={() => setShowImportModal(true)}
                          className="w-full flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 hover:text-violet-200 transition-colors border border-violet-500/30"
                        >
                          <ImportIcon className="w-4 h-4" />
                          {t('suggestionImport')}
                        </button>
                      )}
                    </div>
                    {/* Slash commands hint */}
                    {slashCommands.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-700/30">
                        <p className="text-xs text-slate-500 mb-2">Available commands:</p>
                        <div className="flex flex-wrap gap-1 justify-center">
                          {slashCommands.map(cmd => (
                            <button
                              key={cmd.command}
                              onClick={() => handleSendMessage(cmd.command)}
                              className="px-2 py-1 text-xs rounded bg-slate-800/50 text-violet-400 hover:bg-slate-700/50 transition-colors"
                            >
                              {cmd.command}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {messages.map(message => (
                  <ChatMessage key={message.id} message={message} locale={locale} />
                ))}

                {streamingContent && (
                  <ChatMessage
                    message={{
                      id: 'streaming',
                      role: 'assistant',
                      content: streamingContent,
                      pending: true,
                    }}
                    locale={locale}
                  />
                )}

                {isLoading && !streamingContent && (
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <LoadingDots />
                    <span>{t('thinking')}</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <ChatInput
                onSend={handleSendMessage}
                disabled={isLoading || isReadOnly}
                placeholder={isReadOnly ? t('readOnlyPlaceholder') : t('inputPlaceholder')}
                slashCommands={slashCommands}
              />
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modification Preview Modal */}
      {pendingModification && (
        <ModificationPreview
          modifications={pendingModification.modifications}
          summaries={generateModificationSummary(pendingModification.modifications, locale)}
          onApply={handleApplyModification}
          onReject={handleRejectModification}
        />
      )}

      {/* Document Import Modal */}
      <DocumentImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={handleImportComplete}
        locale={locale}
        existingNodes={currentNodes}
        existingEdges={currentEdges}
        mode="update"
      />
    </>
  );
}

// Helper components
function LoadingDots() {
  return (
    <div className="flex gap-1">
      <motion.div
        className="w-2 h-2 bg-violet-400 rounded-full"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0 }}
      />
      <motion.div
        className="w-2 h-2 bg-violet-400 rounded-full"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
      />
      <motion.div
        className="w-2 h-2 bg-violet-400 rounded-full"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
      />
    </div>
  );
}

function SuggestionChip({ onClick, text }: { onClick: () => void; text: string }) {
  return (
    <button
      onClick={onClick}
      className="block w-full text-left text-xs px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-slate-100 transition-colors border border-slate-700/50"
    >
      {text}
    </button>
  );
}
