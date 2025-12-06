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
    model: 'gpt-4o',
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
    model: 'gpt-4o',
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
