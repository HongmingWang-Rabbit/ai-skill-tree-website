/**
 * Tools Registry
 *
 * Central registry for all internal tools.
 */

import type { Tool, ToolId, ToolRegistry as IToolRegistry } from '../types';
import { webSearchTool } from './web-search';
import { graphOpsTool } from './graph-ops';

// Re-export tools
export { webSearchTool, searchTrending, searchLearning } from './web-search';
export {
  graphOpsTool,
  applyModifications,
  generateSkillId,
  createEdge,
  validateEdges,
  GraphModificationSchema,
  type GraphModification,
} from './graph-ops';

// ============================================================================
// Tool Registry
// ============================================================================

class ToolRegistry implements IToolRegistry {
  private tools: Map<ToolId, Tool> = new Map();

  constructor() {
    // Register built-in tools
    this.register(webSearchTool as Tool);
    this.register(graphOpsTool as Tool);
  }

  register(tool: Tool): void {
    this.tools.set(tool.id, tool);
  }

  get<T extends ToolId>(id: T): Tool | undefined {
    return this.tools.get(id);
  }

  list(): Tool[] {
    return Array.from(this.tools.values());
  }

  async execute<TParams, TResult>(id: ToolId, params: TParams): Promise<TResult> {
    const tool = this.tools.get(id);
    if (!tool) {
      throw new Error(`Tool not found: ${id}`);
    }
    return tool.execute(params) as Promise<TResult>;
  }
}

// Singleton instance
let registryInstance: ToolRegistry | null = null;

export function getToolRegistry(): ToolRegistry {
  if (!registryInstance) {
    registryInstance = new ToolRegistry();
  }
  return registryInstance;
}

export { ToolRegistry };
