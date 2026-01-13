import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SkillNodeSchema, SkillEdgeSchema } from '@/lib/schemas';
import { locales, type Locale } from '@/i18n/routing';
import { AI_CHAT_CONFIG } from '@/lib/constants';
import { hasEnoughCredits, deductCredits } from '@/lib/credits';
import { applyRateLimit } from '@/lib/rate-limit';
import { skillSystem, type FullContext } from '@/lib/skills';

// Request schema
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

export async function POST(request: NextRequest) {
  try {
    // Validate session (optional - allow anonymous chat but restrict modifications)
    const session = await getServerSession(authOptions);

    // Apply rate limiting
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

    // Build full context for skill system
    const fullContext: FullContext = {
      locale: validatedInput.locale as Locale,
      careerTitle: validatedInput.careerTitle,
      careerDescription: validatedInput.careerDescription,
      nodes: validatedInput.currentNodes,
      edges: validatedInput.currentEdges,
      chatHistory: validatedInput.chatHistory,
      userMaps: validatedInput.userMaps,
      userId: session?.user?.id,
      isAuthenticated: !!session?.user,
    };

    // Route the message to see which skill will handle it
    const routeResult = skillSystem.route(validatedInput.message);

    if (validatedInput.stream) {
      // Streaming response using skill system
      const encoder = new TextEncoder();

      const readable = new ReadableStream({
        async start(controller) {
          try {
            // Use skill system streaming
            for await (const event of skillSystem.executeStream(
              validatedInput.message,
              fullContext,
              { timeout: AI_CHAT_CONFIG.timeout }
            )) {
              if (event.chunk) {
                // Send chunk for display
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ chunk: event.chunk })}\n\n`)
                );
              }

              if (event.result) {
                // Transform skill result to match expected response format
                const result = {
                  message: event.result.message,
                  modifications: event.result.modifications,
                  isOffTopic: event.result.isOffTopic || false,
                  // Include skill metadata
                  _skill: {
                    id: routeResult.skill.id,
                    name: routeResult.skill.name,
                  },
                };

                // Send final result
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ done: true, result })}\n\n`)
                );
              }
            }
          } catch {
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
      const result = await skillSystem.execute(
        validatedInput.message,
        fullContext,
        { timeout: AI_CHAT_CONFIG.timeout }
      );

      // Check if auth is required for modifications
      if (!session && result.modifications) {
        const hasModifications =
          (result.modifications.addNodes?.length || 0) > 0 ||
          (result.modifications.updateNodes?.length || 0) > 0 ||
          (result.modifications.removeNodes?.length || 0) > 0;

        if (hasModifications) {
          return NextResponse.json({
            success: true,
            data: {
              ...result,
              requiresAuth: true,
            },
          });
        }
      }

      // Deduct credits after successful response
      let newCreditsBalance: number | undefined;
      if (session?.user?.id) {
        const deductResult = await deductCredits(session.user.id, 'ai_chat', {
          careerTitle: validatedInput.careerTitle,
          skillUsed: routeResult.skill.id,
          hasModifications: !!(
            result.modifications?.addNodes?.length ||
            result.modifications?.updateNodes?.length ||
            result.modifications?.removeNodes?.length
          ),
        });
        newCreditsBalance = deductResult.newBalance;
      }

      return NextResponse.json({
        success: true,
        data: {
          message: result.message,
          modifications: result.modifications,
          isOffTopic: result.isOffTopic || false,
          _skill: {
            id: routeResult.skill.id,
            name: routeResult.skill.name,
          },
        },
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

    // Check for timeout errors
    if (error instanceof Error && error.message.includes('timed out')) {
      return NextResponse.json(
        { success: false, error: 'Request timed out. Please try again.' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve available slash commands
export async function GET() {
  const commands = skillSystem.getSlashCommands();
  return NextResponse.json({
    success: true,
    data: commands,
  });
}
