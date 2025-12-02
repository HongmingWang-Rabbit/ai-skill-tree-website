# Career Builder — Definitive Tech Stack

**No alternatives. No "or". Just the best choice for each layer.**

---

## 1. Framework

**Next.js 15 (App Router)**

- Turbopack for fast dev builds
- React Server Components for data fetching
- Built-in API routes
- Best ecosystem support, most production-ready

---

## 2. Database

**Neon (Serverless PostgreSQL)**

Why Neon over Supabase:
- Pure serverless Postgres (scale-to-zero)
- Instant database branching (git-like workflows)
- Native Vercel integration
- Lower latency for serverless functions
- You don't need Supabase's auth/storage extras—Neon is cleaner for your use case

Connection string format:
```
postgresql://user:pass@ep-xxx.region.neon.tech/dbname?sslmode=require
```

---

## 3. ORM

**Drizzle ORM**

Why Drizzle over Prisma:
- 3-5x faster query execution
- Smaller bundle size (critical for serverless cold starts)
- SQL-first approach = better for complex skill graph queries
- No binary dependencies
- Native edge runtime support
- TypeScript schema-as-code (no separate `.prisma` file)

```ts
// Example schema
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const careers = pgTable('careers', {
  id: uuid('id').primaryKey().defaultRandom(),
  canonicalKey: text('canonical_key').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  skillGraphId: uuid('skill_graph_id'),
  generatedAt: timestamp('generated_at').defaultNow(),
});
```

---

## 4. Cache

**Upstash Redis**

Why Upstash:
- HTTP-based (works in edge functions)
- Serverless with per-request pricing
- Native Vercel integration
- Built-in rate limiting utilities
- No connection pooling headaches

```ts
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
await redis.set('career:software_engineer', careerData, { ex: 86400 });
```

---

## 5. AI Provider

**OpenAI API — gpt-4o**

Why gpt-4o:
- Fast response times
- Strong structured JSON output with response_format
- 128K context window
- Excellent for code generation and data extraction
- Wide ecosystem and documentation

```ts
import OpenAI from 'openai';

const openai = new OpenAI();

const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  response_format: { type: 'json_object' },
  messages: [
    { role: 'system', content: 'Return valid JSON only.' },
    { role: 'user', content: prompt }
  ],
});

const data = JSON.parse(response.choices[0].message.content);
```

---

## 6. Visualization

**React Flow (@xyflow/react)**

Why React Flow over raw D3.js:
- Built-in zoom, pan, drag, selection
- Custom nodes are just React components (full Tailwind support)
- Animated edges out of the box
- Uses D3 under the hood (d3-zoom) — you get D3's power
- 10x faster development
- Perfect for game-like skill trees with glow effects, progress states

```tsx
'use client';
import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { SkillNode } from './SkillNode';

const nodeTypes = { skill: SkillNode };

export function SkillGraph({ nodes, edges }) {
  return (
    <div className="w-full h-[600px]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
```

Custom skill node with game-like styling:
```tsx
// components/skill-graph/SkillNode.tsx
import { Handle, Position } from '@xyflow/react';

export function SkillNode({ data }) {
  const isUnlocked = data.progress === 100;
  
  return (
    <div className={`
      relative p-4 rounded-xl border-2 min-w-[120px]
      transition-all duration-300
      ${isUnlocked 
        ? 'border-neon-cyan bg-slate-800 shadow-[0_0_20px_rgba(0,240,255,0.5)]' 
        : 'border-slate-600 bg-slate-900 opacity-60'}
    `}>
      <Handle type="target" position={Position.Top} />
      
      <div className="text-center">
        <div className="text-2xl mb-1">{data.icon}</div>
        <div className="font-bold text-white">{data.name}</div>
        <div className="text-xs text-slate-400">Level {data.level}</div>
        
        {/* Progress ring */}
        <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-cyan-400 to-purple-500"
            style={{ width: `${data.progress}%` }}
          />
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
```

Auto-layout with Dagre (for tree structure):
```tsx
// components/skill-graph/use-skill-layout.ts
import dagre from 'dagre';
import { Node, Edge } from '@xyflow/react';

export function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 100 });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: 150, height: 100 });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    return { ...node, position: { x: pos.x - 75, y: pos.y - 50 } };
  });
}
```

---

## 7. Styling

**Tailwind CSS v4**

Why Tailwind:
- Utility-first = fast prototyping
- Native animation utilities
- Works perfectly with Next.js
- Easy to create RPG/neon aesthetics

```css
/* globals.css additions for game-like UI */
@theme {
  --color-neon-cyan: #00f0ff;
  --color-neon-purple: #bf00ff;
  --color-skill-locked: #4a5568;
  --color-skill-unlocked: #48bb78;
}
```

---

## 8. Deployment

**Vercel**

Why Vercel:
- Native Next.js support (they built it)
- Edge Functions for AI routes
- One-click Neon/Upstash integrations
- Preview deployments per PR
- Analytics included

---

## 9. Package Manager

**pnpm**

Why pnpm:
- 2-3x faster than npm
- Disk-efficient (hard links)
- Strict dependency resolution
- Workspace support for monorepo future

---

## 10. Type Validation

**Zod**

For API request/response validation and AI output parsing:
```ts
import { z } from 'zod';

export const SkillNodeSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  level: z.number().min(1).max(10),
});

export const CareerResponseSchema = z.object({
  canonicalKey: z.string(),
  title: z.string(),
  description: z.string(),
  skills: z.array(SkillNodeSchema),
});
```

---

## Complete Stack Summary

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js | 15.x |
| Runtime | Node.js | 20.x |
| Database | Neon | Serverless |
| ORM | Drizzle | 0.36.x |
| Cache | Upstash Redis | HTTP |
| AI | OpenAI API | gpt-4o |
| Visualization | React Flow | @xyflow/react 12.x |
| Styling | Tailwind CSS | 4.x |
| Validation | Zod | 3.x |
| Deployment | Vercel | Edge |
| Package Manager | pnpm | 9.x |

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@ep-xxx.region.neon.tech/career_builder?sslmode=require

# Cache
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# AI
OPENAI_API_KEY=sk-xxx

# App
NEXT_PUBLIC_APP_URL=https://yourapp.vercel.app
```

---

## Project Structure

```
career-builder/
├── app/
│   ├── (marketing)/
│   │   └── page.tsx
│   ├── career/
│   │   └── [careerId]/
│   │       └── page.tsx
│   ├── api/
│   │   ├── career/
│   │   │   ├── search/route.ts
│   │   │   └── [careerId]/route.ts
│   │   └── ai/
│   │       └── generate/route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── skill-graph/
│   │   ├── SkillGraph.tsx        # Main React Flow wrapper
│   │   ├── SkillNode.tsx         # Custom node with glow/progress
│   │   ├── SkillEdge.tsx         # Custom animated edge
│   │   └── use-skill-layout.ts   # Dagre layout hook
│   └── ui/
│       ├── GlassPanel.tsx
│       └── XPProgressRing.tsx
├── lib/
│   ├── db/
│   │   ├── index.ts
│   │   └── schema.ts
│   ├── cache.ts
│   ├── ai.ts
│   └── normalize-career.ts
├── drizzle.config.ts
├── tailwind.config.ts
├── package.json
└── .env.local
```

---

## Installation Commands

```bash
# Create project
pnpm create next-app@latest career-builder --typescript --tailwind --app --src-dir=false

cd career-builder

# Install dependencies
pnpm add drizzle-orm @neondatabase/serverless
pnpm add -D drizzle-kit

pnpm add @upstash/redis

pnpm add openai

pnpm add @xyflow/react dagre
pnpm add -D @types/dagre

pnpm add zod
```

---

This is your stack. No decisions left to make. Build it.
