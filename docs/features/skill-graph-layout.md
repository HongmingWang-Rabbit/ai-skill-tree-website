# Skill Graph Layout

The skill graph uses a radial layout algorithm with smart features.

## Layout Configuration

`LAYOUT_CONFIG` in `components/skill-graph/constants.ts`:

### Node Dimensions
- `NODE_WIDTH`: 160
- `NODE_HEIGHT`: 140

### Center Node Sizing (dynamic based on title)
- `CENTER_NODE_SIZE`: 200 (base)
- `CENTER_NODE_MAX_SIZE`: 300 (max)
- `CENTER_NODE_TITLE_THRESHOLD`: 20 chars before size increases
- `CENTER_NODE_GROWTH_FACTOR`: 3px per char over threshold
- `CENTER_NODE_GAP`: 50 between center and first ring

### Layout Positioning
- `RING_SPACING`: 280 between depth levels
- `MIN_RADIUS`: 350 base minimum for first ring
- `MAX_NODES_PER_RING`: 6 before creating sub-rings
- `SUB_RING_SPACING`: 180 between sub-rings
- `JITTER_AMOUNT`: 20 random jitter for organic look

## Dynamic Center Node

Title length affects sizing:
- Under 20 chars: 200px (base)
- Longer: grows at 3px/char (max 300px)
- Font size adapts: >40 chars = small, >25 chars = medium, else large

## Features

- Nodes in concentric rings around center career node
- Max 6 nodes/ring, overflow creates sub-rings
- Saved positions persist across sessions (`nodeData.position`)
- "Organize" button resets to calculated layout
- `preservePositions` respects saved positions on load
- Auto-organize on merge when new nodes added

## Position Persistence

1. User drags node → position saved via PATCH API
2. Page reload → uses `preservePositions: true`
3. Merge/AI adds nodes → auto-reorganizes layout
4. Click "Organize" → uses `preservePositions: false`

## SkillGraphHandle Ref

Methods exposed via `ref`:
- `getNodePositions()` - For screenshot capture
- `sortNodes()` - Trigger layout reorganization

## Key Files

- `components/skill-graph/constants.ts` - `LAYOUT_CONFIG`, `CENTER_NODE_ID`
- `components/skill-graph/radial-layout.ts` - `getRadialLayout()` with options
- `components/skill-graph/layout-utils.ts` - Edge handles, seeded random
- `components/skill-graph/CenterNode.tsx` - Dynamic center node component
