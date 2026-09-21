/**
 * @file packages/dual-rail/src/fiat/webhook.ts
 * Sub-2-Second Webhook Authorization Daemon for Stripe Issuing & Lithic.
 * Evaluates real-time Visa/Mastercard authorizations against Midnight escrow constraints.
 */

import { AuthorizationDecision, AuthorizationRequest, VirtualCardProvider } from './provider.js';

export interface WebhookPayload {
  type: string;
  data: {
    object: {
      id: string;
      card: { id: string } | string;
      amount: number;
      currency: string;
      merchant_data: {
        name: string;
        category?: string;
        network_id?: string;
      };
    };
  };
}

export class WebhookAuthorizationDaemon {
  private readonly provider: VirtualCardProvider;
  private readonly maxAllowedLatencyMs: number;

  constructor(provider: VirtualCardProvider, maxAllowedLatencyMs: number = 2000) {
    this.provider = provider;
    this.maxAllowedLatencyMs = maxAllowedLatencyMs;
  }

  /**
   * Processes an incoming issuing authorization webhook within the required network SLA.
   */
  public async handleWebhook(payload: WebhookPayload): Promise<AuthorizationDecision> {
    const startTime = performance.now();

    if (payload.type !== 'issuing_authorization.request') {
      return {
        approved: false,
        responseCode: 'decline',
        reason: `Ignored unhandled event type: ${payload.type}`,
        latencyMs: Number((performance.now() - startTime).toFixed(2)),
        cardId: 'unknown',
        selfDestructed: false,
      };
    }

    const authObject = payload.data.object;
    const cardId = typeof authObject.card === 'string' ? authObject.card : authObject.card.id;
    // Stripe amounts are in cents (e.g. 4250 = $42.50)
    const amountInDollars = authObject.amount / 100;

    const request: AuthorizationRequest = {
      id: authObject.id,
      cardId,
      amount: amountInDollars,
      currency: (authObject.currency || 'USD').toUpperCase(),
      merchant: authObject.merchant_data?.name || 'Unknown Merchant',
      merchantCategoryCode: authObject.merchant_data?.category,
    };

    const decision = await this.provider.handleAuthorizationRequest(request);

    // Verify SLA compliance (< 2,000ms)
    if (decision.latencyMs > this.maxAllowedLatencyMs) {
      console.warn(
        `[WebhookDaemon] SLA Violation Warning: Authorization processing took ${decision.latencyMs}ms (SLA threshold: ${this.maxAllowedLatencyMs}ms)`
      );
    }

    return decision;
  }
}
