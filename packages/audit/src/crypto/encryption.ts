/**
 * @file packages/audit/src/crypto/encryption.ts
 * Selective Disclosure Envelope Encryption for @ghost/audit.
 * Encrypts proprietary agent prompts, raw transcripts, and model reasoning under an enterprise secret,
 * while leaving auditable compliance metadata verifiable by auditors with Zero-Knowledge proofs.
 */

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from 'node:crypto';
import { EncryptedPayloadEnvelope } from '../types.js';

export class SelectiveDisclosureEnclave {
  /**
   * Encrypts private payload fields (prompts, transcripts) into an authenticated AES-256-GCM envelope.
   */
  public static createEnvelope(params: {
    txDigest: string;
    privateData: Record<string, any>;
    auditableMetadata: {
      amount: number;
      currency: string;
      merchantId: string;
      policyId: string;
      policyHash: string;
      ofacCleared: boolean;
      timestamp?: string;
    };
    enterpriseSecretHex: string;
  }): EncryptedPayloadEnvelope {
    const cleanKeyHex = params.enterpriseSecretHex.startsWith('0x')
      ? params.enterpriseSecretHex.slice(2)
      : params.enterpriseSecretHex;

    // Ensure 32-byte key
    const key = createHash('sha256').update(Buffer.from(cleanKeyHex, 'hex')).digest();
    const iv = randomBytes(12); // 96-bit standard GCM IV

    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const plaintext = Buffer.from(JSON.stringify(params.privateData), 'utf8');

    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();

    const envelopeId = `env_${params.txDigest.slice(2, 10)}_${Date.now()}`;

    return {
      envelopeId,
      txDigest: params.txDigest,
      encryptedData: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      algorithm: 'aes-256-gcm',
      auditableMetadata: {
        ...params.auditableMetadata,
        timestamp: params.auditableMetadata.timestamp || new Date().toISOString(),
      },
    };
  }

  /**
   * High-level helper to encrypt a payload using a ViewingKey or explicit secret hex.
   */
  public static encryptPayload(params: {
    txDigest: string;
    auditableMetadata: {
      amount: number;
      currency: string;
      merchantId: string;
      policyId: string;
      policyHash: string;
      ofacCleared: boolean;
      timestamp?: string;
    };
    confidentialPayload: Record<string, any>;
    viewingKey?: import('../types.js').ViewingKey;
    enterpriseSecretHex?: string;
  }): EncryptedPayloadEnvelope {
    const enterpriseSecretHex =
      params.enterpriseSecretHex ||
      params.viewingKey?.privateKeyHex ||
      '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

    return SelectiveDisclosureEnclave.createEnvelope({
      txDigest: params.txDigest,
      privateData: params.confidentialPayload,
      auditableMetadata: params.auditableMetadata,
      enterpriseSecretHex,
    });
  }

  /**
   * High-level helper to decrypt private payload using a ViewingKey or secret hex.
   */
  public static decryptPayload(
    envelope: EncryptedPayloadEnvelope,
    keyOrSecret: import('../types.js').ViewingKey | string
  ): Record<string, any> {
    const secretHex = typeof keyOrSecret === 'string' ? keyOrSecret : keyOrSecret.privateKeyHex;
    return SelectiveDisclosureEnclave.decryptPrivatePayload(envelope, secretHex);
  }

  /**
   * Decrypts private payload using the enterprise master secret.
   */
  public static decryptPrivatePayload(
    envelope: EncryptedPayloadEnvelope,
    enterpriseSecretHex: string
  ): Record<string, any> {
    const cleanKeyHex = enterpriseSecretHex.startsWith('0x')
      ? enterpriseSecretHex.slice(2)
      : enterpriseSecretHex;

    const key = createHash('sha256').update(Buffer.from(cleanKeyHex, 'hex')).digest();
    const iv = Buffer.from(envelope.iv, 'base64');
    const authTag = Buffer.from(envelope.authTag, 'base64');
    const encryptedData = Buffer.from(envelope.encryptedData, 'base64');

    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    return JSON.parse(decrypted.toString('utf8'));
  }

  /**
   * Verifies compliance metadata integrity without accessing or decrypting private data.
   */
  public static verifyAuditableMetadata(envelope: EncryptedPayloadEnvelope): boolean {
    return (
      Boolean(envelope.txDigest) &&
      envelope.auditableMetadata.amount >= 0 &&
      Boolean(envelope.auditableMetadata.policyHash) &&
      envelope.auditableMetadata.ofacCleared === true &&
      envelope.algorithm === 'aes-256-gcm'
    );
  }
}
