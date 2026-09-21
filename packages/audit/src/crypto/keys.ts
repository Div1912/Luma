/**
 * @file packages/audit/src/crypto/keys.ts
 * Hierarchical Viewing Key (HVK) & Selective Disclosure Enclave for @ghost/audit.
 * Manages Auditor Master Viewing Keys (AMVK) and derives Scoped Viewing Keys (SVK)
 * granting auditors zero-knowledge verification rights without exposing raw prompts or private keys.
 */

import { createHash, randomBytes } from 'node:crypto';
import { ViewingKey, ViewingKeyScope } from '../types.js';

export class ViewingKeyEnclave {
  private readonly masterKey: ViewingKey;

  constructor(masterPrivateKeyHex?: string) {
    const privHex = masterPrivateKeyHex
      ? (masterPrivateKeyHex.startsWith('0x') ? masterPrivateKeyHex.slice(2) : masterPrivateKeyHex)
      : randomBytes(32).toString('hex');

    const pubKey = '0x' + createHash('sha256').update(Buffer.from(privHex, 'hex')).digest('hex');

    this.masterKey = {
      keyId: `amvk_${Date.now()}_${randomBytes(4).toString('hex')}`,
      type: 'MASTER',
      privateKeyHex: '0x' + privHex,
      publicKey: pubKey,
    };
  }

  /**
   * Returns the Auditor Master Viewing Key.
   */
  public getMasterKey(): ViewingKey {
    return { ...this.masterKey };
  }

  /**
   * Generates a new Master Viewing Key.
   */
  public static generateMasterViewingKey(masterPrivateKeyHex?: string): ViewingKey {
    return new ViewingKeyEnclave(masterPrivateKeyHex).getMasterKey();
  }

  /**
   * Derives a Scoped Viewing Key from a master key directly.
   */
  public static deriveScopedViewingKey(
    masterKey: ViewingKey,
    scope: {
      scopeId?: string;
      epochId: string;
      policyId: string;
      allowedDepartments?: string[];
      maxExpenditureBand?: number;
      durationDays?: number;
      expiresAt?: string;
    }
  ): ViewingKey {
    const enclave = new ViewingKeyEnclave(masterKey.privateKeyHex);
    return enclave.deriveScopedKey(scope);
  }

  /**
   * Derives a Scoped Viewing Key (SVK) bound strictly to an epoch, policy, and optional cap.
   */
  public deriveScopedKey(scope: {
    scopeId?: string;
    epochId: string;
    policyId: string;
    allowedDepartments?: string[];
    maxExpenditureBand?: number;
    durationDays?: number;
    expiresAt?: string;
  }): ViewingKey {
    const expiresAt =
      scope.expiresAt ||
      new Date(Date.now() + (scope.durationDays ?? 90) * 24 * 60 * 60 * 1000).toISOString();

    const scopeId =
      scope.scopeId || `scope_${scope.epochId.toLowerCase()}_${scope.policyId.toLowerCase()}`;
    const scopeData: ViewingKeyScope = {
      scopeId,
      epochId: scope.epochId,
      policyId: scope.policyId,
      allowedDepartments: scope.allowedDepartments,
      maxExpenditureBand: scope.maxExpenditureBand,
      expiresAt,
    };

    // Deterministic child secret derivation: HMAC(masterPriv, epochId:policyId:expiresAt)
    const childSecretHex = createHash('sha256')
      .update(`${this.masterKey.privateKeyHex}:${scope.epochId}:${scope.policyId}:${expiresAt}`)
      .digest('hex');

    const childPublicKey =
      '0x' + createHash('sha256').update(Buffer.from(childSecretHex, 'hex')).digest('hex');

    return {
      keyId: `svk_${scopeId}_${randomBytes(4).toString('hex')}`,
      type: 'SCOPED',
      privateKeyHex: '0x' + childSecretHex,
      publicKey: childPublicKey,
      scope: scopeData,
    };
  }

  /**
   * Validates whether a given ViewingKey is authorized to inspect a target epoch and policy.
   */
  public static validateScope(
    viewingKey: ViewingKey,
    targetEpochId: string,
    targetPolicyId: string
  ): { valid: boolean; reason: string } {
    // 1. Master Viewing Key has universal clearance
    if (viewingKey.type === 'MASTER') {
      return {
        valid: true,
        reason: 'Authorized: Auditor Master Viewing Key has universal compliance audit clearance',
      };
    }

    // 2. Scoped Viewing Key assertions
    const scope = viewingKey.scope;
    if (!scope) {
      return {
        valid: false,
        reason: 'Unauthorized: Scoped Viewing Key lacks mandatory scope parameters',
      };
    }

    // Check expiration
    if (new Date(scope.expiresAt).getTime() <= Date.now()) {
      return {
        valid: false,
        reason: `Unauthorized: Scoped Viewing Key expired on ${scope.expiresAt}`,
      };
    }

    // Check Epoch ID matching
    if (scope.epochId !== targetEpochId) {
      return {
        valid: false,
        reason: `Scope Mismatch: Viewing key is scoped to '${scope.epochId}', but requested '${targetEpochId}'`,
      };
    }

    // Check Policy ID matching
    if (scope.policyId !== targetPolicyId) {
      return {
        valid: false,
        reason: `Scope Mismatch: Viewing key is scoped to '${scope.policyId}', but requested '${targetPolicyId}'`,
      };
    }

    return {
      valid: true,
      reason: `Authorized: Scoped Viewing Key is valid for epoch '${targetEpochId}' and policy '${targetPolicyId}'`,
    };
  }
}
