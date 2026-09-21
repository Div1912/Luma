/**
 * @file packages/guard/src/adapters/eliza.ts
 * First-class ElizaOS Action adapter for @ghost/guard.
 * Injects Zero-Knowledge spending guardrails into Eliza character actions.
 */

import { GhostGuardConfig } from '../core/types.js';
import { withGhostGuard } from '../core/interceptor.js';

export interface ElizaActionLike {
  name: string;
  description: string;
  similes?: string[];
  examples?: any[];
  validate?: (runtime: any, message: any, state?: any) => Promise<boolean>;
  handler: (
    runtime: any,
    message: any,
    state?: any,
    options?: any,
    callback?: (response: any) => Promise<any>
  ) => Promise<any>;
  [key: string]: any;
}

/**
 * Wraps an ElizaOS Action with Ghost Zero-Knowledge spending guardrails.
 * Automatically catches policy blocks and pipes them through Eliza's response callback.
 *
 * @param action The ElizaOS Action object.
 * @param config Optional Ghost Guard configuration.
 */
export function wrapElizaAction<T extends ElizaActionLike>(action: T, config: GhostGuardConfig = {}): T {
  const originalHandler = action.handler.bind(action);

  const guardedHandler = withGhostGuard(
    async (runtime: any, message: any, state?: any, options?: any, callback?: any) => {
      return originalHandler(runtime, message, state, options, callback);
    },
    {
      ...config,
      // Default onBlock handler for Eliza character persona
      onBlock: async (err, context) => {
        if (config.onBlock) {
          return config.onBlock(err, context);
        }

        // Return a structured persona message that Eliza runtime can verbalize
        return {
          text: `I cannot complete this transaction: ${err.message}`,
          action: 'TRANSACTION_BLOCKED_BY_GHOST_POLICY',
          context: {
            reason: err.message,
            amount: context.amount,
            merchant: context.merchant,
          },
        };
      },
    }
  );

  return {
    ...action,
    handler: guardedHandler,
  };
}
