import OpenAI from 'openai';
import { z } from 'zod';
import { type Locale } from '@/i18n/routing';
import { RESUME_CONFIG } from './constants';
import { type WorkExperience } from './schemas';

const openai = new OpenAI();

// Types for job requirements extracted from job postings
export interface JobRequirements {
  requiredSkills: string[];
  preferredSkills: string[];
  experienceYears: number | null;
  responsibilities: string[];
  jobTitle: string;
  companyName: string | null;
}

// Types for skills in resume context
export interface ResumeSkill {
  name: string;
  level: number; // 1-10
  category: string;
  relevance: 'high' | 'medium' | 'low';
}

// Types for grouped skills in resume
export interface ResumeSkillGroup {
  category: string;
  skills: ResumeSkill[];
}

// Types for generated resume content
export interface ResumeContent {
  professionalSummary: string;
  skills: ResumeSkillGroup[];
  highlights: string[];
}

// Career skill data from user's maps
export interface CareerSkillData {
  careerTitle: string;
  skills: Array<{
    name: string;
    level: number;
    category: string;
    progress: number;
  }>;
}

// User profile for resume generation
export interface UserProfile {
  name: string;
  email: string;
  bio: string;
  experience: WorkExperience[];
}

// Zod schema for job requirements response
const JobRequirementsSchema = z.object({
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()),
  experienceYears: z.number().nullable(),
  responsibilities: z.array(z.string()),
  jobTitle: z.string(),
  companyName: z.string().nullable(),
});

// Zod schema for resume content response
const ResumeContentSchema = z.object({
  professionalSummary: z.string(),
  skills: z.array(z.object({
    category: z.string(),
    skills: z.array(z.object({
      name: z.string(),
      level: z.number().min(1).max(10),
      category: z.string(),
      relevance: z.enum(['high', 'medium', 'low']),
    })),
  })),
  highlights: z.array(z.string()),
});

const LOCALE_INSTRUCTIONS: Record<Locale, string> = {
  en: 'Generate all content in English.',
  zh: 'Generate all content in Simplified Chinese (简体中文).',
  ja: 'Generate all content in Japanese (日本語).',
};

/**
 * Analyze a job posting to extract requirements
 */
export async function analyzeJobPosting(
  content: string,
  jobTitle: string | undefined,
  locale: Locale = 'en'
): Promise<JobRequirements> {
  const systemPrompt = `You are an expert HR analyst specializing in job requirement extraction.
${LOCALE_INSTRUCTIONS[locale]}

Extract job requirements from job postings accurately and comprehensively.
Return valid JSON only.`;

  const userPrompt = `Analyze the following job posting and extract the key requirements.
${jobTitle ? `Job Title: ${jobTitle}` : ''}

Job Posting Content:
${content.slice(0, RESUME_CONFIG.jobContentMaxChars)}

Return a JSON object with this exact structure:
{
  "requiredSkills": ["list of required skills"],
  "preferredSkills": ["list of nice-to-have skills"],
  "experienceYears": number or null,
  "responsibilities": ["main job responsibilities"],
  "jobTitle": "extracted or provided job title",
  "companyName": "company name if found" or null
}`;

  const response = await openai.chat.completions.create({
    model: RESUME_CONFIG.aiModel,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: RESUME_CONFIG.aiTemperature,
    max_tokens: RESUME_CONFIG.aiJobAnalysisMaxTokens,
  });

  const responseContent = response.choices[0].message.content;
  if (!responseContent) {
    throw new Error('No content in AI response');
  }

  const parsed = JSON.parse(responseContent);
  return JobRequirementsSchema.parse(parsed);
}

/**
 * Generate tailored resume content based on user's skills and optional job requirements
 */
export async function generateResumeContent(
  profile: UserProfile,
  careers: CareerSkillData[],
  jobRequirements: JobRequirements | null,
  locale: Locale = 'en'
): Promise<ResumeContent> {
  // Gather all skills from user's career maps
  const allSkills = careers.flatMap(career =>
    career.skills
      .filter(skill => skill.progress > 0) // Only include skills with progress
      .map(skill => ({
        name: skill.name,
        level: skill.level,
        category: skill.category,
        careerTitle: career.careerTitle,
        progress: skill.progress,
      }))
  );

  const systemPrompt = `You are an expert resume writer who creates compelling, ATS-friendly resumes.
${LOCALE_INSTRUCTIONS[locale]}

Your task is to generate professional resume content that:
1. Highlights relevant skills based on the job requirements (if provided)
2. Creates a compelling professional summary
3. Organizes skills by category with relevance ratings
4. Suggests key highlights/achievements to emphasize

Return valid JSON only.`;

  const jobContext = jobRequirements
    ? `
TARGET JOB:
- Job Title: ${jobRequirements.jobTitle}
${jobRequirements.companyName ? `- Company: ${jobRequirements.companyName}` : ''}
- Required Skills: ${jobRequirements.requiredSkills.join(', ')}
- Preferred Skills: ${jobRequirements.preferredSkills.join(', ')}
${jobRequirements.experienceYears ? `- Experience Required: ${jobRequirements.experienceYears} years` : ''}
- Responsibilities: ${jobRequirements.responsibilities.join('; ')}
`
    : 'No specific job target - generate a general professional resume.';

  const userPrompt = `Generate tailored resume content for the following profile.

USER PROFILE:
- Name: ${profile.name}
${profile.bio ? `- Bio: ${profile.bio}` : ''}

WORK EXPERIENCE:
${profile.experience.length > 0
  ? profile.experience.map(exp =>
      `- ${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate || 'Present'})${exp.location ? `, ${exp.location}` : ''}\n  ${exp.description}`
    ).join('\n')
  : 'No work experience provided'}

USER'S SKILLS (from career skill maps):
${allSkills.map(skill =>
  `- ${skill.name} (Level: ${skill.level}/10, Category: ${skill.category}, Progress: ${skill.progress}%)`
).join('\n')}

${jobContext}

Return a JSON object with this exact structure:
{
  "professionalSummary": "A compelling 2-3 sentence professional summary tailored to the job (or general if no job specified)",
  "skills": [
    {
      "category": "Category Name",
      "skills": [
        {
          "name": "Skill Name",
          "level": 1-10,
          "category": "Category Name",
          "relevance": "high" | "medium" | "low"
        }
      ]
    }
  ],
  "highlights": ["Key achievement or talking point 1", "Key achievement 2", "Key achievement 3"]
}

IMPORTANT:
- Rate skill relevance as "high" if it matches required skills, "medium" if it matches preferred skills, "low" otherwise
- Group skills by category and sort by relevance within each category
- Include only skills the user actually has (from their skill maps)
- Generate 3-5 highlights that connect their skills to potential achievements
- If generating a general resume, focus on the most impressive and transferable skills`;

  const response = await openai.chat.completions.create({
    model: RESUME_CONFIG.aiModel,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: RESUME_CONFIG.aiTemperature,
    max_tokens: RESUME_CONFIG.aiMaxTokens,
  });

  const responseContent = response.choices[0].message.content;
  if (!responseContent) {
    throw new Error('No content in AI response');
  }

  const parsed = JSON.parse(responseContent);
  return ResumeContentSchema.parse(parsed);
}

/**
 * Generate a simple job title analysis when no URL is provided
 */
export async function analyzeJobTitle(
  jobTitle: string,
  locale: Locale = 'en'
): Promise<JobRequirements> {
  const systemPrompt = `You are an expert HR analyst who understands job market requirements.
${LOCALE_INSTRUCTIONS[locale]}

Based on common industry standards, generate typical requirements for the given job title.
Return valid JSON only.`;

  const userPrompt = `Generate typical job requirements for the following position:

Job Title: ${jobTitle}

Return a JSON object with this exact structure:
{
  "requiredSkills": ["typical required skills for this role"],
  "preferredSkills": ["typical nice-to-have skills"],
  "experienceYears": typical years of experience required or null,
  "responsibilities": ["typical responsibilities for this role"],
  "jobTitle": "${jobTitle}",
  "companyName": null
}

Base your response on typical industry standards for this role.`;

  const response = await openai.chat.completions.create({
    model: RESUME_CONFIG.aiModel,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: RESUME_CONFIG.aiTemperature,
    max_tokens: RESUME_CONFIG.aiJobAnalysisMaxTokens,
  });

  const responseContent = response.choices[0].message.content;
  if (!responseContent) {
    throw new Error('No content in AI response');
  }

  const parsed = JSON.parse(responseContent);
  return JobRequirementsSchema.parse(parsed);
}
