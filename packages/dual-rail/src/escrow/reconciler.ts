/**
 * @file packages/dual-rail/src/escrow/reconciler.ts
 * Automated settlement and refund reconciliation engine for Midnight ZK escrow.
 * Handles partial capture adjustments and auto-refunds for expired virtual cards.
 */

import { MidnightCardEscrowClient } from './client.js';
import { EphemeralCard } from '../fiat/provider.js';

export interface ReconciliationReport {
  cardId: string;
  authorizedAmount: number;
  capturedAmount: number;
  refundedAmount: number;
  status: 'settled_full' | 'settled_partial_refund' | 'expired_refunded';
  timestamp: string;
}

export class EscrowReconciler {
  private readonly escrowClient: MidnightCardEscrowClient;

  constructor(escrowClient: MidnightCardEscrowClient) {
    this.escrowClient = escrowClient;
  }

  /**
   * Reconciles a settled fiat charge with locked Midnight escrow collateral.
   * If final capture is less than the initial authorization hold (partial capture),
   * the unspent difference is automatically refunded back to the agent's escrow balance.
   */
  public async reconcileSettlement(
    cardId: string,
    authorizedAmount: number,
    finalCapturedAmount: number,
    settlementDigest: string = `settle_${Date.now()}`
  ): Promise<ReconciliationReport> {
    if (finalCapturedAmount > authorizedAmount) {
      throw new Error(
        `[EscrowReconciler] Captured amount ($${finalCapturedAmount}) cannot exceed authorized amount ($${authorizedAmount}).`
      );
    }

    // 1. Settle actual captured amount on Midnight
    await this.escrowClient.settleCollateral(finalCapturedAmount, settlementDigest);

    // 2. If partial capture (e.g. authorized $100, captured $85), refund difference ($15)
    const refundDiff = authorizedAmount - finalCapturedAmount;
    if (refundDiff > 0) {
      await this.escrowClient.refundExpired(refundDiff);
    }

    return {
      cardId,
      authorizedAmount,
      capturedAmount: finalCapturedAmount,
      refundedAmount: refundDiff,
      status: refundDiff > 0 ? 'settled_partial_refund' : 'settled_full',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Automatically scans a list of ephemeral cards, identifies expired uncharged cards,
   * cancels them, and refunds the locked collateral back to the agent on Midnight.
   */
  public async reconcileExpiredCards(cards: EphemeralCard[]): Promise<ReconciliationReport[]> {
    const reports: ReconciliationReport[] = [];
    const now = Date.now();

    for (const card of cards) {
      if (card.status === 'active' && now > card.expiresAt) {
        card.status = 'expired';
        card.credentials.wipe();

        // Refund full unspent collateral on Midnight
        await this.escrowClient.refundExpired(card.spendingLimit);

        reports.push({
          cardId: card.id,
          authorizedAmount: card.spendingLimit,
          capturedAmount: 0,
          refundedAmount: card.spendingLimit,
          status: 'expired_refunded',
          timestamp: new Date().toISOString(),
        });
      }
    }

    return reports;
  }
}
