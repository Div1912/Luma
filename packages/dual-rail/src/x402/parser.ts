/**
 * @file packages/dual-rail/src/x402/parser.ts
 * Robust parser for HTTP 402 Payment Required headers and L402 challenge tokens.
 */

import { X402Challenge } from '../types.js';

/**
 * Parses a standard WWW-Authenticate L402 challenge header or X-402 challenge header.
 *
 * Example:
 * `L402 contract="0xd72f...", amount="25", currency="tDUST", nonce="0xabc...", network="preprod"`
 */
export function parseL402Challenge(headerValue: string | null | undefined): X402Challenge | null {
  if (!headerValue || typeof headerValue !== 'string') {
    return null;
  }

  const trimmed = headerValue.trim();

  // Validate scheme prefix (L402 or X402)
  const isL402 = /^L402\s+/i.test(trimmed);
  const isX402 = /^X402\s+/i.test(trimmed);

  if (!isL402 && !isX402 && !trimmed.includes('=')) {
    return null;
  }

  // Strip prefix
  const paramsString = trimmed.replace(/^(?:L402|X402)\s+/i, '');

  // Extract key-value pairs using regex supporting quoted or unquoted values
  const regex = /([a-zA-Z0-9_-]+)=(?:"([^"]*)"|([^,\s]+))/g;
  const params: Record<string, string> = {};
  let match: RegExpExecArray | null;

  while ((match = regex.exec(paramsString)) !== null) {
    const key = match[1].toLowerCase();
    const value = match[2] !== undefined ? match[2] : match[3];
    params[key] = value;
  }

  // Validate required parameters
  const contract = params.contract || params.address || params.contract_address;
  const amountStr = params.amount || params.price || params.cost;
  const nonce = params.nonce || params.challenge;

  if (!contract || !amountStr || !nonce) {
    return null;
  }

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    return null;
  }

  return {
    contract,
    amount,
    currency: (params.currency || params.token || 'tDUST').toUpperCase(),
    nonce,
    network: params.network || 'preprod',
    realm: params.realm,
    description: params.description || params.desc,
  };
}
