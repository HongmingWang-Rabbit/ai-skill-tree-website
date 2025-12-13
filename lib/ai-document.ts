import OpenAI from 'openai';
import { z } from 'zod';
import { SkillNodeSchema, SkillEdgeSchema, type SkillNode, type SkillEdge, type WorkExperience } from './schemas';
import { type Locale } from '@/i18n/routing';
import { type ParsedDocument, truncateForAI } from './document-parser';
import { AI_CHAT_CONFIG, DOCUMENT_IMPORT_CONFIG, RESUME_CONFIG } from './constants';

const { aiExtraction } = DOCUMENT_IMPORT_CONFIG;

const openai = new OpenAI();

// Extracted work experience from document (similar to WorkExperience but with optional fields)
export interface ExtractedExperience {
  company: string;
  title: string;
  startDate: string; // YYYY-MM format
  endDate: string | null; // null = current position
  description: string;
  location?: string;
}

export interface DocumentImportResult {
  nodes: SkillNode[];
  edges: SkillEdge[];
  suggestedTitle: string;
  confidence: number; // 0-1 indicating how confident the extraction is
  bio?: string; // Extracted professional summary/bio
  experience?: ExtractedExperience[]; // Extracted work experiences
}

// Schema for extracted work experience validation
const ExtractedExperienceSchema = z.object({
  company: z.string().max(RESUME_CONFIG.experienceCompanyMaxLength),
  title: z.string().max(RESUME_CONFIG.experienceTitleMaxLength),
  startDate: z.string(), // YYYY-MM format
  endDate: z.string().nullable(), // null = current position
  description: z.string().max(RESUME_CONFIG.experienceDescriptionMaxLength),
  location: z.string().max(RESUME_CONFIG.experienceLocationMaxLength).optional(),
});

// Schema for AI response validation
const DocumentExtractionResponseSchema = z.object({
  suggestedTitle: z.string(),
  confidence: z.number().min(0).max(1),
  bio: z.string().max(RESUME_CONFIG.bioMaxLength).optional(),
  experience: z.array(ExtractedExperienceSchema).max(RESUME_CONFIG.experienceMaxItems).optional(),
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

  const systemPrompt = `You are an expert career analyst and skill extractor. Analyze documents (resumes, portfolios, project descriptions, professional profiles, certificates, screenshots) to identify skills, professional summary, and work experience.

${LOCALE_INSTRUCTIONS[locale]}

IMPORTANT: These are skills the user ALREADY HAS (from their resume/portfolio). All skills should be marked as learned with progress: ${aiExtraction.importedSkillProgress}.

Guidelines for extraction:

1. SKILLS:
   - Identify both technical skills and soft skills mentioned or implied
   - Infer skill levels based on context (experience, achievements, certifications)
   - Create logical prerequisite relationships between skills
   - Group skills into meaningful categories
   - Use appropriate emoji icons for each skill
   - Generate IDs in lowercase-hyphenated-english format
   - Assign levels 1-10 based on apparent proficiency:
     - 1-3: Mentioned/basic familiarity
     - 4-6: Working knowledge/experience
     - 7-9: Strong expertise/significant achievements
     - 10: Expert/thought leader

2. BIO (Professional Summary):
   - Extract or generate a concise professional summary (2-4 sentences)
   - Focus on career highlights, expertise areas, and professional identity
   - Maximum ${RESUME_CONFIG.bioMaxLength} characters

3. WORK EXPERIENCE:
   - Extract job history with company, title, dates, location, and description
   - Format dates as YYYY-MM (e.g., "2020-01")
   - Use null for endDate if it's the current position
   - Include key achievements and responsibilities in description
   - Maximum ${RESUME_CONFIG.experienceMaxItems} experiences

Return valid JSON only.`;

  const jsonStructure = `{
  "suggestedTitle": "Suggested career/profile title based on the document",
  "confidence": 0.0-1.0 (how confident you are in the extraction),
  "bio": "Professional summary extracted or generated from the document (2-4 sentences)",
  "experience": [
    {
      "company": "Company Name",
      "title": "Job Title",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM" or null (for current position),
      "description": "Key responsibilities and achievements",
      "location": "City, Country (optional)"
    }
  ],
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
        text: `Analyze this image (resume, certificate, portfolio screenshot, or professional profile) and extract skills, professional summary (bio), and work experience.
${document.metadata.title ? `Image title: ${document.metadata.title}` : ''}
${contextInfo}

Return a JSON object with this exact structure:
${jsonStructure}

Generate ${aiExtraction.minSkills}-${aiExtraction.maxSkills} skills based on what you can see in the image. Extract bio and work experience if visible. If the image has minimal content or is unclear, generate fewer skills but set a lower confidence score.`,
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
      bio: validated.bio,
      experience: validated.experience,
    };
  }

  // Handle text-based documents
  const truncatedContent = truncateForAI(document.content, aiExtraction.maxInputTokens);

  const userPrompt = `Analyze this document and extract skills, professional summary (bio), and work experience:

Document Type: ${document.metadata.type}
${document.metadata.title ? `Title: ${document.metadata.title}` : ''}
${document.metadata.sourceUrl ? `Source: ${document.metadata.sourceUrl}` : ''}

Content:
${truncatedContent}
${contextInfo}

Return a JSON object with this exact structure:
${jsonStructure}

Generate ${aiExtraction.minSkills}-${aiExtraction.maxSkills} skills based on what's found in the document. Extract bio and work experience if present. If the document has minimal content, generate fewer skills but set a lower confidence score.`;

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
    bio: validated.bio,
    experience: validated.experience,
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
    bioFound: string;
    experienceFound: (count: number) => string;
  }> = {
    en: {
      skillsFound: (count) => `Found ${count} skill${count !== 1 ? 's' : ''}`,
      categories: (cats) => `Categories: ${cats.join(', ')}`,
      confidence: (level) => `Extraction confidence: ${level}`,
      suggestedTitle: (title) => `Suggested title: ${title}`,
      bioFound: 'Professional summary extracted',
      experienceFound: (count) => `Found ${count} work experience${count !== 1 ? 's' : ''}`,
    },
    zh: {
      skillsFound: (count) => `发现 ${count} 个技能`,
      categories: (cats) => `分类：${cats.join('、')}`,
      confidence: (level) => `提取置信度：${level}`,
      suggestedTitle: (title) => `建议标题：${title}`,
      bioFound: '已提取个人简介',
      experienceFound: (count) => `发现 ${count} 段工作经历`,
    },
    ja: {
      skillsFound: (count) => `${count}個のスキルを発見`,
      categories: (cats) => `カテゴリー：${cats.join('、')}`,
      confidence: (level) => `抽出信頼度：${level}`,
      suggestedTitle: (title) => `推奨タイトル：${title}`,
      bioFound: '職務経歴書を抽出しました',
      experienceFound: (count) => `${count}件の職歴を発見`,
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

  // Add bio and experience info
  if (result.bio) {
    summaries.push(msg.bioFound);
  }

  if (result.experience && result.experience.length > 0) {
    summaries.push(msg.experienceFound(result.experience.length));
  }

  return summaries;
}
