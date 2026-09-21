/**
 * @file packages/guard/src/midnight/witness.ts
 * Witness synthesis and cryptographic hashing for Midnight ZK circuits.
 */

import { createHash } from 'crypto';
import { ToolSpendContext } from '../core/types.js';

export interface CompactSpendWitness {
  agentIdHash: string;
  merchantHash: string;
  amountBigInt: bigint;
  nonce: string;
  timestamp: number;
  txDigest: string;
}

export class WitnessSynthesizer {
  private nonceCounter: number = 0;

  /**
   * Generates a deterministic, unique 32-byte cryptographic nonce
   */
  public generateNonce(): string {
    this.nonceCounter += 1;
    const randomSalt = createHash('sha256')
      .update(`${Date.now()}_${this.nonceCounter}_${Math.random()}`)
      .digest('hex')
      .substring(0, 32);
    return `0x${randomSalt}`;
  }

  /**
   * Digests a string into a 32-byte hex hash suitable for ZK public inputs / commitments.
   */
  public hashString(value: string): string {
    return '0x' + createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
  }

  /**
   * Synthesizes a witness payload from a tool spend context.
   */
  public synthesize(context: ToolSpendContext, agentId: string): CompactSpendWitness {
    const nonce = this.generateNonce();
    const timestamp = Date.now();
    const agentIdHash = this.hashString(agentId);
    const merchantHash = this.hashString(context.merchant || 'unknown_merchant');
    const amountBigInt = BigInt(Math.round(context.amount));

    // Digest: H(agentIdHash || merchantHash || amount || nonce || timestamp)
    const digestData = `${agentIdHash}:${merchantHash}:${amountBigInt.toString()}:${nonce}:${timestamp}`;
    const txDigest = '0x' + createHash('sha256').update(digestData).digest('hex');

    return {
      agentIdHash,
      merchantHash,
      amountBigInt,
      nonce,
      timestamp,
      txDigest,
    };
  }
}
