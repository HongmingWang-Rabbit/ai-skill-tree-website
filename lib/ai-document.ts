import OpenAI from 'openai';
import { z } from 'zod';
import { SkillNodeSchema, SkillEdgeSchema, type SkillNode, type SkillEdge } from './schemas';
import { type Locale } from '@/i18n/routing';
import { type ParsedDocument, truncateForAI } from './document-parser';
import { AI_CHAT_CONFIG, DOCUMENT_IMPORT_CONFIG } from './constants';

const { aiExtraction } = DOCUMENT_IMPORT_CONFIG;

const openai = new OpenAI();

export interface DocumentImportResult {
  nodes: SkillNode[];
  edges: SkillEdge[];
  suggestedTitle: string;
  confidence: number; // 0-1 indicating how confident the extraction is
}

// Schema for AI response validation
const DocumentExtractionResponseSchema = z.object({
  suggestedTitle: z.string(),
  confidence: z.number().min(0).max(1),
  skills: z.array(SkillNodeSchema),
  edges: z.array(SkillEdgeSchema),
});

const LOCALE_INSTRUCTIONS: Record<Locale, string> = {
  en: 'Generate all skill names, descriptions, and categories in English.',
  zh: 'Generate all skill names, descriptions, and categories in Simplified Chinese (简体中文).',
  ja: 'Generate all skill names, descriptions, and categories in Japanese (日本語).',
};

const LOCALE_LANGUAGE_NAMES: Record<Locale, string> = {
  en: 'English',
  zh: 'Chinese',
  ja: 'Japanese',
};

/**
 * Extract skills from a parsed document using AI
 */
export async function extractSkillsFromDocument(
  document: ParsedDocument,
  locale: Locale = 'en',
  existingContext?: { nodes: SkillNode[]; edges: SkillEdge[] }
): Promise<DocumentImportResult> {
  const contextInfo = existingContext
    ? `\n\nThe user already has an existing skill map with these skills:\n${existingContext.nodes.slice(0, aiExtraction.existingSkillsLimit).map(n => `- ${n.name} (${n.category}, Level ${n.level})`).join('\n')}\n\nIdentify NEW skills from the document that complement or enhance the existing map. Avoid duplicating skills that already exist.`
    : '';

  const systemPrompt = `You are an expert career analyst and skill extractor. Analyze documents (resumes, portfolios, project descriptions, professional profiles, certificates, screenshots) to identify skills and create a skill tree.

${LOCALE_INSTRUCTIONS[locale]}

IMPORTANT: These are skills the user ALREADY HAS (from their resume/portfolio). All skills should be marked as learned with progress: ${aiExtraction.importedSkillProgress}.

Guidelines for skill extraction:
1. Identify both technical skills and soft skills mentioned or implied
2. Infer skill levels based on context (experience, achievements, certifications)
3. Create logical prerequisite relationships between skills
4. Group skills into meaningful categories
5. Use appropriate emoji icons for each skill
6. Generate IDs in lowercase-hyphenated-english format
7. Assign levels 1-10 based on apparent proficiency:
   - 1-3: Mentioned/basic familiarity
   - 4-6: Working knowledge/experience
   - 7-9: Strong expertise/significant achievements
   - 10: Expert/thought leader

Return valid JSON only.`;

  const jsonStructure = `{
  "suggestedTitle": "Suggested career/profile title based on the document",
  "confidence": 0.0-1.0 (how confident you are in the extraction),
  "skills": [
    {
      "id": "unique-skill-id-in-english",
      "name": "Skill Name in ${LOCALE_LANGUAGE_NAMES[locale]}",
      "description": "Brief description in ${LOCALE_LANGUAGE_NAMES[locale]}",
      "icon": "emoji",
      "level": 1-10,
      "category": "Category Name in ${LOCALE_LANGUAGE_NAMES[locale]}",
      "progress": ${aiExtraction.importedSkillProgress},
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
}`;

  // Handle image documents with vision
  if (document.imageData) {
    const userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
      {
        type: 'text',
        text: `Analyze this image (resume, certificate, portfolio screenshot, or professional profile) and extract a skill tree.
${document.metadata.title ? `Image title: ${document.metadata.title}` : ''}
${contextInfo}

Return a JSON object with this exact structure:
${jsonStructure}

Generate ${aiExtraction.minSkills}-${aiExtraction.maxSkills} skills based on what you can see in the image. If the image has minimal content or is unclear, generate fewer skills but set a lower confidence score.`,
      },
      {
        type: 'image_url',
        image_url: {
          url: `data:${document.imageData.mimeType};base64,${document.imageData.base64}`,
          detail: 'high',
        },
      },
    ];

    const response = await openai.chat.completions.create({
      model: aiExtraction.visionModel,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: aiExtraction.temperature,
      max_tokens: aiExtraction.maxTokens,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content in AI response');
    }

    const parsed = JSON.parse(content);
    const validated = DocumentExtractionResponseSchema.parse(parsed);

    return {
      nodes: validated.skills,
      edges: validated.edges,
      suggestedTitle: validated.suggestedTitle,
      confidence: validated.confidence,
    };
  }

  // Handle text-based documents
  const truncatedContent = truncateForAI(document.content, aiExtraction.maxInputTokens);

  const userPrompt = `Analyze this document and extract a skill tree:

Document Type: ${document.metadata.type}
${document.metadata.title ? `Title: ${document.metadata.title}` : ''}
${document.metadata.sourceUrl ? `Source: ${document.metadata.sourceUrl}` : ''}

Content:
${truncatedContent}
${contextInfo}

Return a JSON object with this exact structure:
${jsonStructure}

Generate ${aiExtraction.minSkills}-${aiExtraction.maxSkills} skills based on what's found in the document. If the document has minimal content, generate fewer skills but set a lower confidence score.`;

  const response = await openai.chat.completions.create({
    model: aiExtraction.textModel,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: aiExtraction.temperature,
    max_tokens: aiExtraction.maxTokens,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('No content in AI response');
  }

  const parsed = JSON.parse(content);
  const validated = DocumentExtractionResponseSchema.parse(parsed);

  return {
    nodes: validated.skills,
    edges: validated.edges,
    suggestedTitle: validated.suggestedTitle,
    confidence: validated.confidence,
  };
}

/**
 * Merge extracted skills with existing skill map intelligently
 */
export async function mergeExtractedWithExisting(
  existingNodes: SkillNode[],
  existingEdges: SkillEdge[],
  extractedNodes: SkillNode[],
  extractedEdges: SkillEdge[],
  locale: Locale = 'en'
): Promise<{ nodes: SkillNode[]; edges: SkillEdge[] }> {
  // If no existing nodes, just return extracted
  if (existingNodes.length === 0) {
    return { nodes: extractedNodes, edges: extractedEdges };
  }

  // If no extracted nodes, return existing
  if (extractedNodes.length === 0) {
    return { nodes: existingNodes, edges: existingEdges };
  }

  const systemPrompt = `You are an expert at merging skill trees. Given an existing skill map and newly extracted skills, intelligently merge them.

${LOCALE_INSTRUCTIONS[locale]}

Merge rules:
1. Keep all existing skills (preserve user's progress)
2. Add new skills that complement the existing ones
3. Update edges to create logical connections between old and new skills
4. Deduplicate similar skills (keep the more detailed version)
5. Maintain consistent skill IDs (lowercase-hyphenated-english)
6. Ensure prerequisite relationships make sense

Return valid JSON only.`;

  const userPrompt = `Merge these skill trees:

EXISTING SKILLS:
${JSON.stringify(existingNodes.slice(0, aiExtraction.mergeSkillsLimit), null, 2)}

EXISTING EDGES:
${JSON.stringify(existingEdges.slice(0, aiExtraction.mergeEdgesLimit), null, 2)}

NEW SKILLS TO ADD:
${JSON.stringify(extractedNodes, null, 2)}

NEW EDGES:
${JSON.stringify(extractedEdges, null, 2)}

Return a merged JSON object:
{
  "skills": [...merged skills...],
  "edges": [...merged edges...]
}`;

  const response = await openai.chat.completions.create({
    model: AI_CHAT_CONFIG.model,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: aiExtraction.mergeTemperature,
    max_tokens: AI_CHAT_CONFIG.maxTokensMerge,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('No content in AI response');
  }

  const parsed = JSON.parse(content);

  // Validate arrays
  const nodes = z.array(SkillNodeSchema).parse(parsed.skills || []);
  const edges = z.array(SkillEdgeSchema).parse(parsed.edges || []);

  return { nodes, edges };
}

/**
 * Generate a summary of what was extracted from a document
 */
export function generateExtractionSummary(
  result: DocumentImportResult,
  locale: Locale = 'en'
): string[] {
  const summaries: string[] = [];

  const skillCount = result.nodes.length;
  const categories = [...new Set(result.nodes.map(n => n.category))];

  // Localized summary messages
  const messages: Record<Locale, {
    skillsFound: (count: number) => string;
    categories: (cats: string[]) => string;
    confidence: (level: string) => string;
    suggestedTitle: (title: string) => string;
  }> = {
    en: {
      skillsFound: (count) => `Found ${count} skill${count !== 1 ? 's' : ''}`,
      categories: (cats) => `Categories: ${cats.join(', ')}`,
      confidence: (level) => `Extraction confidence: ${level}`,
      suggestedTitle: (title) => `Suggested title: ${title}`,
    },
    zh: {
      skillsFound: (count) => `发现 ${count} 个技能`,
      categories: (cats) => `分类：${cats.join('、')}`,
      confidence: (level) => `提取置信度：${level}`,
      suggestedTitle: (title) => `建议标题：${title}`,
    },
    ja: {
      skillsFound: (count) => `${count}個のスキルを発見`,
      categories: (cats) => `カテゴリー：${cats.join('、')}`,
      confidence: (level) => `抽出信頼度：${level}`,
      suggestedTitle: (title) => `推奨タイトル：${title}`,
    },
  };

  const msg = messages[locale];

  summaries.push(msg.skillsFound(skillCount));

  if (categories.length > 0) {
    summaries.push(msg.categories(categories.slice(0, DOCUMENT_IMPORT_CONFIG.preview.maxDisplayedCategories)));
  }

  // Confidence level
  const { confidenceThresholds } = DOCUMENT_IMPORT_CONFIG.preview;
  const confidenceLevel = result.confidence >= confidenceThresholds.high
    ? (locale === 'en' ? 'High' : locale === 'zh' ? '高' : '高い')
    : result.confidence >= confidenceThresholds.medium
    ? (locale === 'en' ? 'Medium' : locale === 'zh' ? '中' : '中程度')
    : (locale === 'en' ? 'Low' : locale === 'zh' ? '低' : '低い');

  summaries.push(msg.confidence(confidenceLevel));

  if (result.suggestedTitle) {
    summaries.push(msg.suggestedTitle(result.suggestedTitle));
  }

  return summaries;
}
