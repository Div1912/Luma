/**
 * @file packages/quorum/src/agents/compliance.ts
 * Autonomous Audit & Security Specialist Bot for @ghost/quorum.
 * Enforces US Treasury OFAC sanctions screening, Corporate Approved Vendor List (AVL) compliance,
 * and emits cryptographically signed SecurityAuditAttestations.
 */

import { AgentIdentity } from '../crypto/identity.js';
import { computeOrderIntentDigest } from '../crypto/digest.js';
import { OFACSanctionsEngine } from '../compliance/ofac.js';
import { VendorAVLRegistry } from '../compliance/vendor-avl.js';
import { OrderIntent, RoleAttestation } from '../types.js';

export interface ComplianceBotConfig {
  agentId?: string;
  privateKeyDerHex?: string;
  ofacEngine?: OFACSanctionsEngine;
  avlRegistry?: VendorAVLRegistry;
  allowedCurrencies?: string[];
}

export const DEFAULT_ALLOWED_CURRENCIES = ['USD', 'EUR', 'GBP', 'DUST'];

export class ComplianceBot {
  public readonly identity: AgentIdentity;
  private readonly ofacEngine: OFACSanctionsEngine;
  private readonly avlRegistry: VendorAVLRegistry;
  private readonly allowedCurrencies: Set<string>;

  constructor(config?: ComplianceBotConfig) {
    this.identity = new AgentIdentity(
      config?.agentId || 'security_audit_bot_01',
      'SECURITY_AUDIT',
      config?.privateKeyDerHex
    );

    this.ofacEngine = config?.ofacEngine || new OFACSanctionsEngine();
    this.avlRegistry = config?.avlRegistry || new VendorAVLRegistry();

    const currencies = config?.allowedCurrencies || DEFAULT_ALLOWED_CURRENCIES;
    this.allowedCurrencies = new Set(currencies.map((c) => c.toUpperCase()));
  }

  /**
   * Performs sanctions and vendor allowlist audits on an OrderIntent requisition.
   */
  public evaluateOrder(order: OrderIntent): RoleAttestation {
    const orderIntentDigest = computeOrderIntentDigest(order);

    // 1. Currency Sanity Check
    const normalizedCurrency = order.currency.trim().toUpperCase();
    if (!this.allowedCurrencies.has(normalizedCurrency)) {
      return this.identity.signAttestation({
        orderIntentDigest,
        approved: false,
        rejectionReason: `Compliance Rejection: Currency '${order.currency}' is not supported for corporate settlements`,
        assertionDetails: { currency: order.currency },
      });
    }

    // 2. OFAC Sanctions Screening on Merchant ID & Metadata
    const merchantName = (order.metadata?.vendorName as string) || order.merchantId;
    const merchantCountry = (order.metadata?.vendorCountry as string) || undefined;

    const ofacResult = this.ofacEngine.screenEntity(merchantName, merchantCountry);
    if (!ofacResult.passed) {
      return this.identity.signAttestation({
        orderIntentDigest,
        approved: false,
        rejectionReason: `Compliance Alert (OFAC Sanction Hit): ${ofacResult.reason}`,
        assertionDetails: {
          ofacPassed: false,
          sanctionedEntity: ofacResult.sanctionedEntity,
          program: ofacResult.matchedProgram,
          confidence: ofacResult.confidence,
        },
      });
    }

    // 3. Corporate Approved Vendor List (AVL) Verification
    const avlResult = this.avlRegistry.verifyVendor(order.merchantId, order.amount);
    if (!avlResult.passed) {
      return this.identity.signAttestation({
        orderIntentDigest,
        approved: false,
        rejectionReason: avlResult.reason,
        assertionDetails: {
          ofacPassed: true,
          avlVerified: false,
          vendorId: order.merchantId,
        },
      });
    }

    // 4. Clean Compliance Attestation Emission
    return this.identity.signAttestation({
      orderIntentDigest,
      approved: true,
      assertionDetails: {
        ofacPassed: true,
        avlVerified: true,
        vendorId: order.merchantId,
        vendorName: avlResult.vendorName,
        vendorStatus: avlResult.status,
        riskScore: 0.0,
      },
    });
  }
}
