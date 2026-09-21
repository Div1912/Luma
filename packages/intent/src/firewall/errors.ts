/**
 * @file packages/intent/src/firewall/errors.ts
 * Prompt-Injection Firewall Error definitions.
 * Emits rich cryptographic and contextual telemetry when an indirect prompt injection
 * or intent divergence is detected.
 */

import { CommerceScope, ProposedCommerceAction, PromptInjectionDivergenceType } from '../types.js';

export interface PromptInjectionTelemetryPayload {
  divergenceType: PromptInjectionDivergenceType;
  attemptedAction: ProposedCommerceAction;
  authorizedScope?: Partial<CommerceScope>;
  rejectionReason: string;
  timestamp: string;
}

export class GhostPromptInjectionDetectedError extends Error {
  public override readonly name = 'GhostPromptInjectionDetectedError';
  public readonly divergenceType: PromptInjectionDivergenceType;
  public readonly attemptedAction: ProposedCommerceAction;
  public readonly authorizedScope?: CommerceScope;
  public readonly rejectionReason: string;
  public readonly timestamp: string;

  constructor(options: {
    divergenceType: PromptInjectionDivergenceType;
    attemptedAction: ProposedCommerceAction;
    rejectionReason: string;
    authorizedScope?: CommerceScope;
  }) {
    const formattedMessage = `[Ghost Prompt-Injection Firewall] Security Alert (${options.divergenceType}): ${options.rejectionReason} | Attempted: ${options.attemptedAction.merchant} ($${options.attemptedAction.amount}) vs Intent: ${options.authorizedScope?.primaryCategory || 'unknown'} (Max: $${options.authorizedScope?.maxBudget || 0})`;
    super(formattedMessage);

    this.divergenceType = options.divergenceType;
    this.attemptedAction = options.attemptedAction;
    this.rejectionReason = options.rejectionReason;
    this.authorizedScope = options.authorizedScope;
    this.timestamp = new Date().toISOString();

    Object.setPrototypeOf(this, GhostPromptInjectionDetectedError.prototype);
  }

  /**
   * Returns a clean JSON representation for SIEM logging, SOC alerts, and on-chain telemetry.
   */
  public toTelemetry(): PromptInjectionTelemetryPayload {
    return {
      divergenceType: this.divergenceType,
      attemptedAction: this.attemptedAction,
      authorizedScope: this.authorizedScope
        ? {
            scopeId: this.authorizedScope.scopeId,
            agentId: this.authorizedScope.agentId,
            primaryCategory: this.authorizedScope.primaryCategory,
            maxBudget: this.authorizedScope.maxBudget,
            merchantDomainPattern: this.authorizedScope.merchantDomainPattern,
            validUntil: this.authorizedScope.validUntil,
          }
        : undefined,
      rejectionReason: this.rejectionReason,
      timestamp: this.timestamp,
    };
  }
}
