import OpenAI from 'openai';
import { z } from 'zod';
import { SkillNodeSchema, SkillEdgeSchema, CareerResponseSchema } from './schemas';
import { type Locale } from '@/i18n/routing';
import { SKILL_EXPAND_CONFIG, LOCALE_NAMES } from './constants';

const openai = new OpenAI();

export interface GeneratedCareer {
  canonicalKey: string;
  title: string;
  description: string;
  skills: z.infer<typeof SkillNodeSchema>[];
  edges: z.infer<typeof SkillEdgeSchema>[];
}

// Re-export Locale type for backward compatibility
export type SupportedLocale = Locale;

const LOCALE_INSTRUCTIONS: Record<Locale, string> = {
  en: 'Generate all content in English.',
  zh: 'Generate all content in Simplified Chinese (简体中文). All skill names, descriptions, categories, and the career title/description must be in Chinese.',
  ja: 'Generate all content in Japanese (日本語). All skill names, descriptions, categories, and the career title/description must be in Japanese.',
  es: 'Generate all content in Spanish (Español). All skill names, descriptions, categories, and the career title/description must be in Spanish.',
  'pt-BR': 'Generate all content in Brazilian Portuguese (Português Brasileiro). All skill names, descriptions, categories, and the career title/description must be in Portuguese.',
  de: 'Generate all content in German (Deutsch). All skill names, descriptions, categories, and the career title/description must be in German.',
  fr: 'Generate all content in French (Français). All skill names, descriptions, categories, and the career title/description must be in French.',
  it: 'Generate all content in Italian (Italiano). All skill names, descriptions, categories, and the career title/description must be in Italian.',
  nl: 'Generate all content in Dutch (Nederlands). All skill names, descriptions, categories, and the career title/description must be in Dutch.',
  pl: 'Generate all content in Polish (Polski). All skill names, descriptions, categories, and the career title/description must be in Polish.',
};

// Using LOCALE_NAMES from constants.ts for language names

const getSystemPrompt = (locale: Locale) => `You are an expert career advisor and skill tree designer. Generate comprehensive skill trees for careers that resemble video game skill trees.

${LOCALE_INSTRUCTIONS[locale]}

When generating a skill tree:
1. Create a hierarchical structure with foundational skills at the top
2. Group skills into categories (e.g., Technical, Soft Skills, Tools, Domain Knowledge)
3. Include prerequisites - skills should build upon each other logically
4. Assign levels 1-10 based on complexity (1 = beginner, 10 = expert)
5. Use appropriate emoji icons for each skill
6. Create meaningful connections between related skills

Return valid JSON only with the exact structure requested.`;

export async function generateCareerSkillTree(careerQuery: string, locale: Locale = 'en'): Promise<GeneratedCareer> {
  const languageInstruction = locale !== 'en'
    ? `\n\nIMPORTANT: Generate ALL text content (title, description, skill names, skill descriptions, category names) in ${LOCALE_NAMES[locale]}. The canonicalKey should remain in lowercase English with hyphens.`
    : '';

  const prompt = `Generate a complete skill tree for the career: "${careerQuery}"${languageInstruction}

Return a JSON object with this exact structure:
{
  "canonicalKey": "lowercase-hyphenated-career-name-in-english",
  "title": "Human Readable Career Title",
  "description": "A brief 1-2 sentence description of this career path",
  "skills": [
    {
      "id": "unique-skill-id-in-english",
      "name": "Skill Name",
      "description": "Brief description of this skill",
      "icon": "emoji",
      "level": 1-10,
      "category": "Category Name",
      "progress": 0,
      "prerequisites": ["prerequisite-skill-id"] or []
    }
  ],
  "edges": [
    {
      "id": "edge-id",
      "source": "source-skill-id",
      "target": "target-skill-id",
      "animated": true
    }
  ]
}

Generate at least 15-20 skills organized into a logical skill tree. Skills at the top should have no prerequisites (entry level), and more advanced skills should list their prerequisites.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: getSystemPrompt(locale) },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 4000,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('No content in AI response');
  }

  const parsed = JSON.parse(content);

  // Validate with Zod
  const validated = CareerResponseSchema.parse(parsed);

  return validated;
}

export interface TestQuestion {
  id: string;
  question: string;
  expectedConcepts: string[];
}

export interface GradingResult {
  questionId: string;
  score: number;
  feedback: string;
}

export interface GradingResponse {
  results: GradingResult[];
  totalScore: number;
}

export async function generateSkillTestQuestions(
  skillName: string,
  skillDescription: string,
  skillLevel: number,
  category: string,
  careerTitle: string
): Promise<TestQuestion[]> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are an expert educator creating assessment questions for professional skills. Create thoughtful, open-ended questions that test real understanding, not memorization.

Questions should:
- Be appropriate for the skill level (1-3: beginner, 4-6: intermediate, 7-10: advanced)
- Test practical application and understanding
- Require explanation or reasoning in answers
- Be answerable in 2-4 sentences

Return valid JSON only.`
      },
      {
        role: 'user',
        content: `Generate 3 test questions for this skill:

Skill: ${skillName}
Description: ${skillDescription}
Level: ${skillLevel}/10
Category: ${category}
Career Context: ${careerTitle}

Return JSON:
{
  "questions": [
    {
      "id": "q1",
      "question": "The question text",
      "expectedConcepts": ["concept1", "concept2"]
    }
  ]
}`
      }
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('No content in AI response');
  }

  const parsed = JSON.parse(content);
  return parsed.questions || [];
}

export async function gradeSkillTestAnswers(
  skillName: string,
  skillDescription: string,
  questions: Array<{
    id: string;
    question: string;
    expectedConcepts: string[];
    answer: string;
  }>
): Promise<GradingResponse> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are an expert educator grading skill assessment answers. Be fair but rigorous in your evaluation.

Grading criteria:
- Score 0-100 for each answer
- Consider accuracy, completeness, and understanding demonstrated
- Provide constructive feedback
- Empty or nonsense answers get 0

Return valid JSON only.`
      },
      {
        role: 'user',
        content: `Grade these answers for the skill "${skillName}" (${skillDescription}):

${questions.map((q, i) => `
Question ${i + 1}: ${q.question}
Expected concepts: ${q.expectedConcepts.join(', ')}
Student answer: ${q.answer || '(no answer provided)'}
`).join('\n')}

Return JSON:
{
  "results": [
    {
      "questionId": "q1",
      "score": 0-100,
      "feedback": "Constructive feedback"
    }
  ],
  "totalScore": average_of_all_scores
}`
      }
    ],
    temperature: 0.3,
    max_tokens: 1000,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('No content in AI response');
  }

  const parsed = JSON.parse(content);

  // Ensure results match question IDs
  const results = questions.map((q) => {
    const result = parsed.results?.find((r: GradingResult) => r.questionId === q.id);
    return result || { questionId: q.id, score: 0, feedback: 'Unable to grade' };
  });

  // Calculate total score if not provided
  const totalScore = parsed.totalScore ?? Math.round(
    results.reduce((sum: number, r: GradingResult) => sum + r.score, 0) / results.length
  );

  return { results, totalScore };
}

export async function suggestCareerSearches(query: string): Promise<string[]> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'You suggest career paths. Return JSON: {"suggestions": ["career1", "career2", ...]}'
      },
      {
        role: 'user',
        content: `Suggest 5 specific career paths related to: "${query}". Be specific (e.g., "Frontend Developer" not just "Developer")`
      }
    ],
    temperature: 0.7,
    max_tokens: 200,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    return [];
  }

  const parsed = JSON.parse(content);
  return parsed.suggestions || [];
}

// Career suggestion with description and icon
export interface CareerSuggestion {
  title: string;
  description: string;
  icon: string;
  canonicalKey: string;
}

// Query analysis result
export type QueryAnalysisResult =
  | { type: 'specific'; career: CareerSuggestion }
  | { type: 'suggestions'; suggestions: CareerSuggestion[] };

const LOCALE_ANALYZE_INSTRUCTIONS: Record<Locale, string> = {
  en: 'Respond in English.',
  zh: 'Respond in Simplified Chinese (简体中文). Career titles and descriptions must be in Chinese.',
  ja: 'Respond in Japanese (日本語). Career titles and descriptions must be in Japanese.',
  es: 'Respond in Spanish (Español). Career titles and descriptions must be in Spanish.',
  'pt-BR': 'Respond in Brazilian Portuguese (Português Brasileiro). Career titles and descriptions must be in Portuguese.',
  de: 'Respond in German (Deutsch). Career titles and descriptions must be in German.',
  fr: 'Respond in French (Français). Career titles and descriptions must be in French.',
  it: 'Respond in Italian (Italiano). Career titles and descriptions must be in Italian.',
  nl: 'Respond in Dutch (Nederlands). Career titles and descriptions must be in Dutch.',
  pl: 'Respond in Polish (Polski). Career titles and descriptions must be in Polish.',
};

/**
 * Analyzes a user query to determine if it's a specific career or needs suggestions.
 * - Specific career queries (e.g., "Software Engineer") → returns the career directly
 * - Vague/lifestyle queries (e.g., "I want to work alone") → returns career suggestions
 */
export async function analyzeCareerQuery(
  query: string,
  locale: Locale = 'en'
): Promise<QueryAnalysisResult> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You analyze career-related queries and determine the best response.

${LOCALE_ANALYZE_INSTRUCTIONS[locale]}

If the query is a SPECIFIC career name or job title (e.g., "Software Engineer", "Data Scientist", "UX Designer"):
- Return type "specific" with that career's details

If the query is VAGUE, describes a LIFESTYLE preference, or asks about career traits (e.g., "I want to work from home", "careers that don't require talking to people", "high paying jobs"):
- Return type "suggestions" with 4-6 relevant career suggestions

Return valid JSON only.`
      },
      {
        role: 'user',
        content: `Analyze this query: "${query}"

Return JSON in this format:

For SPECIFIC career queries:
{
  "type": "specific",
  "career": {
    "title": "Career Title",
    "description": "Brief 1 sentence description",
    "icon": "relevant emoji",
    "canonicalKey": "lowercase-hyphenated-english-key"
  }
}

For VAGUE/lifestyle queries:
{
  "type": "suggestions",
  "suggestions": [
    {
      "title": "Career Title",
      "description": "Why this matches their query",
      "icon": "relevant emoji",
      "canonicalKey": "lowercase-hyphenated-english-key"
    }
  ]
}`
      }
    ],
    temperature: 0.5,
    max_tokens: 800,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('No content in AI response');
  }

  const parsed = JSON.parse(content);

  if (parsed.type === 'specific' && parsed.career) {
    return {
      type: 'specific',
      career: parsed.career,
    };
  }

  return {
    type: 'suggestions',
    suggestions: parsed.suggestions || [],
  };
}

// Types for advanced skill generation
export interface AdvancedSkillsResult {
  nodes: z.infer<typeof SkillNodeSchema>[];
  edges: z.infer<typeof SkillEdgeSchema>[];
}

// Response schema for advanced skills
const AdvancedSkillsResponseSchema = z.object({
  skills: z.array(SkillNodeSchema),
  edges: z.array(SkillEdgeSchema),
});

/**
 * Generate advanced/next-stage skills for a completed skill tree.
 * Creates new skills at advanced levels that build upon existing high-level skills.
 */
export async function generateAdvancedSkills(
  existingNodes: z.infer<typeof SkillNodeSchema>[],
  existingEdges: z.infer<typeof SkillEdgeSchema>[],
  careerTitle: string,
  locale: Locale = 'en'
): Promise<AdvancedSkillsResult> {
  const {
    prerequisiteLevelThreshold,
    minSkillsToGenerate,
    maxSkillsToGenerate,
    advancedSkillMinLevel,
    advancedSkillMaxLevel,
    model,
    temperature,
    maxTokens,
  } = SKILL_EXPAND_CONFIG;

  // Identify high-level skills as potential prerequisites
  const highLevelSkills = existingNodes
    .filter(node => node.level >= prerequisiteLevelThreshold)
    .map(node => ({
      id: node.id,
      name: node.name,
      level: node.level,
      category: node.category,
    }));

  // Get all existing skill IDs to avoid duplicates
  const existingIds = new Set(existingNodes.map(n => n.id));

  // Get existing categories for consistency
  const existingCategories = [...new Set(existingNodes.map(n => n.category))];

  const languageInstruction = locale !== 'en'
    ? `\n\nIMPORTANT: Generate ALL text content (skill names, descriptions, category names) in ${LOCALE_NAMES[locale]}. The skill IDs should remain in lowercase English with hyphens.`
    : '';

  const skillRange = `${minSkillsToGenerate}-${maxSkillsToGenerate}`;
  const levelRange = `${advancedSkillMinLevel}-${advancedSkillMaxLevel}`;

  const prompt = `Generate ${skillRange} ADVANCED skills to expand this completed skill tree for "${careerTitle}".${languageInstruction}

EXISTING HIGH-LEVEL SKILLS (potential prerequisites for new skills):
${highLevelSkills.map(s => `- ${s.id}: "${s.name}" (Level ${s.level}, ${s.category})`).join('\n')}

EXISTING CATEGORIES: ${existingCategories.join(', ')}

EXISTING SKILL IDs (DO NOT duplicate these): ${[...existingIds].join(', ')}

Requirements for new skills:
1. Generate ${skillRange} NEW advanced skills at levels ${levelRange}
2. Each skill must have at least one prerequisite from the existing high-level skills listed above
3. Skills should represent cutting-edge, expert-level, or specialized topics in this field
4. Include emerging trends, technologies, or advanced specializations
5. Use unique IDs that don't conflict with existing ones (prefix with "adv-" if needed)
6. Use existing categories when appropriate, or create new advanced categories
7. Skills should provide meaningful progression beyond the current tree

Return JSON:
{
  "skills": [
    {
      "id": "unique-skill-id",
      "name": "Advanced Skill Name",
      "description": "Brief description",
      "icon": "emoji",
      "level": ${levelRange},
      "category": "Category Name",
      "progress": 0,
      "prerequisites": ["existing-skill-id"]
    }
  ],
  "edges": [
    {
      "id": "edge-id",
      "source": "prerequisite-skill-id",
      "target": "new-skill-id",
      "animated": true
    }
  ]
}`;

  const response = await openai.chat.completions.create({
    model,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are an expert career advisor generating advanced skill expansions for completed skill trees.

${LOCALE_INSTRUCTIONS[locale]}

Focus on:
- Cutting-edge technologies and methodologies
- Expert-level specializations
- Industry-recognized advanced certifications
- Leadership and architecture-level skills
- Emerging trends in the field

Return valid JSON only.`
      },
      { role: 'user', content: prompt }
    ],
    temperature,
    max_tokens: maxTokens,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('No content in AI response');
  }

  const parsed = JSON.parse(content);
  const validated = AdvancedSkillsResponseSchema.parse(parsed);

  // Filter out any skills with duplicate IDs (safety check)
  const newNodes = validated.skills.filter(skill => !existingIds.has(skill.id));
  const newNodeIds = new Set(newNodes.map(n => n.id));

  // Filter edges to only include valid ones (source exists in original, target is new)
  const validEdges = validated.edges.filter(edge =>
    (existingIds.has(edge.source) || newNodeIds.has(edge.source)) &&
    newNodeIds.has(edge.target)
  );

  return {
    nodes: newNodes,
    edges: validEdges,
  };
}

