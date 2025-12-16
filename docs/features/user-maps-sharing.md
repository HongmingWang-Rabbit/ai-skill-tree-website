# User Maps & Sharing

User-owned skill maps with sharing capabilities.

## URL Routing

- `/career/{canonicalKey}` - Base career template (auto-forks for logged-in users)
- `/career/{uuid}` - User's own map (full edit access, auto-saves)
- `/career/{shareSlug}` - Shared map view (read-only for non-owners)

## Map Flow

1. Logged-in user visits base career → auto-creates personal map (fork) and redirects
2. User can customize title, track progress, reposition nodes (auto-saved)
3. User can make map public → generates 6-char share slug
4. Others can view public maps and copy to their account

## API Routes

- `GET /api/map/[mapId]` - Fetch by UUID or shareSlug (returns `customNodes`/`customEdges` if available)
- `PATCH /api/map/[mapId]` - Update (owner only):
  - `title`, `isPublic`, `nodeData` (progress/positions)
  - `customNodes`, `customEdges` (for merged/AI-modified graphs)
  - `deleteSourceMapId` (delete another map after merge)
- `DELETE /api/map/[mapId]` - Delete (owner only)
- `POST /api/map/fork` - Create map from career or another map
- `POST /api/map/[mapId]/copy` - Copy public map to own account

## Database Schema

`userCareerGraphs` table:
- `title` - Custom title
- `nodeData` - JSONB array of skill progress and positions
- `customNodes` - JSONB custom nodes (from merge/AI, overrides base)
- `customEdges` - JSONB custom edges (from merge/AI, overrides base)
- `isPublic` - Whether viewable by others
- `shareSlug` - 6-char alphanumeric slug
- `copiedFromId` - UUID of source if copied

## Custom Graph Data

When user merges maps or applies AI modifications, new nodes/edges stored in `customNodes`/`customEdges`. API returns custom data when available, falls back to base `skillGraphs` otherwise.
