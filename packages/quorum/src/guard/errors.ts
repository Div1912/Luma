/**
 * @file packages/quorum/src/guard/errors.ts
 * Standard Error types for @ghost/quorum consensus and Segregation of Duties violations.
 */

import { QuorumConsensusReceipt } from '../types.js';

export class GhostQuorumConsensusRejectedError extends Error {
  public readonly orderId: string;
  public readonly receipt: QuorumConsensusReceipt;
  public readonly failedRole?: string;
  public readonly rejectionReason: string;

  constructor(receipt: QuorumConsensusReceipt) {
    const reason = receipt.rejectionDetails?.reason || 'Multi-agent consensus rejected';
    super(`[Ghost Quorum] Consensus REJECTED for order '${receipt.orderId}': ${reason}`);
    this.name = 'GhostQuorumConsensusRejectedError';
    this.orderId = receipt.orderId;
    this.receipt = receipt;
    this.failedRole = receipt.rejectionDetails?.failedRole;
    this.rejectionReason = reason;

    Object.setPrototypeOf(this, GhostQuorumConsensusRejectedError.prototype);
  }
}
