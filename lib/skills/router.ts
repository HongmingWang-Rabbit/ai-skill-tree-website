/**
 * Skill Router
 *
 * Routes user messages to the appropriate skill based on:
 * 1. Explicit slash commands (/expand, /trending, etc.)
 * 2. Intent detection via regex patterns
 * 3. Fallback to general chat
 */

import type { SkillDefinition, RouteResult, SkillRouter as ISkillRouter } from './types';

export class SkillRouter implements ISkillRouter {
  private skills: Map<string, SkillDefinition> = new Map();
  private fallbackSkill: SkillDefinition | null = null;

  /**
   * Register a skill
   */
  register(skill: SkillDefinition): void {
    // Register by ID
    this.skills.set(skill.id, skill);

    // Register aliases
    for (const alias of skill.aliases) {
      this.skills.set(alias.toLowerCase(), skill);
    }

    // Register slash command without the /
    if (skill.slashCommand) {
      const cmd = skill.slashCommand.replace(/^\//, '').toLowerCase();
      this.skills.set(cmd, skill);
    }

    // Track fallback skill (the one with no intent patterns)
    if (skill.id === 'chat' || skill.intentPatterns.length === 0) {
      this.fallbackSkill = skill;
    }
  }

  /**
   * Route a message to the appropriate skill
   */
  route(message: string): RouteResult {
    const trimmed = message.trim();

    // 1. Check for explicit slash command
    const slashMatch = trimmed.match(/^\/(\w+)(?:\s+(.*))?$/);
    if (slashMatch) {
      const [, command, args] = slashMatch;
      const skill = this.skills.get(command.toLowerCase());

      if (skill) {
        return {
          skill,
          params: args ? { args: args.trim() } : undefined,
          matchType: 'slash-command',
        };
      }
      // Unknown command - fall through to intent detection
    }

    // 2. Check intent patterns (in order of registration)
    for (const skill of this.getUniqueSkills()) {
      // Skip fallback skill in intent matching
      if (skill.id === 'chat') continue;

      for (const pattern of skill.intentPatterns) {
        const match = trimmed.match(pattern);
        if (match) {
          return {
            skill,
            params: match.groups,
            matchType: 'intent',
          };
        }
      }
    }

    // 3. Fallback to general chat
    if (this.fallbackSkill) {
      return {
        skill: this.fallbackSkill,
        matchType: 'fallback',
      };
    }

    throw new Error('No fallback skill registered');
  }

  /**
   * Get all unique skills (deduplicated from aliases)
   */
  private getUniqueSkills(): SkillDefinition[] {
    const seen = new Set<string>();
    const unique: SkillDefinition[] = [];

    for (const skill of this.skills.values()) {
      if (!seen.has(skill.id)) {
        seen.add(skill.id);
        unique.push(skill);
      }
    }

    return unique;
  }

  /**
   * Get all available slash commands for UI autocomplete
   */
  getSlashCommands(): Array<{ command: string; name: string; description: string }> {
    const commands: Array<{ command: string; name: string; description: string }> = [];
    const seen = new Set<string>();

    for (const skill of this.skills.values()) {
      if (skill.slashCommand && !seen.has(skill.slashCommand)) {
        seen.add(skill.slashCommand);
        commands.push({
          command: skill.slashCommand,
          name: skill.name,
          description: skill.description,
        });
      }
    }

    // Sort alphabetically
    return commands.sort((a, b) => a.command.localeCompare(b.command));
  }

  /**
   * Get a skill by ID
   */
  get(id: string): SkillDefinition | undefined {
    return this.skills.get(id.toLowerCase());
  }

  /**
   * Check if a message starts with a valid slash command
   */
  isSlashCommand(message: string): boolean {
    const match = message.trim().match(/^\/(\w+)/);
    if (!match) return false;
    return this.skills.has(match[1].toLowerCase());
  }

  /**
   * Get help text for a slash command
   */
  getCommandHelp(command: string): string | undefined {
    const skill = this.skills.get(command.replace(/^\//, '').toLowerCase());
    if (!skill) return undefined;
    return `${skill.slashCommand}: ${skill.description}`;
  }
}

/**
 * Parse slash command arguments
 * Examples:
 *   /resources React -> { command: 'resources', args: ['React'] }
 *   /merge "My Backend Map" -> { command: 'merge', args: ['My Backend Map'] }
 */
export function parseSlashCommand(
  message: string
): { command: string; args: string[] } | null {
  const trimmed = message.trim();
  if (!trimmed.startsWith('/')) return null;

  // Match command and everything after
  const match = trimmed.match(/^\/(\w+)(?:\s+(.*))?$/);
  if (!match) return null;

  const [, command, argsStr] = match;
  const args: string[] = [];

  if (argsStr) {
    // Parse quoted strings and unquoted words
    const argPattern = /"([^"]+)"|'([^']+)'|(\S+)/g;
    let argMatch;
    while ((argMatch = argPattern.exec(argsStr)) !== null) {
      args.push(argMatch[1] || argMatch[2] || argMatch[3]);
    }
  }

  return { command: command.toLowerCase(), args };
}
