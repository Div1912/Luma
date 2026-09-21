/**
 * @file packages/audit/src/tree/leaf.ts
 * Cryptographic Compliance Leaf Generator for @ghost/audit.
 * Binds transaction execution digests, policy hashes, amounts, and sanctions flags
 * into a deterministic 32-byte cryptographic leaf commitment matching Midnight Bytes<32>.
 */

import { createHash, randomBytes } from 'node:crypto';
import { ComplianceLeafRecord } from '../types.js';

export function computeComplianceLeafHash(
  txDigest: string,
  policyHash: string,
  amount: number,
  isSanctioned: boolean,
  salt: string
): string {
  const normalizedTx = txDigest.toLowerCase();
  const normalizedPolicy = policyHash.toLowerCase();
  const rawPayload = `${normalizedTx}:${normalizedPolicy}:${Math.round(amount)}:${isSanctioned ? '1' : '0'}:${salt}`;

  const hash = createHash('sha256').update(rawPayload, 'utf8').digest('hex');
  return `0x${hash}`;
}

export function createComplianceLeafRecord(params: {
  txDigest: string;
  policyId: string;
  policyHash: string;
  amount: number;
  currency: string;
  merchantId: string;
  isSanctioned?: boolean;
  ofacCleared?: boolean;
  timestamp?: string;
  salt?: string;
}): ComplianceLeafRecord {
  const salt = params.salt || '0x' + randomBytes(16).toString('hex');
  const isSanctioned = params.isSanctioned ?? false;
  const ofacCleared = params.ofacCleared ?? !isSanctioned;
  const timestamp = params.timestamp || new Date().toISOString();

  const leafHash = computeComplianceLeafHash(
    params.txDigest,
    params.policyHash,
    params.amount,
    isSanctioned,
    salt
  );

  return {
    txDigest: params.txDigest,
    policyId: params.policyId,
    policyHash: params.policyHash,
    amount: params.amount,
    currency: params.currency.toUpperCase(),
    merchantId: params.merchantId,
    isSanctioned,
    ofacCleared,
    timestamp,
    salt,
    leafHash,
  };
}
