'use client';

import { useState, useCallback, useEffect } from 'react';

interface SearchInputProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  mobilePlaceholder?: string;
  isLoading?: boolean;
  className?: string;
}

export function SearchInput({
  onSearch,
  placeholder = 'Search for a career...',
  mobilePlaceholder,
  isLoading = false,
  className = '',
}: SearchInputProps) {
  const [query, setQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // 640px matches Tailwind's sm breakpoint
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const displayPlaceholder = isMobile && mobilePlaceholder ? mobilePlaceholder : placeholder;

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        onSearch(query.trim());
      }
    },
    [query, onSearch]
  );

  return (
    <form onSubmit={handleSubmit} className={`w-full max-w-2xl ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={displayPlaceholder}
          disabled={isLoading}
          className="
            w-full px-4 sm:px-6 py-3 sm:py-4 pr-12 sm:pr-14
            bg-slate-800/50 backdrop-blur-sm
            border border-slate-700 focus:border-cyan-400
            rounded-xl sm:rounded-2xl
            text-white placeholder-slate-500
            text-sm sm:text-lg
            outline-none
            transition-all duration-200
            focus:ring-2 focus:ring-cyan-400/20
            disabled:opacity-50
          "
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="
            absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2
            p-2.5 sm:p-3 rounded-lg sm:rounded-xl
            bg-gradient-to-r from-cyan-500 to-purple-500
            hover:from-cyan-400 hover:to-purple-400
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
          "
        >
          {isLoading ? (
            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 sm:h-5 sm:w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
        </button>
      </div>
    </form>
  );
}
