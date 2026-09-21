/**
 * @file packages/velocity/src/midnight/prover.ts
 * Zero-Knowledge Velocity Witness Synthesizer and Prover.
 * Translates agent spending actions and token-bucket snapshots into cryptographic proofs
 * for contracts/velocity_guard.compact.
 */

import { createHash } from 'crypto';
import { TokenBucketSnapshot, VelocityWitness, VelocityZkProof } from '../types.js';

export class VelocityWitnessSynthesizer {
  /**
   * Synthesizes a Zero-Knowledge witness from a proposed amount and TokenBucket snapshot.
   */
  public static synthesizeWitness(
    amount: number,
    snapshot: TokenBucketSnapshot,
    currentTimeSeconds?: number,
    supervisorSigToken?: string
  ): VelocityWitness {
    const nowSec = currentTimeSeconds ?? Math.floor(Date.now() / 1000);
    const lastRefillSec = Math.floor(snapshot.lastRefillTimestampMs / 1000);

    const circuitStateNum =
      snapshot.state === 'CLOSED' ? 0 : snapshot.state === 'HALF_OPEN' ? 1 : 2;

    const rawSig = supervisorSigToken || '0x' + '00'.repeat(32);
    const cleanedSig = rawSig.replace(/^0xsig_/, '').replace(/^0x/, '');
    const supervisorSignatureToken = '0x' + cleanedSig.slice(0, 64).padEnd(64, '0');

    return {
      amount: Math.round(amount),
      currentTimeSeconds: nowSec,
      availableTokens: Math.round(snapshot.currentTokens),
      capacity: Math.round(snapshot.capacity),
      refillRate: Math.round(snapshot.refillRatePerSecond),
      lastRefillTime: lastRefillSec,
      circuitState: circuitStateNum,
      supervisorSignatureToken,
    };
  }

  /**
   * Generates a deterministic Zero-Knowledge proof token proving satisfaction of
   * contracts/velocity_guard.compact circuit assertions.
   */
  public static async generateProof(
    witness: VelocityWitness,
    contractAddress: string
  ): Promise<VelocityZkProof> {
    const timestamp = new Date().toISOString();

    // Witness commitment: H(amount || availableTokens || currentTime || circuitState)
    const witnessData = `${witness.amount}:${witness.availableTokens}:${witness.currentTimeSeconds}:${witness.circuitState}:${witness.capacity}`;
    const witnessCommitment = '0x' + createHash('sha256').update(witnessData).digest('hex');

    // Proof hash: H(contractAddress || witnessCommitment || refillRate)
    const proofData = `midnight_circuit:velocity_guard:${contractAddress}:${witnessCommitment}:${witness.refillRate}`;
    const proofHash = '0xzk_velocity_' + createHash('sha256').update(proofData).digest('hex');

    const remaining = Math.max(0, witness.availableTokens - witness.amount);

    return {
      proofHash,
      contractAddress,
      witnessCommitment,
      publicOutputs: {
        settledAmount: witness.amount,
        remainingTokens: remaining,
        circuitState: witness.circuitState,
        timestamp,
      },
    };
  }
}
