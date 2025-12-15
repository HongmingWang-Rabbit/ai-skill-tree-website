# Repository Guidelines

## Project Structure & Modules
- `app/`: Next.js App Router with locale folders (`[locale]`) for marketing, dashboard, pricing, and API routes under `app/api/` (AI, career, import, learning, resume, Stripe).
- `components/`: Reusable UI (AI chat, import, learning resources, resume export) plus shared atoms.
- `lib/` and `hooks/`: Server/client utilities (auth, db, caching, formatting) and React hooks; `i18n/` and `messages/` hold locale config and translations.
- `drizzle/`: SQL migrations and schema artifacts; `drizzle.config.ts` configures generation.
- `public/` for static assets, `scripts/` for maintenance helpers, `middleware.ts` for locale handling.

## Existing Utilities to Use (see CLAUDE.md)
- Reuse helpers in `lib/` before writing new code (cache, AI calls, resume/import parsers, Stripe/credits/subscription helpers, constants).
- Check `components/ui/` and feature folders (ai-chat, import, learning, resume, skill-graph) for ready-made UI pieces.
- i18n: import `locales`/`Locale` from `@/i18n/routing`; use `getLocalePath()` for auth callbacks; strings live in `messages/*.json`.

## Build, Test, and Development
- Install deps: `pnpm install` (Node 18+).
- Local dev (Turbopack): `pnpm dev` or `pnpm dev:fresh` to clear `.next`.
- Type checks/lint: `pnpm lint` (Next.js ESLint config).
- Production build: `pnpm build`; serve: `pnpm start` (requires env set).
- Drizzle: `pnpm db:generate` (SQL from schema), `pnpm db:migrate` (apply migrations), `pnpm db:push` (sync schema), `pnpm db:studio` (inspect).

## Coding Style & Naming
- Language: TypeScript (strict) with `@/*` import alias; JSX in App Router; keep server code async/edge-safe.
- Components/React hooks: PascalCase for components/files, `useX` prefix for hooks, route segments follow Next conventions (`[param]`, `(group)`).
- Styling: Tailwind CSS v4 in `app/globals.css`; prefer utility-first classes over inline styles.
- Linting: Fix warnings before PR; avoid disabling rules unless justified in-code.

## Testing & Quality
- No dedicated test suite yet; run `pnpm lint` and a full `pnpm build` before proposing changes.
- Add targeted unit/integration tests when introducing logic-heavy modules; colocate near sources or under `__tests__/` with clear names (e.g., `feature.spec.ts`).
- For UI changes, include before/after screenshots or short notes on affected routes/locales.

## Commit & PR Guidelines
- Commit style follows conventional prefixes seen in history: `feat:`, `fix:`, `chore:`, etc., with short action-oriented messages.
- PRs should include: what changed, why, affected routes/locales, migration or env impacts, and test evidence (`pnpm lint`, `pnpm build`, relevant DB commands).
- Link issues/tasks when available; request review for DB or auth changes; avoid committing secrets or `.env.local`.

## Security & Configuration
- Copy `.env.example` to `.env.local` and fill Neon, Upstash, OpenAI, NextAuth, Stripe, and optional OAuth keys; never commit secrets.
- Run DB commands against the intended environment; check `drizzle.config.ts` before generating/migrating.
- For AI or billing changes, verify rate limits and webhook URLs match `NEXT_PUBLIC_APP_URL`.
