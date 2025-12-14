'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_ROUTES, QUERY_CONFIG } from '@/lib/constants';
import type { WorkExperience } from '@/lib/schemas';

// ============================================
// Types
// ============================================

interface SavedGraph {
  id: string;
  careerId: string;
  title: string | null;
  nodeData: Array<{
    skillId: string;
    progress: number;
    position?: { x: number; y: number };
  }>;
  isPublic: boolean;
  shareSlug: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CareerInfo {
  id: string;
  title: string;
  canonicalKey: string;
  locale: string;
}

interface SavedCareer {
  graph: SavedGraph;
  career: CareerInfo | null;
}

interface UserProfile {
  name: string | null;
  email: string | null;
  bio: string | null;
  experience: WorkExperience[];
}

interface SkillData {
  id: string;
  name: string;
  icon: string;
  level: number;
  category: string;
  progress: number;
}

interface CareerWithSkills {
  id: string;
  careerId: string;
  title: string;
  skills: SkillData[];
}

interface MasterMapData {
  userName: string;
  careers: CareerWithSkills[];
  stats: {
    totalCareers: number;
    totalSkills: number;
    masteredSkills: number;
    inProgressSkills: number;
  };
}

// ============================================
// Query Keys (for cache invalidation)
// ============================================

export const queryKeys = {
  userGraphs: ['userGraphs'] as const,
  userProfile: ['userProfile'] as const,
  masterMap: ['masterMap'] as const,
  userCredits: ['userCredits'] as const,
  userSubscription: ['userSubscription'] as const,
  stripePrices: ['stripePrices'] as const,
  career: (id: string, locale: string) => ['career', id, locale] as const,
  map: (id: string) => ['map', id] as const,
};

// ============================================
// Hooks
// ============================================

/**
 * Fetch user's saved career graphs
 * Replaces the manual useEffect in dashboard
 */
export function useUserGraphs(enabled = true) {
  return useQuery<SavedCareer[]>({
    queryKey: queryKeys.userGraphs,
    queryFn: async () => {
      const response = await fetch(API_ROUTES.USER_GRAPH);
      const data = await response.json();
      if (!response.ok || !data.graphs) {
        throw new Error(data.error || 'Failed to fetch user graphs');
      }
      return data.graphs;
    },
    enabled,
    staleTime: QUERY_CONFIG.staleTime,
  });
}

/**
 * Fetch user profile (bio and experience)
 * Replaces the manual useEffect in dashboard
 */
export function useUserProfile(enabled = true) {
  return useQuery<UserProfile>({
    queryKey: queryKeys.userProfile,
    queryFn: async () => {
      const response = await fetch(API_ROUTES.USER_PROFILE);
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch profile');
      }
      return data.data;
    },
    enabled,
    staleTime: QUERY_CONFIG.staleTime,
  });
}

/**
 * Fetch master skill map data
 * Replaces the manual useEffect in MasterSkillMap
 */
export function useMasterMap(enabled = true) {
  return useQuery<MasterMapData>({
    queryKey: queryKeys.masterMap,
    queryFn: async () => {
      const response = await fetch(API_ROUTES.USER_MASTER_MAP);
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch master map');
      }
      return data.data;
    },
    enabled,
    staleTime: QUERY_CONFIG.staleTime,
  });
}

/**
 * Update user profile (bio, experience, name)
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<{ bio: string; experience: WorkExperience[]; name: string }>) => {
      const response = await fetch(API_ROUTES.USER_PROFILE, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }
      return data;
    },
    onSuccess: () => {
      // Invalidate profile query to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfile });
    },
  });
}

/**
 * Delete a skill map
 */
export function useDeleteMap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mapId: string) => {
      const response = await fetch(`${API_ROUTES.MAP}/${mapId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete map');
      }
      return mapId;
    },
    onSuccess: () => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.userGraphs });
      queryClient.invalidateQueries({ queryKey: queryKeys.masterMap });
    },
  });
}

// ============================================
// Billing Hooks
// ============================================

interface UserCreditsData {
  balance: number;
  history: Array<{
    id: string;
    amount: number;
    balanceAfter: number;
    type: string;
    operation: string;
    createdAt: string;
  }>;
}

interface UserSubscriptionData {
  tier: 'free' | 'pro' | 'premium';
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  limits: {
    maxMaps: number; // -1 means unlimited (Infinity can't be serialized to JSON)
    currentMaps: number;
    hasWatermark: boolean;
    monthlyCredits: number;
  };
}

/**
 * Fetch user's credit balance and history
 */
export function useUserCredits(enabled = true) {
  return useQuery<UserCreditsData>({
    queryKey: queryKeys.userCredits,
    queryFn: async () => {
      const response = await fetch(API_ROUTES.USER_CREDITS);
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch credits');
      }
      return data.data;
    },
    enabled,
    staleTime: QUERY_CONFIG.staleTime,
  });
}

/**
 * Fetch user's subscription info
 */
export function useUserSubscription(enabled = true) {
  return useQuery<UserSubscriptionData>({
    queryKey: queryKeys.userSubscription,
    queryFn: async () => {
      const response = await fetch(API_ROUTES.USER_SUBSCRIPTION);
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch subscription');
      }
      return data.data;
    },
    enabled,
    staleTime: QUERY_CONFIG.staleTime,
  });
}

// ============================================
// Stripe Pricing Hooks
// ============================================

interface StripePriceInfo {
  id: string;
  productKey: string;
  unitAmount: number | null;
  currency: string;
  interval: 'month' | 'year' | null;
  active: boolean;
}

interface StripePricesData {
  subscriptions: {
    proMonthly: StripePriceInfo | null;
    proYearly: StripePriceInfo | null;
    premiumMonthly: StripePriceInfo | null;
    premiumYearly: StripePriceInfo | null;
  };
  creditPacks: {
    credits500: StripePriceInfo | null;
    credits2000: StripePriceInfo | null;
    credits5000: StripePriceInfo | null;
  };
}

/**
 * Fetch Stripe prices for subscriptions and credit packs
 * Prices are cached for longer since they rarely change
 */
export function useStripePrices() {
  return useQuery<StripePricesData>({
    queryKey: queryKeys.stripePrices,
    queryFn: async () => {
      const response = await fetch(API_ROUTES.STRIPE_PRICES);
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch prices');
      }
      return data.data;
    },
    // Prices rarely change, cache for 10 minutes
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Format price from Stripe (cents to dollars with currency symbol)
 */
export function formatStripePrice(
  unitAmount: number | null | undefined,
  currency: string = 'usd'
): string {
  if (unitAmount === null || unitAmount === undefined) {
    return '—';
  }

  const amount = unitAmount / 100;
  const formatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return formatter.format(amount);
}

/**
 * Combined dashboard data hook
 * Fetches both user graphs and profile in parallel
 */
export function useDashboardData(userId: string | undefined) {
  const isEnabled = !!userId;

  const graphsQuery = useUserGraphs(isEnabled);
  const profileQuery = useUserProfile(isEnabled);

  return {
    graphs: graphsQuery.data,
    profile: profileQuery.data,
    isLoading: graphsQuery.isLoading || profileQuery.isLoading,
    isError: graphsQuery.isError || profileQuery.isError,
    error: graphsQuery.error || profileQuery.error,
    refetchGraphs: graphsQuery.refetch,
    refetchProfile: profileQuery.refetch,
  };
}
