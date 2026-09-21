/**
 * @file packages/dual-rail/src/fiat/stripe-simulator.ts
 * High-fidelity Stripe Issuing sandbox simulator.
 * Generates single-use ephemeral cards, validates merchant binding, and triggers auto-destruction.
 */

import { createHash } from 'crypto';
import {
  AuthorizationDecision,
  AuthorizationRequest,
  CardCreationRequest,
  EphemeralCard,
  VirtualCardProvider,
} from './provider.js';
import { SecureCardCredentials } from './enclave.js';

export class StripeIssuingSimulator implements VirtualCardProvider {
  private cards: Map<string, EphemeralCard> = new Map();
  private cardCounter: number = 0;

  /**
   * Generates a single-use ephemeral virtual card backed by Midnight ZK escrow.
   */
  public async createEphemeralCard(request: CardCreationRequest): Promise<EphemeralCard> {
    this.cardCounter += 1;
    const cardId = `ic_${Date.now()}_${this.cardCounter}`;

    // Generate valid test PAN (4242 4242 4242 XXXX)
    const suffix = String(1000 + (this.cardCounter % 9000));
    const pan = `424242424242${suffix}`;
    const cvv = String(100 + (this.cardCounter % 899));
    const now = new Date();
    const expMonth = now.getMonth() + 1;
    const expYear = now.getFullYear() + 2;

    const credentials = new SecureCardCredentials(pan, cvv, expMonth, expYear, 'Visa');
    const ttlMs = (request.ttlSeconds || 3600) * 1000;

    const card: EphemeralCard = {
      id: cardId,
      credentials,
      spendingLimit: request.spendingLimit,
      currency: (request.currency || 'USD').toUpperCase(),
      merchantBound: request.merchantBound?.toLowerCase().trim(),
      allowedCategories: request.allowedCategories?.map((c) => c.toLowerCase().trim()),
      status: 'active',
      escrowLockDigest: request.escrowLockDigest,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttlMs,
    };

    this.cards.set(cardId, card);
    return card;
  }

  /**
   * Immediately cancels a virtual card.
   */
  public async cancelCard(cardId: string): Promise<void> {
    const card = this.cards.get(cardId);
    if (card) {
      card.status = 'canceled';
      card.credentials.wipe();
    }
  }

  public async getCard(cardId: string): Promise<EphemeralCard | undefined> {
    return this.cards.get(cardId);
  }

  /**
   * Handles real-time authorization requests from the Visa/Mastercard network.
   * Responds within <10ms (well within the Stripe 2,000ms SLA).
   */
  public async handleAuthorizationRequest(request: AuthorizationRequest): Promise<AuthorizationDecision> {
    const startTime = performance.now();
    const card = this.cards.get(request.cardId);

    // 1. Check card existence and active status
    if (!card || card.status !== 'active') {
      return {
        approved: false,
        responseCode: 'decline',
        reason: card ? `Card status is '${card.status}'` : 'Card not found',
        latencyMs: Number((performance.now() - startTime).toFixed(2)),
        cardId: request.cardId,
        selfDestructed: false,
      };
    }

    // 2. Check expiration
    if (Date.now() > card.expiresAt) {
      card.status = 'expired';
      card.credentials.wipe();
      return {
        approved: false,
        responseCode: 'decline',
        reason: 'Ephemeral card expired',
        latencyMs: Number((performance.now() - startTime).toFixed(2)),
        cardId: request.cardId,
        selfDestructed: true,
      };
    }

    // 3. Enforce spending limit
    if (request.amount > card.spendingLimit) {
      return {
        approved: false,
        responseCode: 'decline',
        reason: `Charge amount ($${request.amount}) exceeds single-use card spending limit ($${card.spendingLimit})`,
        latencyMs: Number((performance.now() - startTime).toFixed(2)),
        cardId: request.cardId,
        selfDestructed: false,
      };
    }

    // 4. Enforce strict merchant binding (if configured)
    if (card.merchantBound) {
      const normalizedMerchant = request.merchant.toLowerCase().trim();
      const normalizedDomain = (request.merchantDomain || '').toLowerCase().trim();
      const boundTarget = card.merchantBound;

      const isMatch =
        normalizedMerchant.includes(boundTarget) ||
        boundTarget.includes(normalizedMerchant) ||
        normalizedDomain.includes(boundTarget);

      if (!isMatch) {
        return {
          approved: false,
          responseCode: 'decline',
          reason: `Merchant lock violation: card is bound exclusively to '${card.merchantBound}'`,
          latencyMs: Number((performance.now() - startTime).toFixed(2)),
          cardId: request.cardId,
          selfDestructed: false,
        };
      }
    }

    // 5. Approved! Instantly transition card to 'consumed' and wipe memory enclave!
    card.status = 'consumed';
    card.credentials.wipe();

    const latencyMs = Number((performance.now() - startTime).toFixed(2));

    return {
      approved: true,
      responseCode: 'approve',
      latencyMs,
      cardId: request.cardId,
      selfDestructed: true,
    };
  }

  public clear(): void {
    for (const card of this.cards.values()) {
      card.credentials.wipe();
    }
    this.cards.clear();
  }
}
