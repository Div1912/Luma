/**
 * @file integrations/autogpt.ts
 * Native AutoGPT, AutoGen, and Eliza integration hooks for Ghost Zero-Knowledge policy guardrails.
 */

import { GhostClient } from '../client.js';
import { PolicyEvaluationResult } from '../types.js';

export interface AutoGPTCommandContext {
  command_name: string;
  arguments: Record<string, any>;
}

export interface GhostAutoGPTOptions {
  agentId: string;
  financialCommands?: string[];
  amountKey?: string;
  merchantKey?: string;
}

/**
 * Higher-order function to wrap any AutoGPT command execution loop with ZK guardrails.
 * 
 * Usage in 3 lines:
 * ```typescript
 * import { GhostClient, withGhostGuard } from '@ghost/sdk';
 * const ghost = new GhostClient({ apiKey: process.env.GHOST_API_KEY });
 * const safeExecute = withGhostGuard(ghost, { agentId: 'autogpt_agent_1' }, executeCommand);
 * ```
 */
export function withGhostGuard<T extends (...args: any[]) => Promise<any>>(
  ghost: GhostClient,
  options: GhostAutoGPTOptions,
  originalExecute: T
): T {
  const financialCommands = options.financialCommands || [
    'purchase_item',
    'pay_vendor',
    'transfer_funds',
    'buy_cloud_compute',
    'execute_payment',
    'spend'
  ];

  return (async (...args: any[]) => {
    const cmdContext = args[0] as AutoGPTCommandContext;
    const cmdName = cmdContext?.command_name || args[0];
    const cmdArgs = cmdContext?.arguments || args[1] || {};

    // Check if the command being executed by the autonomous agent involves monetary spending
    if (typeof cmdName === 'string' && financialCommands.includes(cmdName)) {
      const amount = Number(cmdArgs[options.amountKey || 'amount'] || cmdArgs.cost || cmdArgs.price || 0);
      const merchant = String(cmdArgs[options.merchantKey || 'merchant'] || cmdArgs.vendor || cmdArgs.recipient || 'Unknown');
      const category = String(cmdArgs.category || 'procurement');

      const evaluation = await ghost.evaluate({
        agentId: options.agentId,
        amount,
        merchant,
        category,
      });

      if (!evaluation.approved) {
        return {
          status: 'error',
          error_code: 'GHOST_POLICY_VIOLATION',
          message: `Autonomous action '${cmdName}' prevented by Zero-Knowledge Spending Policy: ${evaluation.reason}`,
          evaluation,
          requires_human_approval: evaluation.action === 'require_approval',
        };
      }
    }

    // Safe to proceed with normal agent execution
    return originalExecute(...args);
  }) as unknown as T;
}

/**
 * AutoGPT / Eliza Plugin Definition
 */
export class GhostAgentPlugin {
  private ghost: GhostClient;
  private agentId: string;

  constructor(ghost: GhostClient, agentId: string) {
    this.ghost = ghost;
    this.agentId = agentId;
  }

  public preCommandExecution(commandName: string, args: Record<string, any>): Promise<PolicyEvaluationResult> {
    const amount = Number(args.amount || args.cost || 0);
    const merchant = String(args.merchant || args.vendor || 'Unknown');
    return this.ghost.evaluate({
      agentId: this.agentId,
      amount,
      merchant,
    });
  }
}
