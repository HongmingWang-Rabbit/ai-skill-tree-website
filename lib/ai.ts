import OpenAI from 'openai';
import { z } from 'zod';
import { SkillNodeSchema, SkillEdgeSchema, CareerResponseSchema } from './schemas';

const openai = new OpenAI();

export interface GeneratedCareer {
  canonicalKey: string;
  title: string;
  description: string;
  skills: z.infer<typeof SkillNodeSchema>[];
  edges: z.infer<typeof SkillEdgeSchema>[];
}

const SYSTEM_PROMPT = `You are an expert career advisor and skill tree designer. Generate comprehensive skill trees for careers that resemble video game skill trees.

When generating a skill tree:
1. Create a hierarchical structure with foundational skills at the top
2. Group skills into categories (e.g., Technical, Soft Skills, Tools, Domain Knowledge)
3. Include prerequisites - skills should build upon each other logically
4. Assign levels 1-10 based on complexity (1 = beginner, 10 = expert)
5. Use appropriate emoji icons for each skill
6. Create meaningful connections between related skills

Return valid JSON only with the exact structure requested.`;

export async function generateCareerSkillTree(careerQuery: string): Promise<GeneratedCareer> {
  const prompt = `Generate a complete skill tree for the career: "${careerQuery}"

Return a JSON object with this exact structure:
{
  "canonicalKey": "lowercase-hyphenated-career-name",
  "title": "Human Readable Career Title",
  "description": "A brief 1-2 sentence description of this career path",
  "skills": [
    {
      "id": "unique-skill-id",
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
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
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

export async function suggestCareerSearches(query: string): Promise<string[]> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
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
