# Master Skill Map (Dashboard)

The dashboard displays a "Skill Universe" visualization showing all user's careers and skills in a unified graph.

## Data Flow

1. User visits dashboard → `GET /api/user/master-map` fetches all career graphs
2. For each career, uses `customNodes` if present (from AI modifications or merging), otherwise falls back to base `skillGraph.nodes`
3. User progress from `nodeData` is overlaid on the skills
4. Data returned directly from database (no AI processing)
5. `MasterSkillGraph` component renders React Flow graph with radial layout

## Graph Structure

- **Center node**: User name with overall mastery percentage
- **Secondary nodes**: Each career path (clickable to navigate)
- **Tertiary nodes**: Skills from each career (color-coded by progress)

## Layout Configuration

`MASTER_GRAPH_CONFIG` in constants:
- `centerNodeSize`: 140px
- `careerRadius`: 250px from center
- `skillRadius`: 120px from career
- `maxDisplayedSkillsPerCareer`: 12 (for performance)
- `edgeColors`: mastered (green), inProgress (amber), notStarted (gray)

## Components

- `MasterSkillMap` - Container with stats header and graph
- `MasterSkillGraph` - React Flow visualization with custom node types
- `LazyMasterSkillGraph` - Dynamic import wrapper
- `MasterSkillGraphSkeleton` - Loading state
