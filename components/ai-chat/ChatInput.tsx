'use client';

import { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { SendIcon } from '@/components/ui';
import { AI_CHAT_CONFIG } from '@/lib/constants';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled = false, placeholder }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    if (value.trim() && !disabled) {
      onSend(value.trim());
      setValue('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [value, disabled, onSend]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleInput = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, AI_CHAT_CONFIG.inputMaxHeight)}px`;
    }
  }, []);

  return (
    <div className="p-4 border-t border-slate-700/50">
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            disabled={disabled}
            placeholder={placeholder}
            rows={1}
            className={`
              w-full px-4 py-2 rounded-xl
              bg-slate-800/50 border border-slate-700/50
              text-slate-200 placeholder-slate-500
              text-sm resize-none
              focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all
            `}
            style={{ maxHeight: AI_CHAT_CONFIG.inputMaxHeight }}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          className={`
            p-2 rounded-xl
            bg-gradient-to-r from-violet-500 to-purple-600
            text-white
            hover:opacity-90 active:scale-95
            disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
            transition-all
          `}
          aria-label="Send message"
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
