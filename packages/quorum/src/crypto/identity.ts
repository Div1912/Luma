/**
 * @file packages/quorum/src/crypto/identity.ts
 * Asymmetric Ed25519 Agent Identity & Role Attestation Enclave for @ghost/quorum.
 * Enforces cryptographic non-repudiation, role-bound signing boundaries,
 * and produces mathematically verifiable digital attestations.
 */

import {
  generateKeyPairSync,
  sign,
  verify,
  createPublicKey,
  createPrivateKey,
  KeyObject,
  randomBytes,
} from 'node:crypto';
import { AgentRole, RoleBitmask, RoleAttestation } from '../types.js';
import { computeAttestationDigest } from './digest.js';

export class AgentIdentity {
  public readonly agentId: string;
  public readonly role: AgentRole;
  public readonly roleMask: number;
  public readonly publicKey: string;
  private readonly privateKeyObj: KeyObject;
  private readonly publicKeyObj: KeyObject;
  public readonly privateKeyHex: string;

  constructor(agentId: string, role: AgentRole, privateKeyDerHex?: string) {
    this.agentId = agentId;
    this.role = role;
    this.roleMask = RoleBitmask[role];

    if (privateKeyDerHex) {
      const cleanHex = privateKeyDerHex.startsWith('0x') ? privateKeyDerHex.slice(2) : privateKeyDerHex;
      this.privateKeyHex = '0x' + cleanHex;
      this.privateKeyObj = createPrivateKey({
        key: Buffer.from(cleanHex, 'hex'),
        format: 'der',
        type: 'pkcs8',
      });
      this.publicKeyObj = createPublicKey(this.privateKeyObj as any);
      this.publicKey =
        '0x' + this.publicKeyObj.export({ type: 'spki', format: 'der' }).toString('hex');
    } else {
      const { publicKey, privateKey } = generateKeyPairSync('ed25519');
      this.privateKeyObj = privateKey;
      this.publicKeyObj = publicKey;
      this.privateKeyHex =
        '0x' + privateKey.export({ type: 'pkcs8', format: 'der' }).toString('hex');
      this.publicKey =
        '0x' + publicKey.export({ type: 'spki', format: 'der' }).toString('hex');
    }
  }

  /**
   * Generates a new cryptographically bound Ed25519 AgentIdentity.
   */
  public static generate(agentId: string, role: AgentRole): AgentIdentity {
    return new AgentIdentity(agentId, role);
  }

  /**
   * Restores an AgentIdentity from an exported PKCS#8 DER private key hex string.
   */
  public static fromPrivateKey(agentId: string, role: AgentRole, privateKeyDerHex: string): AgentIdentity {
    return new AgentIdentity(agentId, role, privateKeyDerHex);
  }

  /**
   * Cryptographically signs an attestation payload using the agent's Ed25519 private key.
   */
  public signAttestation(options: {
    orderIntentDigest: string;
    approved: boolean;
    rejectionReason?: string;
    assertionDetails?: Record<string, any>;
    customTimestamp?: string;
  }): RoleAttestation {
    const decisionTimestamp = options.customTimestamp || new Date().toISOString();
    const attestationDigest = computeAttestationDigest(
      options.orderIntentDigest,
      this.role,
      this.roleMask,
      options.approved,
      decisionTimestamp
    );

    // Asymmetric Ed25519 Signature over attestationDigest
    const signatureBuffer = sign(null, Buffer.from(attestationDigest, 'utf8'), this.privateKeyObj);
    const signature = '0xed25519_' + signatureBuffer.toString('hex');

    const attestationId = `attest_${this.role.toLowerCase()}_${Date.now()}_${randomBytes(4).toString('hex')}`;

    return {
      attestationId,
      orderIntentDigest: options.orderIntentDigest,
      agentId: this.agentId,
      agentPublicKey: this.publicKey,
      role: this.role,
      roleMask: this.roleMask,
      approved: options.approved,
      decisionTimestamp,
      signature,
      rejectionReason: options.rejectionReason,
      assertionDetails: options.assertionDetails || {},
    };
  }

  /**
   * Verifies the cryptographic integrity of a RoleAttestation using the agent's Ed25519 public key.
   */
  public static verifyAttestation(attestation: RoleAttestation): boolean {
    if (!attestation.signature || !attestation.agentPublicKey) {
      return false;
    }

    // Role bitmask consistency check
    if (RoleBitmask[attestation.role] !== attestation.roleMask) {
      return false;
    }

    if (!attestation.signature.startsWith('0xed25519_')) {
      return false;
    }

    try {
      const pubKeyDer = attestation.agentPublicKey.startsWith('0x')
        ? attestation.agentPublicKey.slice(2)
        : attestation.agentPublicKey;

      const pubKeyObj = createPublicKey({
        key: Buffer.from(pubKeyDer, 'hex'),
        format: 'der',
        type: 'spki',
      });

      const attestationDigest = computeAttestationDigest(
        attestation.orderIntentDigest,
        attestation.role,
        attestation.roleMask,
        attestation.approved,
        attestation.decisionTimestamp
      );

      const rawSignatureHex = attestation.signature.slice('0xed25519_'.length);
      const signatureBuffer = Buffer.from(rawSignatureHex, 'hex');

      return verify(
        null,
        Buffer.from(attestationDigest, 'utf8'),
        pubKeyObj,
        signatureBuffer
      );
    } catch {
      return false;
    }
  }
}
