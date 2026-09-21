/**
 * @file packages/guard/src/adapters/langchain.ts
 * First-class LangChain Tool adapter for @ghost/guard.
 * Supports LangChain StructuredTool, DynamicTool, and legacy Tool interfaces.
 */

import { GhostGuardConfig } from '../core/types.js';
import { withGhostGuard } from '../core/interceptor.js';

export interface LangChainToolLike {
  name: string;
  description: string;
  schema?: any;
  invoke?: (input: any, config?: any) => Promise<any>;
  call?: (input: any, config?: any) => Promise<any>;
  returnDirect?: boolean;
  [key: string]: any;
}

/**
 * Wraps a LangChain tool with Ghost Zero-Knowledge policy guardrails.
 * Preserves all metadata, schemas, and return semantics expected by LangChain agent executors.
 *
 * @param tool The LangChain StructuredTool or DynamicTool to guard.
 * @param config Optional Ghost Guard configuration.
 */
export function wrapLangChainTool<T extends LangChainToolLike>(tool: T, config: GhostGuardConfig = {}): T {
  const originalInvoke = tool.invoke || tool.call;

  if (typeof originalInvoke !== 'function') {
    throw new Error(`[Ghost Guard] Cannot wrap LangChain tool '${tool.name || 'unnamed'}': missing invoke/call method.`);
  }

  // Create guarded invoker via universal interceptor
  const guardedInvoker = withGhostGuard(originalInvoke.bind(tool), {
    ...config,
    // Custom extractor tailored for LangChain inputs
    extractContext: async (args: any[]) => {
      const input = args[0];
      if (typeof input === 'string') {
        // Try parsing JSON if input is serialized JSON string
        try {
          const parsed = JSON.parse(input);
          return parsed;
        } catch {
          // Fallback: match simple monetary pattern
          const match = input.match(/\$?(\d+(?:\.\d+)?)/);
          return {
            amount: match ? parseFloat(match[1]) : 0,
            merchant: 'LangChain Agent Action',
            purpose: input,
          };
        }
      }
      return typeof input === 'object' && input !== null ? input : {};
    },
  });

  // Proxy wrapper preserving original object identity and prototypes
  const wrappedTool = Object.create(Object.getPrototypeOf(tool));
  Object.assign(wrappedTool, tool);

  if (tool.invoke) {
    wrappedTool.invoke = async (input: any, runManager?: any) => {
      return guardedInvoker(input, runManager);
    };
  }

  if (tool.call) {
    wrappedTool.call = async (input: any, runManager?: any) => {
      return guardedInvoker(input, runManager);
    };
  }

  return wrappedTool as T;
}
