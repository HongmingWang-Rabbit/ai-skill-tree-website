# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm dev              # Start dev server with Turbopack (http://localhost:3000)
pnpm build            # Production build
pnpm lint             # Run ESLint

# Database (Drizzle ORM with Neon PostgreSQL)
pnpm db:push          # Push schema changes to database
pnpm db:generate      # Generate migrations
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Drizzle Studio GUI
```

## Architecture

This is a Next.js 15 App Router application for generating AI-powered career skill trees.

### Core Data Flow

1. User enters a career query → `POST /api/ai/generate` → OpenAI GPT-4o generates skill tree JSON
2. Generated data is cached in Upstash Redis and persisted to Neon PostgreSQL
3. Skill tree is rendered as an interactive graph using React Flow (@xyflow/react)

### Key Directories

- `app/api/` - API routes: `/ai/generate`, `/career/[careerId]`, `/career/search`, `/skill/test`, `/user/progress`
- `components/skill-graph/` - React Flow visualization: `SkillGraph.tsx` (main), `SkillNode.tsx`, `SkillEdge.tsx`, radial/dagre layout utilities
- `lib/db/schema.ts` - Drizzle schema: careers, skillGraphs, skills, users (NextAuth), userCareerGraphs, userSkillProgress
- `lib/ai.ts` - OpenAI integration: `generateCareerSkillTree()`, `generateSkillTestQuestions()`, `gradeSkillTestAnswers()`

### Authentication

NextAuth.js with three providers:
- Google OAuth
- Twitter OAuth 2.0
- Web3 wallet (SIWE - Sign-In with Ethereum via wagmi/RainbowKit)

Session strategy is JWT. Auth config in `lib/auth.ts`.

### Database Schema (lib/db/schema.ts)

- `careers` - Generated careers with canonicalKey (unique slug)
- `skillGraphs` - JSONB nodes/edges for each career
- `userCareerGraphs` - User's saved progress per career
- `userSkillProgress` - Per-skill progress tracking

### Path Aliases

`@/*` maps to project root (e.g., `@/lib/db`, `@/components/ui`)
