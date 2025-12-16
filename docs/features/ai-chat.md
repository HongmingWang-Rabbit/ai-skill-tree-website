# AI Chat Feature

The career page includes an AI-powered chat panel for modifying skill maps via natural language.

## Components

- `AIChatPanel` - Floating collapsible chat panel (bottom-right corner)
- `ChatMessage` - Individual message display with modification badges
- `ChatInput` - Text input with auto-resize and send button
- `ModificationPreview` - Modal showing changes before applying
- `MergeMapModal` - UI for merging two skill maps

## Data Flow

1. User sends message → `POST /api/ai/chat` with skill map context
2. API performs Tavily web search if trending tech keywords detected
3. OpenAI generates JSON response with message and modifications
4. Streaming response updates UI in real-time
5. If modifications present, shows preview modal for confirmation
6. User confirms → changes applied to skill graph
7. Undo button restores previous state (single-level undo)

## Merge Flow

1. User clicks merge → `MergeMapModal` fetches user's other maps (similar maps highlighted)
2. User selects map to merge → `POST /api/ai/merge` with both maps
3. AI generates intelligent merge combining both skill sets
4. Preview shows merged result → user confirms to apply
5. Merged data saved to `customNodes`/`customEdges`, source map deleted

## Configuration

`AI_CHAT_CONFIG` in `lib/constants.ts`:
- `model`: OpenAI model (default: 'gpt-4o-mini')
- `maxTokens`: Token limit for responses
- `temperature`: Response randomness
- `chatHistoryLimit`: Messages to include in context

## Web Search Integration

- Uses Tavily API for searching trending technologies
- Configured via `TAVILY_API_KEY` environment variable (optional)
- Auto-triggered when user mentions "trending", "latest", "2024/2025", etc.

## Scope Guard

AI is restricted to skill map related tasks only. Off-topic requests are declined gracefully with `isOffTopic: true` in response.

## Key Files

- `lib/ai-chat.ts` - Chat utilities: `processChatMessage()`, `generateModificationSummary()`, `applyModifications()`, `generateSmartMerge()`
- Types: `ChatModification`, `ChatContext`, `ChatMessage`
