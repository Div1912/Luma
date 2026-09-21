/**
 * @file packages/quorum/src/guard/middleware.ts
 * Universal tool wrapper: withQuorumProtection.
 * Injects multi-agent M-of-N ZK consensus and Segregation of Duties (SoD)
 * into arbitrary agent tools across LangChain, Vercel AI SDK, ElizaOS, and raw async functions.
 */

import { randomBytes } from 'node:crypto';
import { QuorumCoordinator } from '../consensus/coordinator.js';
import { GhostQuorumConsensusRejectedError } from './errors.js';
import { OrderIntent, QuorumConsensusReceipt } from '../types.js';

export interface QuorumProtectionOptions {
  /** QuorumCoordinator instance */
  coordinator?: QuorumCoordinator;
  /** Minimum spend threshold that triggers mandatory multi-agent quorum (default: 1000) */
  thresholdAmount?: number;
  /** Custom extractor to derive OrderIntent from tool call arguments */
  extractOrder?: (args: any[]) => Partial<OrderIntent>;
  /** Callback fired when quorum consensus is rejected */
  onRejected?: (
    error: GhostQuorumConsensusRejectedError,
    order: OrderIntent
  ) => Promise<any> | any;
  /** Callback fired when quorum consensus is approved */
  onApproved?: (
    receipt: QuorumConsensusReceipt,
    order: OrderIntent
  ) => Promise<void> | void;
}

/**
 * Standard heuristic amount extractor.
 */
export function defaultExtractAmount(args: any[]): number {
  if (typeof args[0] === 'number') {
    return args[0];
  }

  for (const item of args) {
    if (typeof item === 'object' && item !== null) {
      const raw =
        item.amount ??
        item.cost ??
        item.price ??
        item.value ??
        item.spendAmount ??
        item.total;

      if (raw !== undefined) {
        const num = Number(raw);
        if (!isNaN(num)) return num;
      }
    }
  }

  return 0;
}

/**
 * Standard heuristic order intent extractor.
 */
export function defaultExtractOrderIntent(args: any[]): OrderIntent {
  const amount = defaultExtractAmount(args);
  const firstObj = args.find((a) => typeof a === 'object' && a !== null) || {};

  const merchantId =
    firstObj.merchantId ||
    firstObj.merchant ||
    firstObj.vendor ||
    firstObj.target ||
    firstObj.recipient ||
    'vendor_aws_cloud';

  const category =
    firstObj.category ||
    'CLOUD_INFRASTRUCTURE';

  const department =
    firstObj.department ||
    'ENG_INFRA';

  const justification =
    firstObj.justification ||
    firstObj.purpose ||
    firstObj.description ||
    'Autonomous tool execution';

  const lineItems = firstObj.lineItems || [
    {
      sku: `sku_${merchantId}_01`,
      description: justification,
      quantity: 1,
      unitPrice: amount,
      totalPrice: amount,
      category,
    },
  ];

  return {
    orderId: firstObj.orderId || `ord_${Date.now()}_${randomBytes(4).toString('hex')}`,
    amount,
    currency: (firstObj.currency || 'USD').toUpperCase(),
    merchantId,
    category,
    department,
    justification,
    lineItems,
    nonce: firstObj.nonce || '0x' + randomBytes(32).toString('hex'),
    timestamp: new Date().toISOString(),
    metadata: firstObj.metadata || {},
  };
}

/**
 * Higher-order wrapper that protects any tool or action with multi-agent M-of-N ZK Quorum.
 */
export function withQuorumProtection<T extends any>(
  tool: T,
  options?: QuorumProtectionOptions
): T {
  const coordinator = options?.coordinator || new QuorumCoordinator();
  const thresholdAmount = options?.thresholdAmount ?? 1000;

  async function executeGuardedAction(
    originalFn: (...args: any[]) => Promise<any>,
    thisArg: any,
    callArgs: any[]
  ): Promise<any> {
    const amount = defaultExtractAmount(callArgs);

    // Only enforce multi-agent quorum for purchases exceeding threshold
    if (amount >= thresholdAmount) {
      let order: OrderIntent;
      if (options?.extractOrder) {
        const extracted = options.extractOrder(callArgs);
        const defaults = defaultExtractOrderIntent(callArgs);
        order = { ...defaults, ...extracted } as OrderIntent;
      } else {
        order = defaultExtractOrderIntent(callArgs);
      }

      const receipt = await coordinator.evaluateOrder(order);

      if (receipt.status === 'REJECTED') {
        const error = new GhostQuorumConsensusRejectedError(receipt);

        if (options?.onRejected) {
          return await options.onRejected(error, order);
        }

        throw error;
      }

      if (options?.onApproved) {
        await options.onApproved(receipt, order);
      }
    }

    return await originalFn.apply(thisArg, callArgs);
  }

  // 1. Raw asynchronous function: fn(args)
  if (typeof tool === 'function') {
    const wrappedFn = async function (this: any, ...args: any[]) {
      return await executeGuardedAction(tool as any, this, args);
    };
    return wrappedFn as unknown as T;
  }

  // 2. Object with .invoke (LangChain StructuredTool)
  if (tool && typeof (tool as any).invoke === 'function') {
    const originalInvoke = (tool as any).invoke.bind(tool);
    (tool as any).invoke = async function (input: any, config?: any) {
      return await executeGuardedAction(originalInvoke, tool, [input, config]);
    };
    return tool;
  }

  // 3. Object with .execute (Vercel AI SDK Tool)
  if (tool && typeof (tool as any).execute === 'function') {
    const originalExecute = (tool as any).execute.bind(tool);
    (tool as any).execute = async function (args: any, context?: any) {
      return await executeGuardedAction(originalExecute, tool, [args, context]);
    };
    return tool;
  }

  // 4. Object with .handler (ElizaOS Action)
  if (tool && typeof (tool as any).handler === 'function') {
    const originalHandler = (tool as any).handler.bind(tool);
    (tool as any).handler = async function (runtime: any, message: any, state: any) {
      return await executeGuardedAction(originalHandler, tool, [runtime, message, state]);
    };
    return tool;
  }

  return tool;
}
