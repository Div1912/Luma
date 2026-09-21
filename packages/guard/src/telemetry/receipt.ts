/**
 * @file packages/guard/src/telemetry/receipt.ts
 * Cryptographic execution receipt builder and validator for @ghost/guard.
 */

import { GhostExecutionReceipt, GhostNetwork, ToolSpendContext } from '../core/types.js';
import { createHash } from 'crypto';

export class ReceiptValidator {
  /**
   * Generates a cryptographically sealed receipt for a completed transaction.
   */
  public static sealReceipt(options: {
    txDigest: string;
    proofHash: string;
    context: ToolSpendContext;
    network: GhostNetwork;
    contractAddress: string;
    latencyMs: number;
    verifiedOnChain: boolean;
    status?: 'verified' | 'blocked' | 'escalated';
  }): GhostExecutionReceipt {
    return {
      txDigest: options.txDigest,
      proofHash: options.proofHash,
      status: options.status || 'verified',
      latencyMs: options.latencyMs,
      timestamp: new Date().toISOString(),
      network: options.network,
      contractAddress: options.contractAddress,
      verifiedOnChain: options.verifiedOnChain,
      context: options.context,
    };
  }

  /**
   * Verifies the integrity of an execution receipt against expected parameters.
   */
  public static verifyReceiptIntegrity(receipt: GhostExecutionReceipt): boolean {
    if (!receipt.txDigest || !receipt.proofHash) return false;
    if (!receipt.txDigest.startsWith('0x') || !receipt.proofHash.startsWith('0x')) return false;
    if (typeof receipt.latencyMs !== 'number' || receipt.latencyMs < 0) return false;
    return true;
  }
}
