# CLAUDE.md

Guidance for Claude Code. **Check existing utilities before implementing new code.**

## Commands

```bash
pnpm dev          # Dev server (Turbopack)
pnpm build        # Production build
pnpm lint         # ESLint
pnpm db:push      # Push schema changes
pnpm db:studio    # Drizzle Studio GUI
```

## Quick Reference

| Need | Use |
|------|-----|
| Path alias | `@/*` → project root |
| Assets | `ASSETS.ICON`, `ASSETS.ICON_LARGE` from `lib/constants` |
| Credits | `hasEnoughCredits()` before, `deductCredits()` after AI ops |
| Subscriptions | `canCreateMap()`, `shouldHaveWatermark()` |
| Lazy load | `next/dynamic` with `ssr: false` for React Flow, PDFs |
| i18n | Import `Link`, `useRouter` from `@/i18n/navigation` |
| Locales | `en`, `zh`, `ja` in `i18n/routing.ts` |

## UI Patterns

```tsx
// Confirmation
import { ConfirmModal } from '@/components/ui';
<ConfirmModal isOpen={show} onConfirm={fn} title="..." message="..." variant="danger" />

// Toast
import { showToast } from '@/components/ui';
showToast.success('Done'); showToast.error('Failed');

// Dropdown
import { DropdownMenu } from '@/components/ui';
<DropdownMenu items={[{ id: 'x', label: 'X', onClick: fn }]} />
```

## Key Files

- `lib/constants.ts` - All constants (routes, billing, configs)
- `lib/schemas.ts` - Zod schemas and shared types
- `lib/credits.ts` - Credit management
- `lib/auth.ts` - NextAuth (Google, Twitter, WeChat, Web3)
- `hooks/useQueryHooks.ts` - React Query hooks

## Before Completing Tasks

1. No hardcoded values (use constants)
2. No temp code, unnecessary logs, or comments
3. Update `messages/*.json` for new UI strings

## Detailed Docs

- [Architecture Reference](docs/architecture.md) - Libraries, components, schemas
- [Feature Docs](docs/features/) - Document import, resume export, billing, etc.
