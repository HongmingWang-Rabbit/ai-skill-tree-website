# Learning Resources Feature

Users can discover learning resources for any skill in their skill map.

## Entry Point

Click "Start Learning" button on any available skill in the skill graph.

## Data Flow

1. User clicks "Start Learning" → `LearningResourcesModal` opens
2. `GET /api/learning/resources?skillName=...` fetches resources
3. API queries `affiliatedLinks` table for pattern-matched links
4. API searches Tavily for web learning resources
5. Results displayed with affiliated links highlighted at top

## Components

- `LearningResourcesModal` - Modal with platform icons (in `components/learning/`)

## API Routes

- `GET /api/learning/resources`
  - Query params: `skillName` (required), `category`, `level`
  - Returns: `affiliatedLinks[]`, `webResults[]`, `totalCount`
- `GET/POST/PUT/DELETE /api/admin/affiliated-links` - CRUD (admin)

## Database Schema

```typescript
affiliatedLinks: {
  id: uuid,
  url: text,
  title: text,
  description: text,
  platform: text, // 'udemy', 'coursera', 'youtube', etc.
  imageUrl: text,
  skillPatterns: jsonb, // ["react", "frontend"]
  categoryPatterns: jsonb, // optional
  priority: integer, // higher = shown first
  isActive: boolean,
  clickCount: integer,
  createdAt: timestamp,
  updatedAt: timestamp,
}
```

## Affiliated Link Matching

Uses JSONB array pattern matching in PostgreSQL:
- `skillPatterns: ["react", "frontend"]` matches skills containing those strings
- Case-insensitive partial matching
- Results ordered by `priority` descending

## Configuration

`LEARNING_CONFIG` in `lib/constants.ts`:
- `platforms`: Domain groups for courses/video/docs/community
- `searchDepth`: 'advanced'
- `maxResults`: 10
- `levelThresholds`: `{ beginner: 3, intermediate: 6 }`
- `maxAffiliatedLinks`: 3 per skill
- `platformInfo`: Display info (name, icon, color) per platform
