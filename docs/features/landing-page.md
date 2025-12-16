# Landing Page Structure

The landing page (`app/[locale]/(marketing)/page.tsx`) is organized into modular sections.

## Sections (top to bottom)

1. **HeroSection** - Main headline, Import CTA button, "or explore careers" link
2. **TwoPathsSection** - Two cards: "Start from Resume" vs "Explore Career Paths"
3. **WorkflowSection** - 3-step process: Import → Visualize → Export
4. **FeaturesSection** - 6 feature cards (Import, Skill Maps, Resume, Chat, Universe, Share)
5. **DemoPreviewSection** - Animated skill graph visualization with orbital nodes
6. **StatsSection** - Platform statistics
7. **SecondaryCTASection** - Career search with SearchInput + featured careers
8. **Footer** - Build credits

## Key Integration Points

- `DocumentImportModal` opens from Hero CTA and TwoPathsSection
- `SuggestionsModal` opens when vague career query returns suggestions
- All text uses i18n translations from `home.*` namespace
- All configurable values use `LANDING_PAGE_CONFIG` from constants

## Configuration

`LANDING_PAGE_CONFIG` in `lib/constants.ts`:

```typescript
LANDING_PAGE_CONFIG = {
  featuredCareers: [{ titleKey, icon, key }],  // Popular career buttons
  stats: [{ key, value }],                      // Stats section metrics
  workflowSteps: [{ key, icon }],               // How it works steps
  demo: { orbitalSkillCount, orbitalRadius, connectionLineWidth },
  animation: { sectionDelay, staggerDelay, duration },
}
```
