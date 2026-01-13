# Skill System Design Document

> **Status:** Implemented
> **Location:** `lib/skills/`
> **Documentation:** See `lib/skills/README.md` for usage guide

## Overview

The skill system is an internal MCP-like architecture for the Personal Skill Map platform that:

1. **Reduces context window** - Skills load on-demand with minimal context
2. **Better tooling** - Structured approach to AI capabilities
3. **Slash commands** - User-invocable skills like `/expand`, `/trending`
4. **Intent routing** - Auto-detect and route to best skill

## Architecture

```
lib/skills/
├── index.ts              # SkillSystem singleton, exports
├── types.ts              # TypeScript interfaces
├── schemas.ts            # Shared Zod schemas
├── context.ts            # Context building utilities
├── router.ts             # Slash command and intent routing
├── executor.ts           # AI execution engine
├── tools/
│   ├── index.ts          # Tool registry
│   ├── web-search.ts     # Tavily wrapper
│   └── graph-ops.ts      # Graph manipulation
└── definitions/
    ├── index.ts          # Skill registry
    ├── expand.skill.ts   # /expand
    ├── trending.skill.ts # /trending
    ├── resources.skill.ts# /resources
    └── chat.skill.ts     # Fallback
```

## Token Comparison

### Before (Monolithic Chat)
```
System prompt: ~800 tokens (full SCOPE_GUARD + all instructions)
All skills (23): ~500 tokens
Chat history (10): ~1000 tokens
Career info: ~100 tokens
User maps: ~100 tokens
---
Total per message: ~2500 tokens
```

### After (Skill System)
```
Skill-specific prompt: ~200-400 tokens
Relevant skills (10-15): ~200 tokens
History (only if needed): 0-500 tokens
Career info (only if needed): 0-100 tokens
---
Total per message: ~400-1200 tokens (50-80% reduction)
```

## Design Decisions

### 1. On-Demand Context Loading

Each skill declares what context it needs:

```typescript
contextRequirements: {
  needsSkillList: true,
  needsCareerInfo: true,
  needsChatHistory: false,  // Most skills don't need history
  needsUserMaps: false,
  maxSkillsInContext: 15,   // Limit skills sent
}
```

This prevents sending full context for every message.

### 2. Intent-Based Routing

Skills define regex patterns for auto-detection:

```typescript
intentPatterns: [
  /\b(trending|latest|new|hot)\b.*\b(tech|skill)/i,
  /\bwhat('s| is) trending\b/i,
]
```

Fallback to general chat when no pattern matches.

### 3. Pre/Post Execution Hooks

Skills can hook into the execution lifecycle:

- `preExecute`: Fetch data before AI call (e.g., web search)
- `postProcess`: Transform response before returning

### 4. Shared Schemas

Common schemas extracted to `schemas.ts`:

- `ModificationsSchema` - Graph modifications
- `BaseModificationResponseSchema` - Standard response
- `OptionalModificationResponseSchema` - Chat response
- `ResourcesResponseSchema` - Learning resources

### 5. Tool Composition

Skills declare which tools they use:

```typescript
tools: ['web-search', 'graph-ops']
```

Tools are registered in the ToolRegistry and can be shared across skills.

## Future Enhancements

### Potential New Skills

| Skill | Purpose |
|-------|---------|
| `/merge` | Combine two skill maps |
| `/test` | Generate skill assessment |
| `/analyze` | Analyze imported documents |
| `/roadmap` | Generate learning roadmap |

### Advanced Features

1. **Skill chaining** - One skill triggers another
2. **User-defined skills** - Custom prompts per user
3. **Skill analytics** - Usage tracking and optimization
4. **Skill suggestions** - Context-aware recommendations

## Related Files

- `app/api/ai/chat/route.ts` - API integration
- `components/ai-chat/ChatInput.tsx` - Slash command UI
- `components/ai-chat/AIChatPanel.tsx` - Chat panel
- `lib/constants.ts` - `AI_CHAT_CONFIG.skillContext`
- `lib/mcp/tavily.ts` - Underlying web search
