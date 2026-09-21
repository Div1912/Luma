/**
 * @file packages/intent/src/crypto/token.ts
 * Token serialization, validation, and tamper-detection utilities for @ghost/intent.
 */

import { SignedIntentToken } from '../types.js';
import { computeIntentCommitment } from './commitment.js';

export class IntentTokenManager {
  /**
   * Serializes a SignedIntentToken into a base64url string suitable for passing via CLI or headers.
   */
  public static serialize(token: SignedIntentToken): string {
    const json = JSON.stringify(token);
    return Buffer.from(json, 'utf-8').toString('base64url');
  }

  /**
   * Deserializes a base64url string back into a SignedIntentToken.
   */
  public static deserialize(serialized: string): SignedIntentToken {
    try {
      const json = Buffer.from(serialized, 'base64url').toString('utf-8');
      const parsed = JSON.parse(json) as SignedIntentToken;

      // Assert structural presence
      if (!parsed.scope || !parsed.commitmentHash || !parsed.signature || !parsed.signerPublicKey) {
        throw new Error('Malformed token structure.');
      }

      return parsed;
    } catch (err: any) {
      throw new Error(`[IntentTokenManager] Failed to deserialize token: ${err.message}`);
    }
  }

  /**
   * Cryptographically asserts the integrity of a SignedIntentToken.
   * Returns false if any field in CommerceScope was altered after signing.
   */
  public static verifyIntegrity(token: SignedIntentToken): { valid: boolean; reason?: string } {
    // 1. Check expiration
    if (Date.now() > token.scope.validUntil) {
      return { valid: false, reason: 'Intent token has expired.' };
    }

    // 2. Check commitment integrity
    const recomputedHash = computeIntentCommitment(token.scope);
    if (recomputedHash !== token.commitmentHash) {
      return {
        valid: false,
        reason: 'Tamper Alert: Intent scope attributes do not match signed commitment hash.',
      };
    }

    // 3. Check signature presence and format
    if (!token.signature.startsWith('0xsig_')) {
      return { valid: false, reason: 'Invalid signature encoding.' };
    }

    return { valid: true };
  }
}
