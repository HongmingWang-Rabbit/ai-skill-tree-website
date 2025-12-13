'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { type ChatMessageType } from './AIChatPanel';
import { generateModificationSummary, type ChatModification } from '@/lib/ai-chat';
import { type Locale } from '@/i18n/routing';
import { WarningIcon, EditIcon } from '@/components/ui';

interface ChatMessageProps {
  message: ChatMessageType;
  locale: Locale;
}

export function ChatMessage({ message, locale }: ChatMessageProps) {
  const t = useTranslations('aiChat');
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`
          max-w-[85%] rounded-2xl px-4 py-2
          ${isUser
            ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white'
            : 'bg-slate-800/80 text-slate-200 border border-slate-700/50'
          }
          ${message.pending ? 'animate-pulse' : ''}
        `}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

        {/* Show modification summary if available */}
        {message.modifications && !message.isOffTopic && (
          <ModificationBadges
            modifications={message.modifications}
            locale={locale}
          />
        )}

        {/* Off-topic indicator */}
        {message.isOffTopic && (
          <div className="mt-2 flex items-center gap-1 text-xs text-amber-400">
            <WarningIcon className="w-3 h-3" />
            <span>{t('offTopicRequest')}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ModificationBadges({
  modifications,
  locale,
}: {
  modifications: ChatModification['modifications'];
  locale: Locale;
}) {
  const summaries = generateModificationSummary(modifications, locale);

  if (summaries.length === 0) return null;

  return (
    <div className="mt-2 pt-2 border-t border-slate-600/50 space-y-1">
      {summaries.map((summary, index) => (
        <div
          key={index}
          className="inline-flex items-center gap-1 text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full mr-1"
        >
          <EditIcon className="w-3 h-3" />
          <span>{summary}</span>
        </div>
      ))}
    </div>
  );
}
