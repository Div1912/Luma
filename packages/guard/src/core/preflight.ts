/**
 * @file packages/guard/src/core/preflight.ts
 * Sub-5ms in-memory optimistic policy verification engine.
 * Fast-fails invalid or out-of-policy agent actions before triggering heavy ZK operations.
 */

import { LocalPolicyConfig, PreflightEvaluationResult, ToolSpendContext } from './types.js';

interface AgentSpendWindow {
  spentToday: number;
  windowStart: number;
}

export class PreflightEngine {
  private spendWindows: Map<string, AgentSpendWindow> = new Map();
  private readonly WINDOW_DURATION_MS = 86_400_000; // 24 hours

  /**
   * Reset or retrieve the rolling 24-hour spending window for an agent
   */
  private getOrResetWindow(key: string): AgentSpendWindow {
    const now = Date.now();
    let window = this.spendWindows.get(key);

    if (!window || now - window.windowStart >= this.WINDOW_DURATION_MS) {
      window = { spentToday: 0, windowStart: now };
      this.spendWindows.set(key, window);
    }

    return window;
  }

  /**
   * Evaluates spend context against local policy in sub-5ms.
   */
  public evaluate(context: ToolSpendContext, policy?: LocalPolicyConfig, agentId: string = 'default'): PreflightEvaluationResult {
    const startTime = performance.now();

    // If no policy is provided, default to standard safe bounds
    const activePolicy: LocalPolicyConfig = policy || {
      maxPerTransaction: 500,
      dailyCap: 2500,
      requiresApprovalAbove: 250,
      merchantBlocklist: ['darknet', 'sanctioned_entity', 'unknown_cash_out'],
      categoryBlocklist: ['gambling', 'illicit_goods'],
      frozen: false,
    };

    // 1. Check if policy or fleet is frozen
    if (activePolicy.frozen) {
      return {
        approved: false,
        code: 'POLICY_FROZEN',
        reason: 'The designated policy firewall is currently frozen by administrator command.',
        latencyMs: Number((performance.now() - startTime).toFixed(2)),
      };
    }

    // 2. Validate amount sanity
    if (typeof context.amount !== 'number' || isNaN(context.amount) || context.amount <= 0) {
      return {
        approved: false,
        code: 'INVALID_TOOL_PAYLOAD',
        reason: `Invalid transaction amount: ${context.amount}. Amount must be a positive number.`,
        latencyMs: Number((performance.now() - startTime).toFixed(2)),
      };
    }

    // 3. Check Category Restrictions
    if (context.category && activePolicy.categoryBlocklist && activePolicy.categoryBlocklist.length > 0) {
      const normalizedCat = context.category.toLowerCase().trim();
      const isBlocked = activePolicy.categoryBlocklist.some(
        (b) => normalizedCat.includes(b.toLowerCase()) || b.toLowerCase().includes(normalizedCat)
      );

      if (isBlocked) {
        return {
          approved: false,
          code: 'CATEGORY_RESTRICTED',
          reason: `Spend category '${context.category}' is strictly restricted under this policy.`,
          latencyMs: Number((performance.now() - startTime).toFixed(2)),
        };
      }
    }

    // 4. Check Merchant Blocklist
    if (context.merchant && activePolicy.merchantBlocklist && activePolicy.merchantBlocklist.length > 0) {
      const normalizedMerchant = context.merchant.toLowerCase().trim();
      const isBlocked = activePolicy.merchantBlocklist.some((b) => {
        const lowerB = b.toLowerCase();
        return normalizedMerchant === lowerB || normalizedMerchant.includes(lowerB);
      });

      if (isBlocked) {
        return {
          approved: false,
          code: 'MERCHANT_BLOCKED',
          reason: `Merchant '${context.merchant}' is blacklisted by organizational policy.`,
          latencyMs: Number((performance.now() - startTime).toFixed(2)),
        };
      }
    }

    // 5. Check Merchant Allowlist (if strict allowlist is enabled)
    if (activePolicy.merchantAllowlist && activePolicy.merchantAllowlist.length > 0) {
      const normalizedMerchant = context.merchant.toLowerCase().trim();
      const isAllowed = activePolicy.merchantAllowlist.some((a) => {
        const lowerA = a.toLowerCase();
        return normalizedMerchant === lowerA || normalizedMerchant.includes(lowerA);
      });

      if (!isAllowed) {
        return {
          approved: false,
          code: 'MERCHANT_NOT_ALLOWLISTED',
          reason: `Merchant '${context.merchant}' is not on the approved merchant allowlist.`,
          latencyMs: Number((performance.now() - startTime).toFixed(2)),
        };
      }
    }

    // 6. Check Per-Transaction Limit
    if (context.amount > activePolicy.maxPerTransaction) {
      return {
        approved: false,
        code: 'LIMIT_EXCEEDED',
        reason: `Amount ($${context.amount}) exceeds per-transaction limit of $${activePolicy.maxPerTransaction}.`,
        latencyMs: Number((performance.now() - startTime).toFixed(2)),
      };
    }

    // 7. Check Daily Cap
    const trackingKey = `${agentId}_${activePolicy.id || 'default'}`;
    const window = this.getOrResetWindow(trackingKey);
    const projectedDaily = window.spentToday + context.amount;

    if (projectedDaily > activePolicy.dailyCap) {
      const remaining = Math.max(0, activePolicy.dailyCap - window.spentToday);
      return {
        approved: false,
        code: 'DAILY_CAP_EXCEEDED',
        reason: `Transaction ($${context.amount}) exceeds remaining daily allowance ($${remaining.toFixed(2)}). Daily cap is $${activePolicy.dailyCap}.`,
        remainingDailyAllowance: remaining,
        latencyMs: Number((performance.now() - startTime).toFixed(2)),
      };
    }

    // 8. Check if human approval is required
    const requiresApproval =
      activePolicy.requiresApprovalAbove !== undefined &&
      context.amount >= activePolicy.requiresApprovalAbove;

    const latencyMs = Number((performance.now() - startTime).toFixed(2));

    return {
      approved: true,
      requiresHumanApproval: requiresApproval,
      remainingDailyAllowance: activePolicy.dailyCap - projectedDaily,
      latencyMs,
    };
  }

  /**
   * Records a successful spend to advance the rolling daily window.
   */
  public recordSpend(agentId: string, policyId: string = 'default', amount: number): void {
    const trackingKey = `${agentId}_${policyId}`;
    const window = this.getOrResetWindow(trackingKey);
    window.spentToday += amount;
  }

  /**
   * Resets internal tracking cache (useful for testing).
   */
  public clear(): void {
    this.spendWindows.clear();
  }
}
