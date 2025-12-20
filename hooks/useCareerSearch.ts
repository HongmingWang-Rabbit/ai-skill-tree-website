'use client';

import { useState, useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { API_ROUTES, ROUTES } from '@/lib/constants';
import { normalizeCareerKey } from '@/lib/normalize-career';
import type { CareerSuggestion } from '@/lib/ai';
import type { Locale } from '@/i18n/routing';

export interface CareerSearchResult {
  type: 'specific' | 'suggestions';
  career?: { canonicalKey: string };
  suggestions?: CareerSuggestion[];
}

export interface UseCareerSearchOptions {
  /**
   * Called when a specific career is found. If not provided, navigates to the career page.
   */
  onSpecificCareer?: (canonicalKey: string) => void;
  /**
   * Called when suggestions are returned. If not provided, navigates to the first suggestion.
   */
  onSuggestions?: (suggestions: CareerSuggestion[]) => void;
  /**
   * Called on any error or when no results are found. If not provided, navigates using normalized query.
   */
  onFallback?: (query: string) => void;
}

export interface UseCareerSearchReturn {
  /**
   * Whether a search is currently in progress
   */
  isSearching: boolean;
  /**
   * Execute a career search
   */
  search: (query: string) => Promise<void>;
  /**
   * Current suggestions (if any)
   */
  suggestions: CareerSuggestion[];
  /**
   * Clear current suggestions
   */
  clearSuggestions: () => void;
}

/**
 * Hook for searching careers with AI analysis.
 * Handles the common pattern of analyzing a query and navigating to results.
 */
export function useCareerSearch(options: UseCareerSearchOptions = {}): UseCareerSearchReturn {
  const router = useRouter();
  const locale = useLocale() as Locale;
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<CareerSuggestion[]>([]);

  const navigateToCareer = useCallback((canonicalKey: string) => {
    router.push(`${ROUTES.CAREER}/${canonicalKey}`);
  }, [router]);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    setSuggestions([]);

    try {
      const response = await fetch(API_ROUTES.AI_ANALYZE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), locale }),
      });
      const result = await response.json();

      if (result.success && result.data) {
        if (result.data.type === 'specific' && result.data.career?.canonicalKey) {
          const canonicalKey = result.data.career.canonicalKey;
          if (options.onSpecificCareer) {
            options.onSpecificCareer(canonicalKey);
          } else {
            navigateToCareer(canonicalKey);
          }
        } else if (result.data.type === 'suggestions' && result.data.suggestions?.length > 0) {
          const resultSuggestions = result.data.suggestions as CareerSuggestion[];
          setSuggestions(resultSuggestions);
          if (options.onSuggestions) {
            options.onSuggestions(resultSuggestions);
          } else {
            // Default: navigate to first suggestion
            navigateToCareer(resultSuggestions[0].canonicalKey);
          }
        } else {
          // No valid results
          handleFallback(query);
        }
      } else {
        handleFallback(query);
      }
    } catch {
      handleFallback(query);
    } finally {
      setIsSearching(false);
    }

    function handleFallback(q: string) {
      if (options.onFallback) {
        options.onFallback(q);
      } else {
        navigateToCareer(normalizeCareerKey(q));
      }
    }
  }, [locale, navigateToCareer, options]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return {
    isSearching,
    search,
    suggestions,
    clearSuggestions,
  };
}
