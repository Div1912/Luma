/**
 * @file integrations/langchain.ts
 * Native LangChain integration for Ghost Zero-Knowledge spending and policy guardrails.
 * Allows plugging ZK compliance into any LangChain agent in 3 lines of code.
 */

import { GhostClient } from '../client.js';
import { PolicyEvaluationResult } from '../types.js';

export interface GhostLangChainToolConfig {
  agentId: string;
  name?: string;
  description?: string;
  currency?: string;
  onViolation?: (violation: PolicyEvaluationResult) => void;
}

export class GhostPolicyViolationError extends Error {
  public evaluation: PolicyEvaluationResult;
  constructor(message: string, evaluation: PolicyEvaluationResult) {
    super(message);
    this.name = 'GhostPolicyViolationError';
    this.evaluation = evaluation;
  }
}

/**
 * Native LangChain Compatible Tool for AI Agent Spending
 * 
 * Usage in 3 lines:
 * ```typescript
 * import { GhostClient, GhostSpendingTool } from '@ghost/sdk';
 * const ghost = new GhostClient({ apiKey: process.env.GHOST_API_KEY });
 * const tools = [new GhostSpendingTool(ghost, { agentId: 'procurement_bot_1' })];
 * ```
 */
export class GhostSpendingTool {
  public readonly name: string;
  public readonly description: string;
  private ghost: GhostClient;
  private agentId: string;
  private currency: string;
  private onViolation?: (violation: PolicyEvaluationResult) => void;

  constructor(ghost: GhostClient, config: GhostLangChainToolConfig) {
    this.ghost = ghost;
    this.agentId = config.agentId;
    this.name = config.name || 'ghost_spend';
    this.currency = config.currency || 'USD';
    this.onViolation = config.onViolation;
    this.description = config.description || 
      'Executes a corporate financial purchase or vendor payment under Zero-Knowledge policy guardrails. ' +
      'Input should be a JSON object with amount (number), merchant (string), and category (string).';
  }

  /**
   * LangChain tool execution handler
   */
  public async _call(input: string | { amount: number; merchant?: string; category?: string }): Promise<string> {
    let parsedInput: { amount: number; merchant?: string; category?: string };

    if (typeof input === 'string') {
      try {
        parsedInput = JSON.parse(input);
      } catch {
        const num = parseFloat(input);
        if (!isNaN(num)) {
          parsedInput = { amount: num };
        } else {
          return JSON.stringify({
            success: false,
            error: 'Invalid input format. Expected JSON with amount and merchant.'
          });
        }
      }
    } else {
      parsedInput = input;
    }

    const { amount, merchant = 'General Vendor', category = 'procurement' } = parsedInput;

    // Evaluate ZK policy compliance
    const decision = await this.ghost.evaluate({
      agentId: this.agentId,
      amount,
      merchant,
      category,
      currency: this.currency,
    });

    if (!decision.approved) {
      if (this.onViolation) this.onViolation(decision);
      return JSON.stringify({
        success: false,
        status: 'BLOCKED_BY_POLICY',
        reason: decision.reason || 'Transaction rejected by Zero-Knowledge Spending Policy.',
        actionRequired: decision.action === 'require_approval' ? 'HUMAN_APPROVAL_PENDING' : 'ABORT_TRANSACTION',
        proofCommitment: decision.proofHash || null,
        latency: `${decision.evaluationLatencyMs}ms`
      });
    }

    // Execute spend and generate verifiable ZK Proof receipt
    const execution = await this.ghost.executeSpend({
      agentId: this.agentId,
      amount,
      merchant,
      category,
      currency: this.currency,
    });

    return JSON.stringify({
      success: true,
      status: 'APPROVED_AND_VERIFIED',
      amountSpent: execution.amountSpent,
      currency: this.currency,
      remainingDailyAllowance: execution.remainingBudget,
      zkProofHash: execution.proofHash,
      onChainTxHash: execution.txHash,
      midnightNetwork: execution.network,
      contractAddress: execution.contractAddress
    });
  }

  /**
   * Alias for LangChain's invoke / call interface
   */
  public async invoke(input: any): Promise<string> {
    return this._call(input);
  }
}

/**
 * Creates a Ghost Policy Guard middleware for wrapping any LangChain custom tool
 */
export function createGhostPolicyGuard(ghost: GhostClient, agentId: string) {
  return function wrapTool<T extends (...args: any[]) => Promise<any>>(
    toolFn: T,
    options?: { extractAmount?: (...args: any[]) => number; extractMerchant?: (...args: any[]) => string }
  ): T {
    return (async (...args: any[]) => {
      const amount = options?.extractAmount ? options.extractAmount(...args) : (args[0]?.amount || 0);
      const merchant = options?.extractMerchant ? options.extractMerchant(...args) : (args[0]?.merchant || 'Unknown');

      const evaluation = await ghost.evaluate({ agentId, amount, merchant });
      if (!evaluation.approved) {
        throw new GhostPolicyViolationError(
          `[Ghost ZK Policy] Action blocked for agent ${agentId}: ${evaluation.reason}`,
          evaluation
        );
      }

      return toolFn(...args);
    }) as unknown as T;
  };
}
