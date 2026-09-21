/**
 * @file packages/quorum/src/crypto/digest.ts
 * Cryptographic hashing and digest generation for @ghost/quorum.
 * Provides SHA-256 canonical hashing matching Midnight Compact Bytes<32> invariants.
 */

import { createHash } from 'node:crypto';
import { OrderIntent, AgentRole } from '../types.js';
import { canonicalizeOrderIntent } from './canonical.js';

/**
 * Computes the canonical SHA-256 digest for an OrderIntent.
 * Returns a 0x-prefixed 64-character hex string (32 bytes).
 */
export function computeOrderIntentDigest(order: OrderIntent): string {
  const canonicalString = canonicalizeOrderIntent(order);
  const hash = createHash('sha256').update(canonicalString, 'utf8').digest('hex');
  return `0x${hash}`;
}

/**
 * Computes the deterministic assertion digest signed by an individual specialist agent.
 * Combines order digest, assigned role, role bitmask, approval status, and unique nonce.
 */
export function computeAttestationDigest(
  orderIntentDigest: string,
  role: AgentRole,
  roleMask: number,
  approved: boolean,
  decisionTimestamp: string
): string {
  const rawPayload = `${orderIntentDigest}:${role}:${roleMask}:${approved ? '1' : '0'}:${decisionTimestamp}`;
  const hash = createHash('sha256').update(rawPayload, 'utf8').digest('hex');
  return `0x${hash}`;
}

/**
 * Validates and converts a 0x-hex string into a 32-byte array (matching Compact Bytes<32>).
 */
export function hexToBytes32(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (cleanHex.length !== 64) {
    throw new Error(`Invalid 32-byte hex string length: expected 64 hex chars, got ${cleanHex.length}`);
  }
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(cleanHex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Converts a 32-byte array into a 0x-prefixed hex string.
 */
export function bytes32ToHex(bytes: Uint8Array): string {
  if (bytes.length !== 32) {
    throw new Error(`Invalid bytes length: expected 32, got ${bytes.length}`);
  }
  return '0x' + Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}
