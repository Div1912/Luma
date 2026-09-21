/**
 * @file packages/dual-rail/src/fiat/provider.ts
 * Provider-agnostic interfaces for Ephemeral Virtual Card management.
 */

import { SecureCardCredentials } from './enclave.js';

export type CardStatus = 'active' | 'consumed' | 'canceled' | 'expired';

export interface CardCreationRequest {
  spendingLimit: number;
  currency?: string;
  merchantBound?: string;
  allowedCategories?: string[];
  escrowLockDigest: string;
  agentId?: string;
  memo?: string;
  ttlSeconds?: number;
}

export interface EphemeralCard {
  id: string;
  credentials: SecureCardCredentials;
  spendingLimit: number;
  currency: string;
  merchantBound?: string;
  allowedCategories?: string[];
  status: CardStatus;
  escrowLockDigest: string;
  createdAt: number;
  expiresAt: number;
}

export interface AuthorizationRequest {
  id: string;
  cardId: string;
  amount: number;
  currency: string;
  merchant: string;
  merchantCategoryCode?: string;
  merchantDomain?: string;
}

export interface AuthorizationDecision {
  approved: boolean;
  responseCode: 'approve' | 'decline';
  reason?: string;
  latencyMs: number;
  cardId: string;
  selfDestructed: boolean;
}

export interface VirtualCardProvider {
  createEphemeralCard(request: CardCreationRequest): Promise<EphemeralCard>;
  cancelCard(cardId: string): Promise<void>;
  getCard(cardId: string): Promise<EphemeralCard | undefined>;
  handleAuthorizationRequest(request: AuthorizationRequest): Promise<AuthorizationDecision>;
}
