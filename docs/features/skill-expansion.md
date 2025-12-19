# Skill Tree Expansion Feature

When a user completes all skills in their career skill map (100% mastery), the system offers to expand the tree with AI-generated advanced skills.

## User Flow

1. User completes all skills in their map (progress >= 60% on every skill)
2. On page load, system detects completion and shows congratulatory modal
3. User can choose to expand or dismiss ("Maybe Later")
4. If expanding: AI generates 5-8 advanced skills at levels 7-10
5. New skills are merged into existing graph and saved
6. Undo available via AI chat panel's undo functionality

## Components

- `ConfirmModal` - Congratulatory popup with expand/later options
- Career page (`app/[locale]/career/[careerId]/page.tsx`) - Detection logic and handlers

## Data Flow

1. Career page detects all skills completed via `nodesWithProgress` check
2. Shows `ConfirmModal` with `graphComplete` translations
3. User confirms → `POST /api/ai/expand` with current nodes/edges
4. API calls `generateAdvancedSkills()` from `lib/ai.ts`
5. New skills returned, merged with existing, saved to `customNodes`/`customEdges`
6. Graph updates with new advanced skills

## API Endpoint

`POST /api/ai/expand`

**Request:**
```json
{
  "careerTitle": "Frontend Developer",
  "nodes": [...existing skill nodes],
  "edges": [...existing skill edges],
  "locale": "en"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "nodes": [...new advanced skill nodes],
    "edges": [...new edges connecting to existing skills]
  },
  "credits": { "balance": 95 }
}
```

## Configuration

`SKILL_EXPAND_CONFIG` in `lib/constants.ts`:
- `model`: OpenAI model (default: 'gpt-4o-mini')
- `temperature`: Response randomness (0.7)
- `maxTokens`: Token limit (2000)
- `minSkillsToGenerate`: Minimum skills to generate (5)
- `maxSkillsToGenerate`: Maximum skills to generate (8)
- `prerequisiteLevelThreshold`: Min level for prerequisite skills (5)
- `advancedSkillMinLevel`: Min level for new skills (7)
- `advancedSkillMaxLevel`: Max level for new skills (10)

## Credits

Uses `ai_chat` credit type (same as AI chat modifications).

## Translations

Located in `locales/{en,zh,ja}/career.json` under `graphComplete`:
- `title`: Congratulations message
- `message`: Expansion offer text
- `expand`: Confirm button text
- `later`: Dismiss button text
- `expanding`: Loading state text
- `expandSuccess`: Success message with skill count
- `expandFailed`: Error message

## Key Files

- `lib/ai.ts` - `generateAdvancedSkills()` function
- `lib/constants.ts` - `SKILL_EXPAND_CONFIG`
- `app/api/ai/expand/route.ts` - API endpoint
- `app/[locale]/career/[careerId]/page.tsx` - Detection and UI
