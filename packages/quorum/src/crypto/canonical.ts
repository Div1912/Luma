/**
 * @file packages/quorum/src/crypto/canonical.ts
 * Deterministic JSON Canonicalization Scheme (RFC 8785 JCS) for @ghost/quorum.
 * Ensures that all agents and smart contracts derive an identical cryptographic digest
 * regardless of key ordering, whitespace, or object construction semantics.
 */

import { OrderIntent } from '../types.js';

export function canonicalizeJson(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    const items = obj.map((item) => canonicalizeJson(item));
    return `[${items.join(',')}]`;
  }

  const sortedKeys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined && typeof obj[k] !== 'function')
    .sort();

  const pairs = sortedKeys.map((key) => {
    const serializedKey = JSON.stringify(key);
    const serializedVal = canonicalizeJson(obj[key]);
    return `${serializedKey}:${serializedVal}`;
  });

  return `{${pairs.join(',')}}`;
}

/**
 * Normalizes and canonicalizes an OrderIntent into a deterministic string.
 */
export function canonicalizeOrderIntent(order: OrderIntent): string {
  const normalized = {
    orderId: order.orderId,
    amount: order.amount,
    currency: order.currency.toUpperCase(),
    merchantId: order.merchantId.toLowerCase(),
    category: order.category,
    department: order.department,
    justification: order.justification,
    nonce: order.nonce,
    lineItems: order.lineItems.map((li) => ({
      sku: li.sku,
      description: li.description,
      quantity: li.quantity,
      unitPrice: li.unitPrice,
      totalPrice: li.totalPrice,
      category: li.category || '',
    })),
    timestamp: order.timestamp,
  };

  return canonicalizeJson(normalized);
}
