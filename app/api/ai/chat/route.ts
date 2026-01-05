import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  type ChatContext,
  ChatModificationSchema,
  LOCALE_INSTRUCTIONS,
  SCOPE_GUARD_PROMPT,
} from '@/lib/ai-chat';
import { SkillNodeSchema, SkillEdgeSchema } from '@/lib/schemas';
import { locales, type Locale } from '@/i18n/routing';
import OpenAI from 'openai';
import { searchTrendingTech, formatSearchResultsForAI } from '@/lib/mcp/tavily';
import { AI_CHAT_CONFIG } from '@/lib/constants';
import { hasEnoughCredits, deductCredits } from '@/lib/credits';
import { applyRateLimit } from '@/lib/rate-limit';

const openai = new OpenAI();

// Request schema using constants for validation limits
const ChatRequestSchema = z.object({
  message: z.string().min(1).max(AI_CHAT_CONFIG.maxMessageLength),
  careerTitle: z.string(),
  careerDescription: z.string(),
  currentNodes: z.array(SkillNodeSchema),
  currentEdges: z.array(SkillEdgeSchema),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().default([]),
  userMaps: z.array(z.object({
    id: z.string(),
    title: z.string(),
    careerTitle: z.string(),
  })).optional(),
  locale: z.enum([...locales] as [string, ...string[]]).default('en'),
  stream: z.boolean().optional().default(false),
});

// Detect if user is requesting a web search for trending tech
function detectSearchIntent(message: string): { needsSearch: boolean; searchType: 'trending' | 'skills' | null } {
  const lowerMessage = message.toLowerCase();
  const { trending, search } = AI_CHAT_CONFIG.searchKeywords;

  const hasTrendingIntent = trending.some(k => lowerMessage.includes(k));
  const hasSearchIntent = search.some(k => lowerMessage.includes(k));

  if (hasTrendingIntent || hasSearchIntent) {
    return { needsSearch: true, searchType: 'trending' };
  }

  return { needsSearch: false, searchType: null };
}

function getSystemPrompt(context: ChatContext, webSearchContext?: string) {
  const localeInstruction = LOCALE_INSTRUCTIONS[context.locale] || LOCALE_INSTRUCTIONS.en;

  return `${SCOPE_GUARD_PROMPT}

${localeInstruction}

You are helping a user modify their skill map for: "${context.careerTitle}"
Career description: ${context.careerDescription}

Current skills in the map (${context.currentNodes.length} total):
${context.currentNodes.slice(0, AI_CHAT_CONFIG.skillDisplayLimit).map(n => `- ${n.name} (${n.category}, Level ${n.level})`).join('\n')}
${context.currentNodes.length > AI_CHAT_CONFIG.skillDisplayLimit ? `\n... and ${context.currentNodes.length - AI_CHAT_CONFIG.skillDisplayLimit} more skills` : ''}

${context.userMaps && context.userMaps.length > 0 ? `
User's other skill maps (available for merging):
${context.userMaps.map(m => `- "${m.title}" (${m.careerTitle})`).join('\n')}
` : ''}

${webSearchContext ? `
WEB SEARCH RESULTS (use this information to suggest relevant, up-to-date skills):
${webSearchContext}
` : ''}

When modifying the skill map:
1. Generate unique IDs for new skills (use lowercase-hyphenated format, e.g., "react-testing-library")
2. Set appropriate levels (1-3: beginner, 4-6: intermediate, 7-10: advanced)
3. Define prerequisites based on logical learning order
4. Use relevant emoji icons
5. Create edges for all prerequisite relationships
6. Ensure new skills integrate well with existing ones
${webSearchContext ? '7. When adding trending skills, cite the source in your message response' : ''}

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
}

export async function POST(request: NextRequest) {
  try {
    // Validate session (optional - allow anonymous chat but restrict modifications)
    const session = await getServerSession(authOptions);

    // Apply rate limiting - stricter for anonymous, more generous for authenticated
    const rateLimitResult = await applyRateLimit(
      session?.user?.id ? 'authenticatedAI' : 'publicAI',
      session?.user?.id
    );
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    // Parse and validate request
    const body = await request.json();
    const validatedInput = ChatRequestSchema.parse(body);

    const context: ChatContext = {
      careerTitle: validatedInput.careerTitle,
      careerDescription: validatedInput.careerDescription,
      currentNodes: validatedInput.currentNodes,
      currentEdges: validatedInput.currentEdges,
      userMaps: validatedInput.userMaps,
      locale: validatedInput.locale as Locale,
    };

    // Check credits for logged-in users before AI call
    if (session?.user?.id) {
      const creditCheck = await hasEnoughCredits(session.user.id, 'ai_chat');
      if (!creditCheck.sufficient) {
        return NextResponse.json(
          {
            success: false,
            error: 'Insufficient credits',
            code: 'INSUFFICIENT_CREDITS',
            creditsRequired: creditCheck.required,
            creditsBalance: creditCheck.balance,
          },
          { status: 402 }
        );
      }
    }

    // Check if user wants to search for trending tech
    const searchIntent = detectSearchIntent(validatedInput.message);
    let webSearchContext: string | undefined;

    if (searchIntent.needsSearch) {
      // Perform web search using Tavily
      const searchResults = await searchTrendingTech(
        validatedInput.careerTitle,
        new Date().getFullYear()
      );
      webSearchContext = formatSearchResultsForAI(searchResults);
    }

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: getSystemPrompt(context, webSearchContext) },
      ...validatedInput.chatHistory.slice(-AI_CHAT_CONFIG.chatHistoryLimit).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: validatedInput.message },
    ];

    if (validatedInput.stream) {
      // Streaming response
      const stream = await openai.chat.completions.create({
        model: AI_CHAT_CONFIG.model,
        response_format: { type: 'json_object' },
        messages,
        temperature: AI_CHAT_CONFIG.temperature,
        max_tokens: AI_CHAT_CONFIG.maxTokens,
        stream: true,
      });

      // Create a readable stream for the response
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          let fullContent = '';

          try {
            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content || '';
              fullContent += content;

              // Send raw content chunks for display
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: content })}\n\n`));
            }

            // Parse and validate the final response
            try {
              const parsed = JSON.parse(fullContent);
              const validated = ChatModificationSchema.parse(parsed);

              // Send the final validated response
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ done: true, result: validated })}\n\n`)
              );
            } catch (parseError) {
              // If parsing fails, send error
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ error: 'Failed to parse AI response' })}\n\n`
                )
              );
            }
          } catch (error) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`)
            );
          }

          controller.close();
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    } else {
      // Non-streaming response
      const response = await openai.chat.completions.create({
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
      const validated = ChatModificationSchema.parse(parsed);

      // If user is not authenticated, flag that auth is required to apply modifications
      if (!session && validated.modifications) {
        const hasModifications =
          validated.modifications.addNodes.length > 0 ||
          validated.modifications.updateNodes.length > 0 ||
          validated.modifications.removeNodes.length > 0;

        if (hasModifications) {
          return NextResponse.json({
            success: true,
            data: {
              ...validated,
              requiresAuth: true,
            },
          });
        }
      }

      // Deduct credits after successful AI response
      let newCreditsBalance: number | undefined;
      if (session?.user?.id) {
        const deductResult = await deductCredits(session.user.id, 'ai_chat', {
          careerTitle: validatedInput.careerTitle,
          hasModifications: !!(validated.modifications?.addNodes?.length ||
            validated.modifications?.updateNodes?.length ||
            validated.modifications?.removeNodes?.length),
        });
        newCreditsBalance = deductResult.newBalance;
      }

      return NextResponse.json({
        success: true,
        data: validated,
        credits: newCreditsBalance !== undefined ? { balance: newCreditsBalance } : undefined,
      });
    }
  } catch (error) {
    console.error('Chat API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
