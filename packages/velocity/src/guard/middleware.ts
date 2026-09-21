/**
 * @file packages/velocity/src/guard/middleware.ts
 * Universal tool wrapper: withVelocityDampening.
 * Injects token-bucket velocity limits and statistical anomaly circuit breakers
 * into arbitrary agent tools across LangChain, Vercel AI SDK, ElizaOS, and raw async functions.
 */

import { AdaptiveVelocityDampener } from '../anomaly/dampener.js';
import { EmergencyNotificationDispatcher } from '../emergency/dispatcher.js';
import { GhostVelocityContractClient } from '../midnight/contract.js';
import { GhostVelocityCircuitTrippedError } from './errors.js';

export interface VelocityDampeningOptions {
  /** Custom dampener instance */
  dampener?: AdaptiveVelocityDampener;
  /** Emergency notification dispatcher */
  dispatcher?: EmergencyNotificationDispatcher;
  /** Optional on-chain Midnight contract client */
  contractClient?: GhostVelocityContractClient;
  /** Midnight contract address enforcing this circuit breaker */
  contractAddress?: string;
  /** Custom amount extractor from tool arguments */
  extractAmount?: (args: any[]) => number;
  /** Callback fired when circuit breaker trips */
  onTrip?: (
    error: GhostVelocityCircuitTrippedError,
    attemptedAmount: number
  ) => Promise<any> | any;
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
 * Higher-order function that wraps any tool function or object with Velocity Dampening.
 */
export function withVelocityDampening<T extends any>(
  tool: T,
  options?: VelocityDampeningOptions
): T {
  const dampener =
    options?.dampener ||
    new AdaptiveVelocityDampener({
      tokenBucketConfig: { capacity: 1000, refillRatePerSecond: 20 },
    });

  const dispatcher = options?.dispatcher || new EmergencyNotificationDispatcher();

  async function executeGuardedAction(
    originalFn: (...args: any[]) => Promise<any>,
    thisArg: any,
    callArgs: any[]
  ): Promise<any> {
    const amount = options?.extractAmount
      ? options.extractAmount(callArgs)
      : defaultExtractAmount(callArgs);

    // If amount is positive, evaluate through velocity dampener
    if (amount > 0) {
      const evalResult = dampener.evaluate(amount);

      if (!evalResult.permitted) {
        // Dispatch urgent Push/SMS/Webhook emergency notification
        const alertDossier = dispatcher.dispatchAlert({
          assessment: evalResult.assessment,
          attemptedAmount: amount,
          remainingTokens: evalResult.remainingTokens,
          contractAddress: options?.contractAddress,
        });

        const error = new GhostVelocityCircuitTrippedError({
          assessment: evalResult.assessment,
          attemptedAmount: amount,
          cooldownRemainingSeconds: evalResult.cooldownRemainingSeconds || 120,
          alertDossier,
        });

        if (options?.onTrip) {
          return await options.onTrip(error, amount);
        }

        throw error;
      }
    }

    return await originalFn.apply(thisArg, callArgs);
  }

  // Handle standard async functions
  if (typeof tool === 'function') {
    const wrapped = async function (this: any, ...args: any[]) {
      return executeGuardedAction(tool as any, this, args);
    };
    Object.defineProperty(wrapped, 'name', {
      value: (tool as any).name || 'guardedVelocityTool',
    });
    return wrapped as unknown as T;
  }

  // Handle tool objects (LangChain, Vercel AI, ElizaOS)
  if (typeof tool === 'object' && tool !== null) {
    const toolObj = tool as Record<string, any>;

    // LangChain: .invoke()
    if (typeof toolObj.invoke === 'function') {
      const origInvoke = toolObj.invoke.bind(toolObj);
      toolObj.invoke = async (...args: any[]) => {
        return executeGuardedAction(origInvoke, toolObj, args);
      };
    }

    // LangChain: ._call()
    if (typeof toolObj._call === 'function') {
      const origCall = toolObj._call.bind(toolObj);
      toolObj._call = async (...args: any[]) => {
        return executeGuardedAction(origCall, toolObj, args);
      };
    }

    // Vercel AI SDK: .execute()
    if (typeof toolObj.execute === 'function') {
      const origExec = toolObj.execute.bind(toolObj);
      toolObj.execute = async (...args: any[]) => {
        return executeGuardedAction(origExec, toolObj, args);
      };
    }

    // ElizaOS: .handler()
    if (typeof toolObj.handler === 'function') {
      const origHandler = toolObj.handler.bind(toolObj);
      toolObj.handler = async (...args: any[]) => {
        return executeGuardedAction(origHandler, toolObj, args);
      };
    }

    return tool;
  }

  return tool;
}
