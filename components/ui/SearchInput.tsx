'use client';

import { useState, useCallback } from 'react';

interface SearchInputProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  isLoading?: boolean;
}

export function SearchInput({
  onSearch,
  placeholder = 'Search for a career...',
  isLoading = false,
}: SearchInputProps) {
  const [query, setQuery] = useState('');

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
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          className="
            w-full px-6 py-4 pr-14
            bg-slate-800/50 backdrop-blur-sm
            border border-slate-700 focus:border-cyan-400
            rounded-2xl
            text-white placeholder-slate-500
            text-lg
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
            absolute right-2 top-1/2 -translate-y-1/2
            p-3 rounded-xl
            bg-gradient-to-r from-cyan-500 to-purple-500
            hover:from-cyan-400 hover:to-purple-400
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
          "
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-white"
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
