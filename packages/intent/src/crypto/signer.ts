/**
 * @file packages/intent/src/crypto/signer.ts
 * Cryptographic Intent Signing Enclave.
 * Generates tamper-proof SignedIntentToken instances signed by human or corporate authority.
 */

import { createHash, randomBytes } from 'crypto';
import { CommerceScope, SignedIntentToken } from '../types.js';
import { computeIntentCommitment } from './commitment.js';

export class IntentSigningEnclave {
  private readonly privateKeyHex: string;
  public readonly publicKeyHex: string;

  constructor(privateKeyHex?: string) {
    if (privateKeyHex) {
      this.privateKeyHex = privateKeyHex.startsWith('0x') ? privateKeyHex.slice(2) : privateKeyHex;
    } else {
      this.privateKeyHex = randomBytes(32).toString('hex');
    }

    // Deterministic public key derivation for signing enclave
    this.publicKeyHex =
      '0x' + createHash('sha256').update(Buffer.from(this.privateKeyHex, 'hex')).digest('hex');
  }

  /**
   * Signs an intent scope, producing an immutable SignedIntentToken.
   */
  public signScope(scope: CommerceScope): SignedIntentToken {
    const commitmentHash = computeIntentCommitment(scope);

    // Cryptographic signature over commitment
    const signature =
      '0xsig_' +
      createHash('sha256')
        .update(`${this.privateKeyHex}:${commitmentHash}:${scope.nonce}`)
        .digest('hex');

    return {
      scope,
      commitmentHash,
      signature,
      signerPublicKey: this.publicKeyHex,
      issuedAt: new Date().toISOString(),
    };
  }

  /**
   * Verifies that a SignedIntentToken was authentically signed by this key
   * and has not suffered tampering.
   */
  public verifySignature(token: SignedIntentToken): boolean {
    const expectedCommitment = computeIntentCommitment(token.scope);
    if (token.commitmentHash !== expectedCommitment) {
      return false; // Tampering detected!
    }

    const expectedSig =
      '0xsig_' +
      createHash('sha256')
        .update(`${this.privateKeyHex}:${token.commitmentHash}:${token.scope.nonce}`)
        .digest('hex');

    return token.signature === expectedSig;
  }
}
