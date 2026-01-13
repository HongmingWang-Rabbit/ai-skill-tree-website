# Internal Skill System

An MCP-like system for the Personal Skill Map platform that provides focused AI capabilities with reduced context usage.

## Features

- **On-demand loading** - Skills load only the context they need
- **Slash commands** - User-invocable commands like `/expand`, `/trending`, `/resources`
- **Intent routing** - Auto-detect user intent and route to the best skill
- **Tool composition** - Skills can use web search, graph operations, and more
- **Response validation** - Zod schemas ensure type-safe AI responses

## Quick Start

```typescript
import { skillSystem } from '@/lib/skills';

// Execute a skill based on user message
const result = await skillSystem.execute(message, fullContext);

// Stream response
for await (const event of skillSystem.executeStream(message, fullContext)) {
  if (event.chunk) console.log(event.chunk);
  if (event.result) console.log('Done:', event.result);
}

// Get available slash commands for UI
const commands = skillSystem.getSlashCommands();
// [{ command: '/expand', name: 'Expand Skills', description: '...' }, ...]
```

## Available Skills

| Command | Name | Description |
|---------|------|-------------|
| `/expand` | Expand Skills | Add new skills based on requirements or suggestions |
| `/trending` | Trending Tech | Find and add trending technologies (uses web search) |
| `/resources` | Learning Resources | Find tutorials, courses, certifications, and docs for skills |
| (fallback) | General Chat | Conversational skill map assistance |

## Architecture

```
lib/skills/
├── index.ts              # Main entry point, SkillSystem singleton
├── types.ts              # TypeScript interfaces
├── schemas.ts            # Shared Zod schemas
├── context.ts            # Context building utilities
├── router.ts             # Slash command and intent routing
├── executor.ts           # AI execution engine
├── tools/
│   ├── index.ts          # Tool registry
│   ├── web-search.ts     # Tavily web search wrapper
│   └── graph-ops.ts      # Skill graph manipulation
└── definitions/
    ├── index.ts          # Skill exports
    ├── expand.skill.ts   # /expand skill
    ├── trending.skill.ts # /trending skill
    ├── resources.skill.ts# /resources skill
    └── chat.skill.ts     # Fallback chat skill
```

## Creating a New Skill

```typescript
// lib/skills/definitions/my-skill.skill.ts

import type { SkillDefinition, SkillContext } from '../types';
import { BaseModificationResponseSchema } from '../schemas';
import { AI_CHAT_CONFIG } from '@/lib/constants';

export const mySkill: SkillDefinition = {
  id: 'my-skill',
  name: 'My Skill',
  description: 'What this skill does',
  aliases: ['alias1', 'alias2'],
  slashCommand: '/my-skill',

  // Regex patterns for auto-detection
  intentPatterns: [
    /\bmy skill pattern\b/i,
  ],

  // What context this skill needs
  contextRequirements: {
    needsSkillList: true,
    needsCareerInfo: true,
    needsChatHistory: false,
    needsUserMaps: false,
    maxSkillsInContext: AI_CHAT_CONFIG.skillContext.medium,
  },

  // Tools this skill can use
  tools: ['graph-ops'],

  // System prompt (can be string or function)
  systemPrompt: (ctx: SkillContext) => `
    You are a specialist for...
    Career: "${ctx.careerTitle}"

    Return JSON: { "message": "...", "modifications": {...} }
  `,

  // Zod schema for response validation
  responseSchema: BaseModificationResponseSchema,

  // Optional: pre-execute hook (e.g., fetch web data)
  async preExecute(ctx) {
    // Modify context before AI call
    return ctx;
  },

  // Optional: post-process the response
  postProcess(response, ctx) {
    return response;
  },

  maxTokens: AI_CHAT_CONFIG.skillMaxTokens.expand, // Use constants
};
```

Then register in `lib/skills/definitions/index.ts`:

```typescript
import { mySkill } from './my-skill.skill';

export const skills: SkillDefinition[] = [
  expandSkill,
  trendingSkill,
  resourcesSkill,
  mySkill,      // Add here
  chatSkill,    // Keep chat last (fallback)
];
```

## Context Management

Skills specify their context requirements to minimize token usage:

```typescript
contextRequirements: {
  needsSkillList: true,      // Include current skills?
  needsCareerInfo: true,     // Include career title/description?
  needsChatHistory: false,   // Include conversation history?
  needsUserMaps: false,      // Include user's other maps?
  maxSkillsInContext: 15,    // Max skills to include (0 = all)
}
```

Context limits are configured in `lib/constants.ts`:

```typescript
AI_CHAT_CONFIG: {
  skillContext: {
    minimal: 0,    // No skills
    small: 10,     // Brief context
    medium: 15,    // Standard
    default: 20,   // Default
    large: 30,     // Full chat
    historyLimit: 5,
  },
}
```

## Shared Schemas

Common response schemas in `lib/skills/schemas.ts`:

| Schema | Use Case |
|--------|----------|
| `BaseModificationResponseSchema` | Skills that modify the graph |
| `OptionalModificationResponseSchema` | Chat (modifications optional) |
| `ModificationWithSourcesResponseSchema` | Skills with source citations |
| `ResourcesResponseSchema` | Learning resources |

## Routing

The router checks in order:

1. **Slash command** - `/expand`, `/trending`, etc.
2. **Intent patterns** - Regex matching on message content
3. **Fallback** - Routes to `chatSkill`

```typescript
// Manual routing
const { skill, params, matchType } = skillSystem.route('/expand react');
// skill.id = 'expand', params = { args: 'react' }, matchType = 'slash-command'
```

## Tools

### Web Search (`web-search`)

Wraps Tavily API for web searches:

```typescript
import { searchTrending, searchLearning } from '@/lib/skills/tools/web-search';

// Search for trending tech
const results = await searchTrending('frontend development');

// Search for learning resources
const resources = await searchLearning('React', 5);
```

### Graph Operations (`graph-ops`)

Utilities for skill graph manipulation:

```typescript
import { applyModifications, createEdge } from '@/lib/skills/tools/graph-ops';

// Apply modifications to graph
const { nodes, edges } = applyModifications(currentNodes, currentEdges, {
  addNodes: [...],
  updateNodes: [...],
  removeNodes: [...],
  addEdges: [...],
  removeEdges: [...],
});
```

## API Integration

The skill system is used in `/api/ai/chat`:

```typescript
// app/api/ai/chat/route.ts
import { skillSystem, type FullContext } from '@/lib/skills';

// Build context
const fullContext: FullContext = {
  locale,
  careerTitle,
  careerDescription,
  nodes: currentNodes,
  edges: currentEdges,
  chatHistory,
  userMaps,
  userId,
  isAuthenticated,
};

// Execute skill
const result = await skillSystem.execute(message, fullContext);
```

## Token Savings

| Scenario | Before | After | Savings |
|----------|--------|-------|---------|
| `/expand` | ~2500 tokens | ~800 tokens | 68% |
| `/trending` | ~2500 tokens | ~1000 tokens | 60% |
| `/resources` | ~2500 tokens | ~600 tokens | 76% |
| General chat | ~2500 tokens | ~2000 tokens | 20% |

## Configuration

All skill system constants are in `lib/constants.ts` under `AI_CHAT_CONFIG`:

- `timeout` - AI call timeout (60000ms)
- `skillMaxTokens.*` - Max tokens per skill (expand, trending, resources, chat)
- `skillContext.*` - Context size limits
- `defaultCareerFallback` - Fallback career title

## Testing

Skills can be tested individually:

```typescript
import { expandSkill } from '@/lib/skills/definitions';
import { buildSkillContext } from '@/lib/skills/context';

// Build test context
const ctx = buildSkillContext(expandSkill, mockFullContext);

// Check system prompt
const prompt = expandSkill.systemPrompt(ctx);

// Validate mock response
const validated = expandSkill.responseSchema.parse(mockResponse);
```
