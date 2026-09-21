/**
 * @file packages/guard/src/core/interceptor.ts
 * Universal tool interceptor and proxy engine for @ghost/guard.
 * Wraps arbitrary agent tools across LangChain, Vercel AI SDK, ElizaOS, and raw async functions.
 */

import { randomBytes } from 'node:crypto';
import { GhostGuardConfig, ToolSpendContext } from './types.js';
import { GhostPolicyViolationError } from './errors.js';
import { PreflightEngine } from './preflight.js';
import { WitnessSynthesizer } from '../midnight/witness.js';
import { HeadlessMidnightWallet } from '../midnight/wallet.js';
import { HeadlessMidnightProver } from '../midnight/prover.js';

import { VelocityCircuitBreaker } from './circuit-breaker.js';
import { ApprovalGateway } from '../hitl/deferred.js';
import { TelemetryLogger } from '../telemetry/logger.js';
import { IntentFirewallEvaluator, GhostPromptInjectionDetectedError } from '../../../intent/src/index.js';

export const globalPreflight = new PreflightEngine();
export const globalWitness = new WitnessSynthesizer();
export const globalCircuitBreaker = new VelocityCircuitBreaker();
export const globalApprovalGateway = new ApprovalGateway();
export const globalLogger = new TelemetryLogger();

export function resetGlobalPreflight(): void {
  globalPreflight.clear();
  globalCircuitBreaker.reset();
  globalApprovalGateway.clear();
  globalLogger.clear();
}

/**
 * Heuristic argument extractor that inspects standard tool payload signatures.
 */
export function defaultExtractContext(args: any[]): ToolSpendContext {
  let amount = 0;
  let currency = 'USD';
  let merchant = 'Unknown Merchant';
  let category = 'procurement';
  let purpose: string | undefined;
  let metadata: Record<string, unknown> | undefined;

  // Case 1: Direct positional arguments: (amount, merchant, category)
  if (typeof args[0] === 'number') {
    amount = args[0];
    if (typeof args[1] === 'string') merchant = args[1];
    if (typeof args[2] === 'string') category = args[2];
  } else {
    // Case 2: Object arguments across argument list (e.g. ElizaOS (runtime, message, state))
    for (const item of args) {
      if (typeof item === 'object' && item !== null) {
        // Find amount
        const rawAmount =
          item.amount ??
          item.cost ??
          item.price ??
          item.value ??
          item.spendAmount ??
          item.total;

        if (rawAmount !== undefined && !amount) {
          amount = Number(rawAmount);
        }

        // Find merchant
        const rawMerchant =
          item.merchant ??
          item.vendor ??
          item.recipient ??
          item.to ??
          item.payee ??
          item.target;

        if (rawMerchant !== undefined && merchant === 'Unknown Merchant') {
          merchant = String(rawMerchant);
        }

        // Find currency
        if (item.currency && currency === 'USD') {
          currency = String(item.currency).toUpperCase();
        }

        // Find category
        if (item.category && category === 'procurement') {
          category = String(item.category);
        }

        // Find purpose
        if (!purpose && (item.purpose || item.description || item.reason)) {
          purpose = String(item.purpose || item.description || item.reason);
        }

        if (!metadata) {
          metadata = { ...item };
        }
      }
    }
  }

  return {
    amount,
    currency,
    merchant,
    category,
    purpose,
    metadata,
  };
}

/**
 * Higher-order wrapper that injects Zero-Knowledge spending guardrails into any AI agent tool.
 *
 * @param tool The raw async function, LangChain tool, or Vercel AI tool to guard.
 * @param config The Ghost Guard configuration and policy rules.
 */
export function withGhostGuard<T extends any>(tool: T, config: GhostGuardConfig = {}): T {
  const agentId = config.agentId || 'ghost_autonomous_node_1';
  const prover = new HeadlessMidnightProver({
    network: config.network,
    contractAddress: config.contractAddress,
    proofServerUrl: config.proofServerUrl,
    indexerUrl: config.indexerUrl,
    timeoutMs: config.timeoutMs,
  });

  const wallet = new HeadlessMidnightWallet({
    privateKey: config.agentPrivateKey,
    network: config.network,
  });

  // Core guarded execution pipeline
  async function executeGuardedPipeline(
    originalFn: (...args: any[]) => Promise<any>,
    thisArg: any,
    callArgs: any[]
  ): Promise<any> {
    // 1. Extract and normalize spend context
    let context: ToolSpendContext;
    if (config.extractContext) {
      const extracted = await config.extractContext(callArgs);
      const defaults = defaultExtractContext(callArgs);
      context = { ...defaults, ...extracted } as ToolSpendContext;
    } else {
      context = defaultExtractContext(callArgs);
    }

    // 2. Velocity Circuit Breaker Check (Loop & Anomaly Protection)
    globalCircuitBreaker.recordAndAssert(agentId, context);

    // 2.5 Cryptographic Intent-Binding Firewall Check (if intentToken configured)
    if (config.intentToken) {
      const intentEvaluator = new IntentFirewallEvaluator();
      try {
        await intentEvaluator.evaluate(
          {
            amount: context.amount,
            currency: context.currency,
            merchant: context.merchant,
            category: context.category,
            orderDescription: context.purpose,
          },
          config.intentToken
        );
      } catch (err: any) {
        if (err instanceof GhostPromptInjectionDetectedError) {
          globalCircuitBreaker.trip();
          globalLogger.log('error', 'prompt_injection_blocked', {
            agentId,
            context,
            error: `Prompt Injection (${err.divergenceType}): ${err.rejectionReason}`,
          });

          if (config.onIntentViolation) {
            return await config.onIntentViolation(err, context);
          }
          if (config.onBlock) {
            return await config.onBlock(err, context);
          }
          throw err;
        }
        throw err;
      }
    }

    // 2.6 Dynamic Token-Bucket & EWMA Anomaly Velocity Dampener (if configured)
    if (config.velocityDampener && context.amount > 0) {
      const velResult = config.velocityDampener.evaluate(context.amount);
      if (!velResult.permitted) {
        globalCircuitBreaker.trip();
        globalLogger.log('error', 'velocity_anomaly_blocked', {
          agentId,
          context,
          error: `Velocity Anomaly (${velResult.assessment.anomalyType || 'BURST'}): ${velResult.reason}`,
        });

        const error = new GhostPolicyViolationError(
          `[Ghost Guard] Velocity Anomaly Blocked: ${velResult.reason}`,
          {
            code: 'POLICY_FROZEN',
            context,
            policyId: 'velocity_dampener_active',
          }
        );

        if (config.onVelocityTripped) {
          return await config.onVelocityTripped(error, context);
        }
        if (config.onBlock) {
          return await config.onBlock(error, context);
        }
        throw error;
      }
    }

    // 2.7 Multi-Agent Segregation of Duties (M-of-N ZK Quorum) for High-Value Spends
    const quorumThreshold = config.quorumThresholdAmount ?? 1000;
    if (config.quorumCoordinator && context.amount >= quorumThreshold) {
      const orderIntent = {
        orderId: (context.metadata?.orderId as string) || `po_${agentId}_${Date.now()}`,
        amount: context.amount,
        currency: context.currency || 'USD',
        merchantId: context.merchant || 'vendor_aws_cloud',
        category: context.category || 'CLOUD_INFRASTRUCTURE',
        department: (context.metadata?.department as string) || 'ENG_INFRA',
        justification: context.purpose || 'Guarded autonomous agent requisition',
        lineItems: (context.metadata?.lineItems as any[]) || [
          {
            sku: `sku_${context.merchant || 'item'}_01`,
            description: context.purpose || 'Autonomous purchase',
            quantity: 1,
            unitPrice: context.amount,
            totalPrice: context.amount,
            category: context.category || 'CLOUD_INFRASTRUCTURE',
          },
        ],
        nonce: (context.metadata?.nonce as string) || '0x' + randomBytes(32).toString('hex'),
        timestamp: new Date().toISOString(),
        metadata: context.metadata,
      };

      const quorumReceipt = await config.quorumCoordinator.evaluateOrder(orderIntent);
      if (quorumReceipt.status === 'REJECTED') {
        globalLogger.log('error', 'quorum_consensus_rejected', {
          agentId,
          context,
          error: `Multi-Agent Quorum Rejection (${quorumReceipt.rejectionDetails?.failedRole || 'SoD'}): ${quorumReceipt.rejectionDetails?.reason}`,
        });

        const error = new GhostPolicyViolationError(
          `[Ghost Guard] Multi-Agent Quorum REJECTED: ${quorumReceipt.rejectionDetails?.reason || 'Consensus not achieved'}`,
          {
            code: 'QUORUM_REJECTED',
            context,
            policyId: 'multi_agent_quorum_active',
          }
        );

        if (config.onQuorumRejected) {
          return await config.onQuorumRejected(error, context);
        }
        if (config.onBlock) {
          return await config.onBlock(error, context);
        }
        throw error;
      }

      // Quorum approved: Attach consensus receipt to context metadata
      context.metadata = {
        ...(context.metadata || {}),
        quorumReceipt,
      };
    }

    // 3. Sub-5ms Optimistic In-Memory Preflight Check
    const preflight = globalPreflight.evaluate(context, config.localPolicy, agentId);

    if (!preflight.approved) {
      const violationError = new GhostPolicyViolationError(
        `[Ghost Guard] Action Blocked: ${preflight.reason}`,
        {
          code: preflight.code || 'LIMIT_EXCEEDED',
          context,
          policyId: config.policyId || config.localPolicy?.id,
          latencyMs: preflight.latencyMs,
        }
      );

      globalLogger.log('warn', 'policy_violation_blocked', {
        agentId,
        policyId: config.policyId,
        context,
        error: violationError.message,
      });

      if (config.onBlock) {
        return await config.onBlock(violationError, context);
      }

      throw violationError;
    }

    // 4. Asynchronous Human-in-the-Loop Escalation (if required by threshold)
    if (preflight.requiresHumanApproval) {
      globalLogger.log('info', 'human_approval_required', {
        agentId,
        policyId: config.policyId,
        context,
      });

      // Suspends agent execution cleanly until human signs off or timeout expires
      await globalApprovalGateway.requestApproval(agentId, context, {
        policyId: config.policyId,
        timeoutMs: config.timeoutMs,
      });
    }

    // 5. Synthesize Midnight ZK Witness
    const witness = globalWitness.synthesize(context, agentId);

    // 6. Generate Proof via Headless Midnight Prover
    const receipt = await prover.proveSpend(witness, wallet, context);

    // 7. Advance in-memory daily spend tracking upon successful proof
    globalPreflight.recordSpend(agentId, config.policyId || 'default', context.amount);

    // 8. Log structured enterprise audit receipt
    globalLogger.audit('tool_execution_verified', receipt, agentId);

    // 9. Fire audit callback if registered
    if (config.onProofGenerated) {
      Promise.resolve(config.onProofGenerated(receipt)).catch((err) =>
        console.error('[Ghost Guard] onProofGenerated callback error:', err)
      );
    }

    // 10. Safe to execute original tool logic
    return await originalFn.apply(thisArg, callArgs);
  }

  // --- Framework Introspection & Adapter Wrapping ---

  // 1. Vercel AI SDK Tool: object with `execute` function and `parameters`
  if (
    typeof tool === 'object' &&
    tool !== null &&
    'execute' in tool &&
    typeof (tool as any).execute === 'function'
  ) {
    const originalExecute = (tool as any).execute;
    return {
      ...tool,
      execute: async (...args: any[]) => executeGuardedPipeline(originalExecute, tool, args),
    } as unknown as T;
  }

  // 2. LangChain Tool: object with `invoke` or `call`
  if (
    typeof tool === 'object' &&
    tool !== null &&
    (typeof (tool as any).invoke === 'function' || typeof (tool as any).call === 'function')
  ) {
    const targetTool = tool as any;
    const originalInvoke = targetTool.invoke || targetTool.call;

    // Wrap both invoke and call if present
    if (targetTool.invoke) {
      targetTool.invoke = async (...args: any[]) => executeGuardedPipeline(originalInvoke, targetTool, args);
    }
    if (targetTool.call) {
      targetTool.call = async (...args: any[]) => executeGuardedPipeline(originalInvoke, targetTool, args);
    }

    return targetTool as T;
  }

  // 3. ElizaOS Action: object with `handler` and `validate`
  if (
    typeof tool === 'object' &&
    tool !== null &&
    'handler' in tool &&
    typeof (tool as any).handler === 'function'
  ) {
    const targetAction = tool as any;
    const originalHandler = targetAction.handler;

    targetAction.handler = async (...args: any[]) =>
      executeGuardedPipeline(originalHandler, targetAction, args);

    return targetAction as T;
  }

  // 4. Raw Async Function / Callable Proxy
  if (typeof tool === 'function') {
    return (async (...args: any[]) => {
      return executeGuardedPipeline(tool as any, null, args);
    }) as unknown as T;
  }

  return tool;
}
