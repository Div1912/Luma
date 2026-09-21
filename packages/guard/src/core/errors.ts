/**
 * @file packages/guard/src/core/errors.ts
 * Enterprise-grade error hierarchy for @ghost/guard.
 */

import { PolicyViolationReasonCode, ToolSpendContext } from './types.js';

export class GhostGuardError extends Error {
  public readonly timestamp: string;

  constructor(message: string) {
    super(message);
    this.name = 'GhostGuardError';
    this.timestamp = new Date().toISOString();
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class GhostPolicyViolationError extends GhostGuardError {
  public readonly code: PolicyViolationReasonCode;
  public readonly context: ToolSpendContext;
  public readonly policyId?: string;
  public readonly latencyMs: number;

  constructor(
    message: string,
    options: {
      code: PolicyViolationReasonCode;
      context: ToolSpendContext;
      policyId?: string;
      latencyMs?: number;
    }
  ) {
    super(message);
    this.name = 'GhostPolicyViolationError';
    this.code = options.code;
    this.context = options.context;
    this.policyId = options.policyId;
    this.latencyMs = options.latencyMs || 0;
  }
}

export class GhostProofTimeoutError extends GhostGuardError {
  public readonly timeoutMs: number;
  public readonly context: ToolSpendContext;

  constructor(message: string, timeoutMs: number, context: ToolSpendContext) {
    super(message);
    this.name = 'GhostProofTimeoutError';
    this.timeoutMs = timeoutMs;
    this.context = context;
  }
}

export class GhostProverUnreachableError extends GhostGuardError {
  public readonly proofServerUrl: string;

  constructor(message: string, proofServerUrl: string) {
    super(message);
    this.name = 'GhostProverUnreachableError';
    this.proofServerUrl = proofServerUrl;
  }
}
