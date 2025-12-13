import OpenAI from 'openai';
import { z } from 'zod';
import { SkillNodeSchema, SkillEdgeSchema, type SkillNode, type SkillEdge } from './schemas';
import { type Locale } from '@/i18n/routing';
import { AI_CHAT_CONFIG } from './constants';

// Lazy-load OpenAI instance to avoid initialization on client-side imports
let openaiInstance: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    openaiInstance = new OpenAI();
  }
  return openaiInstance;
}

// Schema for chat modification response
export const ChatModificationSchema = z.object({
  message: z.string(),
  modifications: z.object({
    addNodes: z.array(SkillNodeSchema).default([]),
    updateNodes: z.array(z.object({
      id: z.string(),
      updates: z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        icon: z.string().optional(),
        level: z.number().min(1).max(10).optional(),
        category: z.string().optional(),
        prerequisites: z.array(z.string()).optional(),
      }),
    })).default([]),
    removeNodes: z.array(z.string()).default([]),
    addEdges: z.array(SkillEdgeSchema).default([]),
    removeEdges: z.array(z.string()).default([]),
  }).optional(),
  isOffTopic: z.boolean().default(false),
});

export type ChatModification = z.infer<typeof ChatModificationSchema>;

export interface ChatContext {
  careerTitle: string;
  careerDescription: string;
  currentNodes: SkillNode[];
  currentEdges: SkillEdge[];
  userMaps?: { id: string; title: string; careerTitle: string }[];
  locale: Locale;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  modifications?: ChatModification['modifications'];
  isOffTopic?: boolean;
}

// Exported for reuse in API route
export const LOCALE_INSTRUCTIONS: Record<Locale, string> = {
  en: 'Respond in English. Generate all skill names, descriptions, and categories in English.',
  zh: 'Respond in Simplified Chinese (简体中文). Generate all skill names, descriptions, and categories in Chinese.',
  ja: 'Respond in Japanese (日本語). Generate all skill names, descriptions, and categories in Japanese.',
};

// Exported for reuse in API route
export const SCOPE_GUARD_PROMPT = `You are an AI assistant for Personal Skill Map, a career skill visualization platform.

IMPORTANT SCOPE RULES:
- You ONLY help with skill map related tasks: adding/removing/modifying skills, suggesting learning paths, merging maps, and career-related questions.
- If the user asks about anything unrelated to skills, careers, learning, or the platform, politely decline and redirect them to skill-related topics.
- Set "isOffTopic": true for off-topic requests.

Examples of IN-SCOPE requests:
- "Add more React skills"
- "What should I learn next?"
- "Merge this with my backend map"
- "Add trending technologies for 2025"
- "Remove the deprecated skills"
- "What skills are missing for a senior role?"

Examples of OUT-OF-SCOPE requests (decline these):
- "Write me a poem"
- "What's the weather?"
- "Help me with my math homework"
- "Tell me a joke"
`;

const getSystemPrompt = (context: ChatContext) => `${SCOPE_GUARD_PROMPT}

${LOCALE_INSTRUCTIONS[context.locale]}

You are helping a user modify their skill map for: "${context.careerTitle}"
Career description: ${context.careerDescription}

Current skills in the map (${context.currentNodes.length} total):
${context.currentNodes.map(n => `- ${n.name} (${n.category}, Level ${n.level}): ${n.description}`).join('\n')}

${context.userMaps && context.userMaps.length > 0 ? `
User's other skill maps (available for merging):
${context.userMaps.map(m => `- "${m.title}" (${m.careerTitle})`).join('\n')}
` : ''}

When modifying the skill map:
1. Generate unique IDs for new skills (use lowercase-hyphenated format, e.g., "react-testing-library")
2. Set appropriate levels (1-3: beginner, 4-6: intermediate, 7-10: advanced)
3. Define prerequisites based on logical learning order
4. Use relevant emoji icons
5. Create edges for all prerequisite relationships
6. Ensure new skills integrate well with existing ones

Return valid JSON with this structure:
{
  "message": "Your conversational response explaining what you did or why you can't help",
  "modifications": {
    "addNodes": [{ skill objects }],
    "updateNodes": [{ "id": "skill-id", "updates": { partial skill updates } }],
    "removeNodes": ["skill-id-to-remove"],
    "addEdges": [{ edge objects }],
    "removeEdges": ["edge-id-to-remove"]
  },
  "isOffTopic": false
}

If no modifications are needed (just answering a question), omit the "modifications" field or set all arrays to empty.
If the request is off-topic, set "isOffTopic": true and politely decline in the message.`;

/**
 * Process a chat message and generate skill map modifications
 */
export async function processChatMessage(
  message: string,
  context: ChatContext,
  chatHistory: ChatMessage[] = []
): Promise<ChatModification> {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: getSystemPrompt(context) },
    // Include recent chat history for context
    ...chatHistory.slice(-AI_CHAT_CONFIG.chatHistoryLimit).map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user', content: message },
  ];

  const response = await getOpenAI().chat.completions.create({
    model: AI_CHAT_CONFIG.model,
    response_format: { type: 'json_object' },
    messages,
    temperature: AI_CHAT_CONFIG.temperature,
    max_tokens: AI_CHAT_CONFIG.maxTokens,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('No content in AI response');
  }

  const parsed = JSON.parse(content);

  // Validate with Zod
  const validated = ChatModificationSchema.parse(parsed);

  return validated;
}

/**
 * Generate a summary of modifications for the preview modal
 */
export function generateModificationSummary(
  modifications: ChatModification['modifications'],
  locale: Locale
): string[] {
  if (!modifications) return [];

  const summaries: string[] = [];

  if (modifications.addNodes.length > 0) {
    const skillNames = modifications.addNodes.map(n => n.name).join(', ');
    summaries.push(
      locale === 'zh'
        ? `添加 ${modifications.addNodes.length} 个新技能: ${skillNames}`
        : locale === 'ja'
        ? `${modifications.addNodes.length} 個の新しいスキルを追加: ${skillNames}`
        : `Add ${modifications.addNodes.length} new skill${modifications.addNodes.length > 1 ? 's' : ''}: ${skillNames}`
    );
  }

  if (modifications.updateNodes.length > 0) {
    summaries.push(
      locale === 'zh'
        ? `更新 ${modifications.updateNodes.length} 个技能`
        : locale === 'ja'
        ? `${modifications.updateNodes.length} 個のスキルを更新`
        : `Update ${modifications.updateNodes.length} skill${modifications.updateNodes.length > 1 ? 's' : ''}`
    );
  }

  if (modifications.removeNodes.length > 0) {
    summaries.push(
      locale === 'zh'
        ? `移除 ${modifications.removeNodes.length} 个技能`
        : locale === 'ja'
        ? `${modifications.removeNodes.length} 個のスキルを削除`
        : `Remove ${modifications.removeNodes.length} skill${modifications.removeNodes.length > 1 ? 's' : ''}`
    );
  }

  if (modifications.addEdges.length > 0) {
    summaries.push(
      locale === 'zh'
        ? `添加 ${modifications.addEdges.length} 个新连接`
        : locale === 'ja'
        ? `${modifications.addEdges.length} 個の新しい接続を追加`
        : `Add ${modifications.addEdges.length} new connection${modifications.addEdges.length > 1 ? 's' : ''}`
    );
  }

  if (modifications.removeEdges.length > 0) {
    summaries.push(
      locale === 'zh'
        ? `移除 ${modifications.removeEdges.length} 个连接`
        : locale === 'ja'
        ? `${modifications.removeEdges.length} 個の接続を削除`
        : `Remove ${modifications.removeEdges.length} connection${modifications.removeEdges.length > 1 ? 's' : ''}`
    );
  }

  return summaries;
}

/**
 * Apply modifications to nodes and edges
 */
export function applyModifications(
  currentNodes: SkillNode[],
  currentEdges: SkillEdge[],
  modifications: ChatModification['modifications']
): { nodes: SkillNode[]; edges: SkillEdge[] } {
  if (!modifications) {
    return { nodes: currentNodes, edges: currentEdges };
  }

  let nodes = [...currentNodes];
  let edges = [...currentEdges];

  // Remove nodes
  if (modifications.removeNodes.length > 0) {
    const removeSet = new Set(modifications.removeNodes);
    nodes = nodes.filter(n => !removeSet.has(n.id));
    // Also remove edges connected to removed nodes
    edges = edges.filter(e => !removeSet.has(e.source) && !removeSet.has(e.target));
  }

  // Update nodes
  for (const update of modifications.updateNodes) {
    const index = nodes.findIndex(n => n.id === update.id);
    if (index !== -1) {
      nodes[index] = { ...nodes[index], ...update.updates };
    }
  }

  // Add new nodes
  nodes = [...nodes, ...modifications.addNodes];

  // Remove edges
  if (modifications.removeEdges.length > 0) {
    const removeSet = new Set(modifications.removeEdges);
    edges = edges.filter(e => !removeSet.has(e.id));
  }

  // Add new edges
  edges = [...edges, ...modifications.addEdges];

  return { nodes, edges };
}

/**
 * Generate a smart merge of two skill maps
 */
export async function generateSmartMerge(
  sourceNodes: SkillNode[],
  sourceEdges: SkillEdge[],
  sourceCareerTitle: string,
  targetNodes: SkillNode[],
  targetEdges: SkillEdge[],
  targetCareerTitle: string,
  locale: Locale
): Promise<{ nodes: SkillNode[]; edges: SkillEdge[]; mergedTitle: string }> {
  const prompt = `Merge these two skill maps into a unified skill tree:

MAP 1: "${sourceCareerTitle}"
Skills: ${sourceNodes.map(n => `${n.id}: ${n.name} (${n.category}, L${n.level}, icon: ${n.icon})`).join(', ')}

MAP 2: "${targetCareerTitle}"
Skills: ${targetNodes.map(n => `${n.id}: ${n.name} (${n.category}, L${n.level}, icon: ${n.icon})`).join(', ')}

Rules for merging:
1. Combine similar/duplicate skills (keep the higher level version, preserve the original id)
2. Create a logical prerequisite structure connecting both skill sets
3. Suggest a new title for the merged career path
4. Organize skills into unified categories
5. Ensure the merged tree makes sense as a coherent career path
6. Generate unique lowercase-hyphenated IDs for any NEW skills (e.g., "react-testing-library")
7. Use relevant emoji icons for each skill

${LOCALE_INSTRUCTIONS[locale]}

Return JSON with this EXACT structure:
{
  "mergedTitle": "Title for the merged career",
  "skills": [
    {
      "id": "skill-id",
      "name": "Skill Name",
      "description": "Brief description of the skill",
      "icon": "🎯",
      "level": 5,
      "category": "Category Name",
      "prerequisites": ["prerequisite-skill-id"]
    }
  ],
  "edges": [
    {
      "id": "edge-source-to-target",
      "source": "source-skill-id",
      "target": "target-skill-id"
    }
  ]
}

IMPORTANT: Every skill MUST have id, name, description, icon (emoji), level (1-10), category, and prerequisites (array). Every edge MUST have id, source, and target.`;

  const response = await getOpenAI().chat.completions.create({
    model: AI_CHAT_CONFIG.model,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are an expert at organizing skills and creating logical learning paths. ${LOCALE_INSTRUCTIONS[locale]}`,
      },
      { role: 'user', content: prompt },
    ],
    temperature: AI_CHAT_CONFIG.temperature,
    max_tokens: AI_CHAT_CONFIG.maxTokensMerge,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('No content in AI response');
  }

  const parsed = JSON.parse(content);

  // Validate skills and edges
  const validatedSkills = z.array(SkillNodeSchema).parse(parsed.skills || []);
  const validatedEdges = z.array(SkillEdgeSchema).parse(parsed.edges || []);

  return {
    nodes: validatedSkills,
    edges: validatedEdges,
    mergedTitle: parsed.mergedTitle || `${sourceCareerTitle} + ${targetCareerTitle}`,
  };
}
