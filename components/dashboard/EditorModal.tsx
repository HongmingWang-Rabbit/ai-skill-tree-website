'use client';

import { type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassPanel, CloseIcon, ArrowLeftIcon } from '@/components/ui';

export interface EditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  showBackButton?: boolean;
  onBack?: () => void;
  isLoading?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}

export function EditorModal({
  isOpen,
  onClose,
  title,
  showBackButton = false,
  onBack,
  isLoading = false,
  children,
  footer,
}: EditorModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && !isLoading && onClose()}
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
              <div className="flex items-center gap-3">
                {showBackButton && onBack && (
                  <button
                    onClick={onBack}
                    disabled={isLoading}
                    className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <ArrowLeftIcon className="w-5 h-5 text-slate-400" />
                  </button>
                )}
                <h2 className="text-lg font-semibold text-white">{title}</h2>
              </div>
              <button
                onClick={onClose}
                disabled={isLoading}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <CloseIcon className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="flex justify-end gap-3 p-4 border-t border-slate-700">
                {footer}
              </div>
            )}
          </GlassPanel>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Shared loading spinner component
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const sizeClasses = size === 'sm' ? 'w-3 h-3 border-2' : 'w-4 h-4 border-2';
  return (
    <div className={`${sizeClasses} border-slate-900 border-t-transparent rounded-full animate-spin`} />
  );
}

// Shared error alert component
export function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
      {message}
    </div>
  );
}

// Shared empty state component
export function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="text-center py-8 text-slate-500">
      <div className="text-4xl mb-3">{icon}</div>
      <p>{message}</p>
    </div>
  );
}
