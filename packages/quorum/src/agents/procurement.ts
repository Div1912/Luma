/**
 * @file packages/quorum/src/agents/procurement.ts
 * Autonomous Procurement Specialist Bot for @ghost/quorum.
 * Formulates order requisitions, performs line-item price verification,
 * audits mathematical totals, and emits cryptographically signed ProcurementAttestations.
 */

import { AgentIdentity } from '../crypto/identity.js';
import { computeOrderIntentDigest } from '../crypto/digest.js';
import { OrderIntent, RoleAttestation } from '../types.js';

export interface ProcurementBotConfig {
  agentId?: string;
  privateKeyDerHex?: string;
  allowedCategories?: string[];
  maxItemPriceThreshold?: number;
}

export const DEFAULT_ALLOWED_CATEGORIES = [
  'CLOUD_INFRASTRUCTURE',
  'AI_SERVICES',
  'DEV_TOOLS',
  'OBSERVABILITY',
  'DATA_WAREHOUSE',
  'PAYMENTS',
  'SAAS_LICENSING',
  'OFFICE_HARDWARE',
];

export class ProcurementBot {
  public readonly identity: AgentIdentity;
  private readonly allowedCategories: Set<string>;
  private readonly maxItemPriceThreshold: number;

  constructor(config?: ProcurementBotConfig) {
    this.identity = new AgentIdentity(
      config?.agentId || 'procurement_bot_01',
      'PROCUREMENT',
      config?.privateKeyDerHex
    );

    const categories = config?.allowedCategories || DEFAULT_ALLOWED_CATEGORIES;
    this.allowedCategories = new Set(categories.map((c) => c.toUpperCase()));
    this.maxItemPriceThreshold = config?.maxItemPriceThreshold ?? 250_000;
  }

  /**
   * Audits an OrderIntent requisition and emits a signed ProcurementAttestation.
   */
  public evaluateOrder(order: OrderIntent): RoleAttestation {
    const orderIntentDigest = computeOrderIntentDigest(order);

    // 1. Line Items Presence Check
    if (!order.lineItems || order.lineItems.length === 0) {
      return this.identity.signAttestation({
        orderIntentDigest,
        approved: false,
        rejectionReason: 'Procurement Audit Rejection: Requisition must contain at least one line item',
        assertionDetails: { lineItemCount: 0 },
      });
    }

    // 2. Category Whitelist Check
    const normalizedCategory = order.category.trim().toUpperCase();
    if (!this.allowedCategories.has(normalizedCategory)) {
      return this.identity.signAttestation({
        orderIntentDigest,
        approved: false,
        rejectionReason: `Procurement Audit Rejection: Category '${order.category}' is not an authorized procurement expense class`,
        assertionDetails: { category: order.category },
      });
    }

    // 3. Line Items Math & Pricing Audit
    let calculatedTotal = 0;
    for (let i = 0; i < order.lineItems.length; i++) {
      const item = order.lineItems[i];

      if (item.quantity <= 0) {
        return this.identity.signAttestation({
          orderIntentDigest,
          approved: false,
          rejectionReason: `Procurement Audit Rejection: Line item '${item.sku}' has invalid quantity (${item.quantity})`,
          assertionDetails: { violatingSku: item.sku },
        });
      }

      if (item.unitPrice < 0 || item.unitPrice > this.maxItemPriceThreshold) {
        return this.identity.signAttestation({
          orderIntentDigest,
          approved: false,
          rejectionReason: `Procurement Audit Rejection: Line item '${item.sku}' unit price ($${item.unitPrice}) exceeds allowed threshold ($${this.maxItemPriceThreshold})`,
          assertionDetails: { violatingSku: item.sku, unitPrice: item.unitPrice },
        });
      }

      const expectedItemTotal = item.quantity * item.unitPrice;
      if (item.totalPrice !== expectedItemTotal) {
        return this.identity.signAttestation({
          orderIntentDigest,
          approved: false,
          rejectionReason: `Procurement Audit Rejection: Math discrepancy on line item '${item.sku}' (expected ${expectedItemTotal}, got ${item.totalPrice})`,
          assertionDetails: { violatingSku: item.sku, expectedItemTotal, declaredItemTotal: item.totalPrice },
        });
      }

      calculatedTotal += expectedItemTotal;
    }

    // 4. Total Order Amount Integrity Check
    if (calculatedTotal !== order.amount) {
      return this.identity.signAttestation({
        orderIntentDigest,
        approved: false,
        rejectionReason: `Procurement Audit Discrepancy: Line items sum ($${calculatedTotal}) does not equal order total amount ($${order.amount})`,
        assertionDetails: { calculatedTotal, declaredAmount: order.amount },
      });
    }

    // 5. Positive Attestation Emission
    return this.identity.signAttestation({
      orderIntentDigest,
      approved: true,
      assertionDetails: {
        lineItemCount: order.lineItems.length,
        calculatedTotal,
        pricingVerified: true,
        catalogCompliant: true,
      },
    });
  }
}
