/**
 * Skill Executor
 *
 * Executes skills with:
 * - Minimal context building
 * - Tool composition
 * - Pre/post execution hooks
 * - Streaming support
 * - Response validation
 */

import OpenAI from 'openai';
import type {
  SkillDefinition,
  SkillContext,
  SkillResult,
  FullContext,
  ExecutorOptions,
  Tool,
  ToolId,
} from './types';
import { buildSkillContext } from './context';
import { SkillRouter } from './router';
import { AI_CHAT_CONFIG } from '@/lib/constants';

// Lazy-load OpenAI instance
let openaiInstance: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    openaiInstance = new OpenAI();
  }
  return openaiInstance;
}

export class SkillExecutor {
  private router: SkillRouter;
  private tools: Map<ToolId, Tool> = new Map();

  constructor(router: SkillRouter) {
    this.router = router;
  }

  /**
   * Register a tool
   */
  registerTool(tool: Tool): void {
    this.tools.set(tool.id, tool);
  }

  /**
   * Execute a skill based on the user message
   */
  async execute(
    message: string,
    fullContext: FullContext,
    options: ExecutorOptions = {}
  ): Promise<SkillResult> {
    // 1. Route to skill
    const { skill, params } = this.router.route(message);

    // 2. Build minimal context
    let ctx = buildSkillContext(skill, fullContext);

    // 3. Add route params to context
    if (params) {
      ctx.customData = { ...ctx.customData, routeParams: params };
    }

    // 4. Pre-execute hook (e.g., web search for trending)
    if (skill.preExecute) {
      ctx = await skill.preExecute(ctx);
    }

    // 5. Build system prompt
    const systemPrompt =
      typeof skill.systemPrompt === 'function'
        ? skill.systemPrompt(ctx)
        : skill.systemPrompt;

    // 6. Execute AI call
    const response = await this.executeAI(
      systemPrompt,
      message,
      ctx,
      skill,
      options
    );

    // 7. Validate response
    const validated = skill.responseSchema.parse(response);

    // 8. Post-process
    if (skill.postProcess) {
      return skill.postProcess(validated, ctx);
    }

    return validated as SkillResult;
  }

  /**
   * Execute with streaming response
   */
  async *executeStream(
    message: string,
    fullContext: FullContext,
    options: ExecutorOptions = {}
  ): AsyncGenerator<{ chunk?: string; result?: SkillResult }> {
    // 1. Route to skill
    const { skill, params } = this.router.route(message);

    // 2. Build minimal context
    let ctx = buildSkillContext(skill, fullContext);

    // 3. Add route params
    if (params) {
      ctx.customData = { ...ctx.customData, routeParams: params };
    }

    // 4. Pre-execute hook
    if (skill.preExecute) {
      ctx = await skill.preExecute(ctx);
    }

    // 5. Build system prompt
    const systemPrompt =
      typeof skill.systemPrompt === 'function'
        ? skill.systemPrompt(ctx)
        : skill.systemPrompt;

    // 6. Stream AI response
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add chat history if present
    if (ctx.chatHistory) {
      for (const msg of ctx.chatHistory) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    messages.push({ role: 'user', content: message });

    const timeout = options.timeout ?? AI_CHAT_CONFIG.timeout;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const stream = await getOpenAI().chat.completions.create(
        {
          model: skill.model || AI_CHAT_CONFIG.model,
          response_format: { type: 'json_object' },
          messages,
          temperature: skill.temperature ?? AI_CHAT_CONFIG.temperature,
          max_tokens: skill.maxTokens ?? AI_CHAT_CONFIG.maxTokens,
          stream: true,
        },
        { signal: controller.signal }
      );

      let fullContent = '';

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullContent += content;

        // Yield chunk for display
        if (content) {
          yield { chunk: content };
        }
      }

      // 7. Parse and validate final response
      let parsed: unknown;
      try {
        parsed = JSON.parse(fullContent);
      } catch {
        throw new Error('Failed to parse AI response as JSON');
      }

      const validated = skill.responseSchema.parse(parsed);

      // 8. Post-process
      let result: SkillResult;
      if (skill.postProcess) {
        result = skill.postProcess(validated, ctx);
      } else {
        result = validated as SkillResult;
      }

      yield { result };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Execute AI call (non-streaming)
   */
  private async executeAI(
    systemPrompt: string,
    userMessage: string,
    ctx: SkillContext,
    skill: SkillDefinition,
    options: ExecutorOptions
  ): Promise<unknown> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add chat history if present
    if (ctx.chatHistory) {
      for (const msg of ctx.chatHistory) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    messages.push({ role: 'user', content: userMessage });

    // Apply timeout from options or config
    const timeout = options.timeout ?? AI_CHAT_CONFIG.timeout;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await getOpenAI().chat.completions.create(
        {
          model: skill.model || AI_CHAT_CONFIG.model,
          response_format: { type: 'json_object' },
          messages,
          temperature: skill.temperature ?? AI_CHAT_CONFIG.temperature,
          max_tokens: skill.maxTokens ?? AI_CHAT_CONFIG.maxTokens,
        },
        { signal: controller.signal }
      );

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No content in AI response');
      }

      return JSON.parse(content);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Get a tool by ID
   */
  getTool<T extends Tool>(id: ToolId): T | undefined {
    return this.tools.get(id) as T | undefined;
  }

  /**
   * Execute a tool
   */
  async executeTool<TParams, TResult>(
    id: ToolId,
    params: TParams
  ): Promise<TResult> {
    const tool = this.tools.get(id);
    if (!tool) {
      throw new Error(`Tool not found: ${id}`);
    }

    // Validate params if schema provided
    if (tool.paramsSchema) {
      tool.paramsSchema.parse(params);
    }

    return tool.execute(params) as Promise<TResult>;
  }
}

/**
 * Create a configured skill executor
 */
export function createSkillExecutor(router: SkillRouter): SkillExecutor {
  return new SkillExecutor(router);
}
