/**
 * @file packages/intent/src/guard/middleware.ts
 * Drop-in Intent-Binding Middleware: withIntentBinding.
 * Wraps arbitrary agent tools across LangChain, Vercel AI SDK, ElizaOS, and raw async functions
 * with cryptographic intent enforcement and prompt-injection firewalls.
 */

import {
  ProposedCommerceAction,
  SignedIntentToken,
} from '../types.js';
import { IntentFirewallEvaluator } from '../firewall/evaluator.js';
import { GhostPromptInjectionDetectedError } from '../firewall/errors.js';
import { IntentAttestationGenerator, ProofOfIntentAttestation } from '../telemetry/attestation.ts';
import { IntentDeltaProposal, IntentRelaxationGateway } from '../relaxation/gateway.js';
import { IntentSigningEnclave } from '../crypto/signer.js';

export interface IntentBindingOptions {
  /** Signed human intent token governing the agent's actions */
  intentToken: SignedIntentToken | string;
  /** Custom firewall evaluator instance (optional) */
  evaluator?: IntentFirewallEvaluator;
  /** Human or enterprise signing enclave for attestations (optional) */
  supervisorEnclave?: IntentSigningEnclave;
  /** Relaxation gateway for managing HITL delta approvals */
  relaxationGateway?: IntentRelaxationGateway;
  /** Callback fired when an intent violation or prompt injection is detected */
  onIntentViolation?: (
    error: GhostPromptInjectionDetectedError,
    action: ProposedCommerceAction
  ) => Promise<any> | any;
  /** Callback fired when an action slightly exceeds budget and requests human relaxation */
  onIntentRelaxationRequested?: (
    proposal: IntentDeltaProposal
  ) => Promise<SignedIntentToken | null>;
  /** Custom extractor to extract ProposedCommerceAction from arbitrary tool arguments */
  extractAction?: (args: any[]) => Promise<ProposedCommerceAction> | ProposedCommerceAction;
  /** If true (default), attaches a sealed ProofOfIntentAttestation to the tool return value */
  emitAttestation?: boolean;
}

/**
 * Standard heuristic argument extractor that inspects tool arguments.
 */
export function defaultExtractAction(args: any[]): ProposedCommerceAction {
  let amount = 0;
  let currency = 'USD';
  let merchant = 'Unknown Merchant';
  let category: string | undefined;
  let merchantDomain: string | undefined;
  let orderDescription: string | undefined;
  let rawPromptSnippet: string | undefined;

  if (typeof args[0] === 'number') {
    amount = args[0];
    if (typeof args[1] === 'string') merchant = args[1];
    if (typeof args[2] === 'string') category = args[2];
  } else {
    for (const item of args) {
      if (typeof item === 'object' && item !== null) {
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

        const rawMerchant =
          item.merchant ??
          item.vendor ??
          item.recipient ??
          item.to ??
          item.payee ??
          item.target ??
          item.merchantDomain;

        if (rawMerchant !== undefined && merchant === 'Unknown Merchant') {
          merchant = String(rawMerchant);
        }

        if (item.currency) {
          currency = String(item.currency).toUpperCase();
        }

        if (item.category) {
          category = String(item.category);
        }

        if (item.merchantDomain) {
          merchantDomain = String(item.merchantDomain);
        }

        const rawDesc = item.description ?? item.orderDescription ?? item.purpose ?? item.reason;
        if (rawDesc && !orderDescription) {
          orderDescription = String(rawDesc);
        }

        const rawSnippet = item.rawPromptSnippet ?? item.prompt ?? item.invoiceHtml;
        if (rawSnippet && !rawPromptSnippet) {
          rawPromptSnippet = String(rawSnippet);
        }
      }
    }
  }

  return {
    amount,
    currency,
    merchant,
    category,
    merchantDomain: merchantDomain || merchant,
    orderDescription,
    rawPromptSnippet,
  };
}

/**
 * Higher-order function that wraps any tool function or object with Intent-Binding.
 */
export function withIntentBinding<T extends any>(tool: T, options: IntentBindingOptions): T {
  const evaluator = options.evaluator || new IntentFirewallEvaluator();
  const relaxationGateway = options.relaxationGateway || new IntentRelaxationGateway();
  const supervisorEnclave = options.supervisorEnclave || new IntentSigningEnclave();
  const emitAttestation = options.emitAttestation !== false;

  let currentToken: SignedIntentToken | string = options.intentToken;

  async function executeGuardedAction(
    originalFn: (...args: any[]) => Promise<any>,
    thisArg: any,
    callArgs: any[]
  ): Promise<any> {
    // 1. Extract proposed commerce action
    const action: ProposedCommerceAction = options.extractAction
      ? await options.extractAction(callArgs)
      : defaultExtractAction(callArgs);

    // 2. Evaluate against Intent Firewall
    let evalResult;
    try {
      evalResult = await evaluator.evaluate(action, currentToken);
    } catch (err: any) {
      if (err instanceof GhostPromptInjectionDetectedError) {
        // Check for Dynamic Intent Relaxation (e.g. Budget Escalation with HITL handler)
        if (
          err.divergenceType === 'BUDGET_ESCALATION' &&
          options.onIntentRelaxationRequested &&
          err.authorizedScope
        ) {
          const proposal = relaxationGateway.createProposal({
            originalScope: err.authorizedScope,
            proposedAction: action,
          });

          const relaxedToken = await options.onIntentRelaxationRequested(proposal);
          if (relaxedToken) {
            currentToken = relaxedToken;
            // Retry evaluation with newly signed relaxed token
            evalResult = await evaluator.evaluate(action, currentToken);
          }
        }

        if (!evalResult) {
          if (options.onIntentViolation) {
            return await options.onIntentViolation(err, action);
          }
          throw err;
        }
      } else {
        throw err;
      }
    }

    // 3. Execute original underlying tool function
    const result = await originalFn.apply(thisArg, callArgs);

    // 4. Generate Sealed Proof-of-Intent Attestation
    if (emitAttestation && evalResult) {
      const attestation = IntentAttestationGenerator.generateAttestation(
        evalResult.receipt,
        action,
        supervisorEnclave,
        result
      );

      if (typeof result === 'object' && result !== null) {
        result._ghostAttestation = attestation;
      }
    }

    return result;
  }

  // Handle standard async functions
  if (typeof tool === 'function') {
    const wrapped = async function (this: any, ...args: any[]) {
      return executeGuardedAction(tool as any, this, args);
    };
    Object.defineProperty(wrapped, 'name', { value: (tool as any).name || 'guardedIntentTool' });
    return wrapped as unknown as T;
  }

  // Handle LangChain tools
  if (typeof tool === 'object' && tool !== null) {
    const toolObj = tool as Record<string, any>;

    // LangChain: .invoke(input)
    if (typeof toolObj.invoke === 'function') {
      const origInvoke = toolObj.invoke.bind(toolObj);
      toolObj.invoke = async (...args: any[]) => {
        return executeGuardedAction(origInvoke, toolObj, args);
      };
    }

    // LangChain: ._call(arg) / .call(arg)
    if (typeof toolObj._call === 'function') {
      const origCall = toolObj._call.bind(toolObj);
      toolObj._call = async (...args: any[]) => {
        return executeGuardedAction(origCall, toolObj, args);
      };
    }

    // Vercel AI SDK: .execute(args)
    if (typeof toolObj.execute === 'function') {
      const origExec = toolObj.execute.bind(toolObj);
      toolObj.execute = async (...args: any[]) => {
        return executeGuardedAction(origExec, toolObj, args);
      };
    }

    // ElizaOS: .handler(runtime, message, state)
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
