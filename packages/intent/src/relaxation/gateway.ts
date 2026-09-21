/**
 * @file packages/intent/src/relaxation/gateway.ts
 * Dynamic Intent Relaxation & HITL Re-Signing Gateway.
 * Handles legitimate edge cases where agent finds a superior alternative slightly outside
 * initial intent scope (e.g. flight is $815 vs $800), allowing 1-click human supervisor approval
 * without restarting the LLM reasoning chain.
 */

import { randomBytes } from 'crypto';
import { CommerceScope, ProposedCommerceAction, SignedIntentToken } from '../types.js';
import { IntentSigningEnclave } from '../crypto/signer.js';

export interface IntentDeltaProposal {
  proposalId: string;
  scopeId: string;
  agentId: string;
  originalScope: CommerceScope;
  proposedAction: ProposedCommerceAction;
  requestedBudgetDelta: number;
  newMaxBudget: number;
  requestedMerchant?: string;
  justification: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

export class IntentRelaxationGateway {
  private readonly proposals: Map<string, IntentDeltaProposal> = new Map();

  /**
   * Creates an IntentDeltaProposal when an agent tool checkout slightly exceeds intent bounds.
   */
  public createProposal(options: {
    originalScope: CommerceScope;
    proposedAction: ProposedCommerceAction;
    justification?: string;
  }): IntentDeltaProposal {
    const { originalScope, proposedAction } = options;
    const requestedBudgetDelta = Math.max(0, proposedAction.amount - originalScope.maxBudget);
    const newMaxBudget = Math.max(originalScope.maxBudget, proposedAction.amount);
    const proposalId = `prop_delta_${Date.now()}_${randomBytes(4).toString('hex')}`;

    const proposal: IntentDeltaProposal = {
      proposalId,
      scopeId: originalScope.scopeId,
      agentId: originalScope.agentId,
      originalScope,
      proposedAction,
      requestedBudgetDelta,
      newMaxBudget,
      requestedMerchant: proposedAction.merchantDomain || proposedAction.merchant,
      justification:
        options.justification ||
        `Agent identified preferred deal at ${proposedAction.merchant} for $${proposedAction.amount} (delta: +$${requestedBudgetDelta}).`,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    this.proposals.set(proposalId, proposal);
    return proposal;
  }

  /**
   * Supervisor approves the delta proposal, minting a new SignedIntentToken with extended budget and fresh nonce.
   */
  public approveProposal(
    proposalId: string,
    supervisorEnclave: IntentSigningEnclave,
    options?: { newTtlSeconds?: number }
  ): SignedIntentToken {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error(`[IntentRelaxation] Proposal '${proposalId}' not found.`);
    }

    if (proposal.status !== 'pending') {
      throw new Error(
        `[IntentRelaxation] Cannot approve proposal in '${proposal.status}' state.`
      );
    }

    const ttlSeconds = options?.newTtlSeconds || 3600; // 1 hour extension
    const updatedScope: CommerceScope = {
      ...proposal.originalScope,
      maxBudget: proposal.newMaxBudget,
      nonce: '0x' + randomBytes(32).toString('hex'), // Fresh nonce for updated scope
      validUntil: Date.now() + ttlSeconds * 1000,
      purposeSummary: `Relaxed Scope: ${proposal.originalScope.purposeSummary || ''} (+$${proposal.requestedBudgetDelta})`,
    };

    // Sign new token
    const updatedToken = supervisorEnclave.signScope(updatedScope);

    proposal.status = 'approved';
    this.proposals.set(proposalId, proposal);

    return updatedToken;
  }

  /**
   * Rejects the proposed relaxation, maintaining original strict bounds.
   */
  public rejectProposal(proposalId: string, rejectionReason: string = 'Supervisor rejected intent relaxation'): void {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error(`[IntentRelaxation] Proposal '${proposalId}' not found.`);
    }

    proposal.status = 'rejected';
    proposal.rejectionReason = rejectionReason;
    this.proposals.set(proposalId, proposal);
  }

  /**
   * Retrieves a proposal by ID.
   */
  public getProposal(proposalId: string): IntentDeltaProposal | undefined {
    return this.proposals.get(proposalId);
  }

  /**
   * Lists all pending proposals awaiting human supervisor review.
   */
  public getPendingProposals(): IntentDeltaProposal[] {
    return Array.from(this.proposals.values()).filter((p) => p.status === 'pending');
  }

  /**
   * Clears in-memory proposals for testing.
   */
  public clear(): void {
    this.proposals.clear();
  }
}
