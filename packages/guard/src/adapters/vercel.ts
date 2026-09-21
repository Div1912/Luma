/**
 * @file packages/guard/src/adapters/vercel.ts
 * First-class Vercel AI SDK Core tool adapter for @ghost/guard.
 * Wraps tools instantiated via `tool({ description, parameters, execute })`.
 */

import { GhostGuardConfig } from '../core/types.js';
import { withGhostGuard } from '../core/interceptor.js';

export interface VercelToolLike<TParams = any, TResult = any> {
  description?: string;
  parameters: any; // Zod schema or JSON schema
  execute?: (args: TParams, options?: any) => Promise<TResult>;
  [key: string]: any;
}

/**
 * Wraps a Vercel AI SDK tool definition with Ghost Zero-Knowledge policy guardrails.
 * Preserves Zod parameters schema, tool descriptions, and streaming execution contexts.
 *
 * @param toolDef The Vercel AI SDK tool object.
 * @param config Optional Ghost Guard configuration.
 */
export function wrapVercelTool<TParams = any, TResult = any>(
  toolDef: VercelToolLike<TParams, TResult>,
  config: GhostGuardConfig = {}
): VercelToolLike<TParams, TResult> {
  if (typeof toolDef.execute !== 'function') {
    throw new Error(`[Ghost Guard] Cannot wrap Vercel AI SDK tool: missing execute function.`);
  }

  const originalExecute = toolDef.execute.bind(toolDef);
  const guardedExecute = withGhostGuard(originalExecute, config);

  return {
    ...toolDef,
    execute: async (args: TParams, options?: any): Promise<TResult> => {
      return guardedExecute(args, options);
    },
  };
}
