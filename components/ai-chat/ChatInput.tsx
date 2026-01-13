'use client';

import { useState, useRef, useCallback, useEffect, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SendIcon, SparklesIcon } from '@/components/ui';
import { AI_CHAT_CONFIG } from '@/lib/constants';

export interface SlashCommand {
  command: string;
  name: string;
  description: string;
}

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  slashCommands?: SlashCommand[];
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder,
  slashCommands = [],
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredCommands, setFilteredCommands] = useState<SlashCommand[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const commandsRef = useRef<HTMLDivElement>(null);

  // Filter commands based on input
  useEffect(() => {
    if (value.startsWith('/')) {
      const query = value.slice(1).toLowerCase();
      const filtered = slashCommands.filter(
        (cmd) =>
          cmd.command.toLowerCase().includes(query) ||
          cmd.name.toLowerCase().includes(query)
      );
      setFilteredCommands(filtered);
      setShowCommands(filtered.length > 0 && value.length > 0);
      setSelectedIndex(0);
    } else {
      setShowCommands(false);
    }
  }, [value, slashCommands]);

  const handleSubmit = useCallback(() => {
    if (value.trim() && !disabled) {
      onSend(value.trim());
      setValue('');
      setShowCommands(false);
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [value, disabled, onSend]);

  const handleSelectCommand = useCallback((command: SlashCommand) => {
    setValue(command.command + ' ');
    setShowCommands(false);
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (showCommands && filteredCommands.length > 0) {
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            setSelectedIndex((prev) =>
              prev < filteredCommands.length - 1 ? prev + 1 : 0
            );
            return;
          case 'ArrowUp':
            e.preventDefault();
            setSelectedIndex((prev) =>
              prev > 0 ? prev - 1 : filteredCommands.length - 1
            );
            return;
          case 'Tab':
          case 'Enter':
            e.preventDefault();
            handleSelectCommand(filteredCommands[selectedIndex]);
            return;
          case 'Escape':
            e.preventDefault();
            setShowCommands(false);
            return;
        }
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [showCommands, filteredCommands, selectedIndex, handleSelectCommand, handleSubmit]
  );

  const handleInput = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, AI_CHAT_CONFIG.inputMaxHeight)}px`;
    }
  }, []);

  // Scroll selected command into view
  useEffect(() => {
    if (showCommands && commandsRef.current) {
      const selected = commandsRef.current.children[selectedIndex] as HTMLElement;
      selected?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, showCommands]);

  return (
    <div className="p-4 border-t border-slate-700/50">
      <div className="relative">
        {/* Slash Command Palette */}
        <AnimatePresence>
          {showCommands && filteredCommands.length > 0 && (
            <motion.div
              ref={commandsRef}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full left-0 right-0 mb-2 max-h-48 overflow-y-auto rounded-xl bg-slate-800/95 border border-slate-700/50 shadow-xl backdrop-blur-sm"
            >
              {filteredCommands.map((cmd, index) => (
                <button
                  key={cmd.command}
                  onClick={() => handleSelectCommand(cmd)}
                  className={`
                    w-full px-4 py-3 text-left flex items-start gap-3
                    transition-colors
                    ${index === selectedIndex ? 'bg-violet-500/20' : 'hover:bg-slate-700/50'}
                  `}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <SparklesIcon className="w-4 h-4 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-violet-300">
                        {cmd.command}
                      </span>
                      <span className="text-xs text-slate-500">{cmd.name}</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {cmd.description}
                    </p>
                  </div>
                </button>
              ))}
              <div className="px-4 py-2 text-xs text-slate-500 border-t border-slate-700/50">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">↑↓</kbd>
                {' '}navigate{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">Tab</kbd>
                {' '}select{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">Esc</kbd>
                {' '}close
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              disabled={disabled}
              placeholder={placeholder || 'Type / for commands...'}
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
            {/* Slash hint */}
            {value === '' && !disabled && slashCommands.length > 0 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <span className="text-xs text-slate-600">
                  Type <kbd className="px-1 py-0.5 rounded bg-slate-700/50 text-slate-500">/</kbd> for commands
                </span>
              </div>
            )}
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
    </div>
  );
}
