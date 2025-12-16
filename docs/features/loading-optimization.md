# Loading Optimization

Comprehensive loading optimization for better perceived performance.

## Loading Pages (Next.js Suspense)

- `app/[locale]/dashboard/loading.tsx` - Dashboard skeleton
- `app/[locale]/career/[careerId]/loading.tsx` - Career page skeleton

## Skeleton Components

- `SkillGraphSkeleton` - Animated orbital nodes while React Flow loads
- `MasterSkillGraphSkeleton` - Skill universe loading state

## Lazy Loading Heavy Components

```tsx
import dynamic from 'next/dynamic';

// Lazy load React Flow (~100KB savings)
const LazySkillGraph = dynamic(
  () => import('@/components/skill-graph/LazySkillGraph').then(mod => mod.LazySkillGraph),
  { ssr: false }
);

// Lazy load modals
const DocumentImportModal = dynamic(
  () => import('@/components/import/DocumentImportModal').then(mod => mod.DocumentImportModal),
  { ssr: false }
);
```

## Components with Lazy Wrappers

- `LazySkillGraph` - Wraps SkillGraph with skeleton fallback
- `LazyMasterSkillGraph` - Wraps MasterSkillGraph

## React Query for Data Fetching

```tsx
import { useUserGraphs, useDeleteMap } from '@/hooks/useQueryHooks';

const { data: graphs, isLoading } = useUserGraphs(!!userId);
const deleteMapMutation = useDeleteMap();

deleteMapMutation.mutate(mapId, {
  onSuccess: () => showToast.success('Deleted'),
});
```

## Query Configuration

`QUERY_CONFIG` in constants:
- `staleTime`: 60 seconds
- `gcTime`: 5 minutes
- `retryCount`: 1

## Best Practices

1. Use `loading.tsx` for route-level loading states
2. Use skeleton components matching actual UI layout
3. Lazy load React Flow, PDF renderer, heavy modals
4. Use React Query hooks for data fetching with caching
5. Prefer lazy loading for components not needed initially
