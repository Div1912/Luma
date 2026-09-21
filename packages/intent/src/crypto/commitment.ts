/**
 * @file packages/intent/src/crypto/commitment.ts
 * Deterministic cryptographic commitment hashing for CommerceScope objects.
 */

import { createHash } from 'crypto';
import { CommerceScope } from '../types.js';

/**
 * Computes a deterministic 32-byte cryptographic commitment for a CommerceScope.
 * Any tampering with budget, category, merchant, or nonce alters the hash completely.
 */
export function computeIntentCommitment(scope: CommerceScope): string {
  const fields = [
    scope.scopeId,
    scope.agentId,
    scope.maxBudget.toString(),
    scope.currency.toUpperCase().trim(),
    scope.primaryCategory.toLowerCase().trim(),
    (scope.merchantDomainPattern || 'any_merchant').toLowerCase().trim(),
    scope.validUntil.toString(),
    scope.nonce,
    scope.orgAuthRoot.toLowerCase().trim(),
  ];

  const serialized = fields.join('::');
  return '0x' + createHash('sha256').update(serialized).digest('hex');
}
