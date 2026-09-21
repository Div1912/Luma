/**
 * @file packages/dual-rail/src/router.ts
 * DualRailRouter: Intelligent universal payment routing engine for autonomous agents.
 * Unifies Machine-to-Machine HTTP 402 paywalls and Fiat Ephemeral Virtual Cards.
 */

import { ghostFetch } from './x402/fetch.js';
import { VirtualCardProvider, EphemeralCard } from './fiat/provider.js';
import { StripeIssuingSimulator } from './fiat/stripe-simulator.js';
import { MidnightCardEscrowClient } from './escrow/client.js';
import { EscrowReconciler } from './escrow/reconciler.js';

export type PaymentRail = 'm2m_x402' | 'fiat_card' | 'auto';

export interface PaymentIntent {
  target: string;
  amount: number;
  currency?: string;
  merchant?: string;
  rail?: PaymentRail;
  agentId?: string;
  memo?: string;
  headers?: Record<string, string>;
  body?: any;
  method?: string;
}

export interface DualRailPaymentResult {
  railUsed: 'm2m_x402' | 'fiat_card';
  success: boolean;
  amount: number;
  currency: string;
  merchant: string;
  response?: any;
  card?: EphemeralCard;
  latencyMs: number;
  timestamp: string;
}

export class DualRailRouter {
  public readonly cardProvider: VirtualCardProvider;
  public readonly escrowClient: MidnightCardEscrowClient;
  public readonly reconciler: EscrowReconciler;

  constructor(options?: { cardProvider?: VirtualCardProvider; escrowClient?: MidnightCardEscrowClient }) {
    this.escrowClient = options?.escrowClient || new MidnightCardEscrowClient();
    this.cardProvider = options?.cardProvider || new StripeIssuingSimulator();
    this.reconciler = new EscrowReconciler(this.escrowClient);
  }

  /**
   * Executes a payment intent by intelligently selecting or automatically negotiating the optimal rail.
   */
  public async pay(intent: PaymentIntent): Promise<DualRailPaymentResult> {
    const startTime = performance.now();
    const currency = (intent.currency || 'USD').toUpperCase();
    const merchant = intent.merchant || 'Unknown Merchant';

    // 1. Determine Rail
    let selectedRail: 'm2m_x402' | 'fiat_card' = 'fiat_card';

    if (intent.rail === 'm2m_x402') {
      selectedRail = 'm2m_x402';
    } else if (intent.rail === 'fiat_card') {
      selectedRail = 'fiat_card';
    } else {
      // Auto mode: probe target if it's an HTTP URL
      selectedRail = await this.probeTargetRail(intent.target);
    }

    // 2. Execute via Machine-to-Machine Rail (x402)
    if (selectedRail === 'm2m_x402') {
      const response = await ghostFetch(intent.target, {
        method: intent.method || 'GET',
        headers: intent.headers,
        body: intent.body ? JSON.stringify(intent.body) : undefined,
      }, {
        maxSpendPerCall: intent.amount * 1.5,
        agentId: intent.agentId,
      });

      let responseData: any;
      try {
        responseData = await response.json();
      } catch {
        responseData = await response.text();
      }

      return {
        railUsed: 'm2m_x402',
        success: response.ok,
        amount: intent.amount,
        currency,
        merchant,
        response: responseData,
        latencyMs: Number((performance.now() - startTime).toFixed(2)),
        timestamp: new Date().toISOString(),
      };
    }

    // 3. Execute via Fiat Rail (Ephemeral Virtual Card)
    // Step A: Lock collateral in Midnight ZK Escrow
    const escrowReceipt = await this.escrowClient.lockCollateral(intent.amount, intent.memo || merchant);

    // Step B: Issue single-use ephemeral card
    const card = await this.cardProvider.createEphemeralCard({
      spendingLimit: intent.amount,
      currency,
      merchantBound: intent.merchant,
      escrowLockDigest: escrowReceipt.lockDigest,
      agentId: intent.agentId,
      memo: intent.memo,
    });

    return {
      railUsed: 'fiat_card',
      success: true,
      amount: intent.amount,
      currency,
      merchant,
      card,
      latencyMs: Number((performance.now() - startTime).toFixed(2)),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Introspects target endpoint to determine if it speaks x402.
   */
  private async probeTargetRail(target: string): Promise<'m2m_x402' | 'fiat_card'> {
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      return 'fiat_card';
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1500);

      const probe = await fetch(target, {
        method: 'HEAD',
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timer);

      if (probe && probe.status === 402) {
        return 'm2m_x402';
      }
    } catch {
      // Fallback
    }

    return 'fiat_card';
  }
}
