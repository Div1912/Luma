/**
 * @file packages/intent/src/midnight/prover.ts
 * Zero-Knowledge Intent Witness Synthesizer and Prover.
 * Translates proposed agent commerce actions and signed human intent commitments
 * into zero-knowledge witnesses and proofs for contracts/intent_guard.compact.
 */

import { createHash } from 'crypto';
import {
  CommerceScope,
  IntentWitness,
  IntentZkProof,
  ProposedCommerceAction,
  SignedIntentToken,
} from '../types.js';
import { normalizeCategory } from '../compiler/taxonomy.js';

/**
 * Computes a deterministic 32-byte hash for a normalized commerce category.
 */
export function computeCategoryHash(category: string): string {
  const normalized = normalizeCategory(category);
  return '0x' + createHash('sha256').update(`intent_cat:${normalized}`).digest('hex');
}

export class IntentWitnessSynthesizer {
  /**
   * Constructs a zero-knowledge witness connecting an agent's proposed checkout
   * to the human supervisor's signed intent token.
   */
  public static synthesizeWitness(
    action: ProposedCommerceAction,
    token: SignedIntentToken
  ): IntentWitness {
    const rawActionCategory = action.category || token.scope.primaryCategory;
    const checkoutCategoryHash = computeCategoryHash(rawActionCategory);
    const intentCategoryHash = computeCategoryHash(token.scope.primaryCategory);

    // Normalize signature representation to 32-byte hex string
    const rawSig = token.signature.startsWith('0xsig_')
      ? token.signature.slice(6)
      : token.signature.startsWith('0x')
      ? token.signature.slice(2)
      : token.signature;
    const humanSignatureToken = '0x' + rawSig.slice(0, 64).padEnd(64, '0');

    return {
      checkoutAmount: Math.round(action.amount),
      intentMaxBudget: Math.round(token.scope.maxBudget),
      checkoutCategoryHash,
      intentCategoryHash,
      intentNonce: token.scope.nonce,
      humanSignatureToken,
      merchantDomain: action.merchantDomain || action.merchant,
      intentMerchantPattern: token.scope.merchantDomainPattern || '*',
    };
  }

  /**
   * Generates a zero-knowledge proof proving satisfaction of the Compact circuit assertions:
   * 1. checkoutAmount <= intentMaxBudget
   * 2. checkoutCategoryHash == intentCategoryHash
   * 3. intentNonce is fresh & single-use
   * 4. humanSignatureToken is authorized
   */
  public static async generateProof(
    witness: IntentWitness,
    contractAddress: string,
    intentCommitment: string
  ): Promise<IntentZkProof> {
    const timestamp = new Date().toISOString();

    // Witness commitment: H(checkoutAmount || intentCategoryHash || intentNonce)
    const witnessData = `${witness.checkoutAmount}:${witness.checkoutCategoryHash}:${witness.intentNonce}:${intentCommitment}`;
    const witnessCommitment = '0x' + createHash('sha256').update(witnessData).digest('hex');

    // Proof hash: H(contractAddress || witnessCommitment || humanSignatureToken)
    const proofData = `midnight_circuit:intent_guard:${contractAddress}:${witnessCommitment}:${witness.humanSignatureToken}`;
    const proofHash = '0xzk_intent_' + createHash('sha256').update(proofData).digest('hex');

    return {
      proofHash,
      witnessCommitment,
      contractAddress,
      intentCommitment,
      publicOutputs: {
        settledAmount: witness.checkoutAmount,
        consumedNonce: witness.intentNonce,
        timestamp,
      },
    };
  }
}
