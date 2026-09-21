/**
 * @file packages/quorum/src/compliance/vendor-avl.ts
 * Corporate Approved Vendor List (AVL) Registry for @ghost/quorum.
 * Verifies that procurement transactions target approved enterprise counterparties
 * and adhere to vendor spend caps and status tiers.
 */

export type VendorStatus = 'PREFERRED' | 'APPROVED' | 'PROBATIONARY' | 'BLOCKED';

export interface VendorRecord {
  vendorId: string;
  name: string;
  status: VendorStatus;
  category: string;
  maxPerOrderLimit: number;
  currencies: string[];
}

export interface VendorVerificationResult {
  passed: boolean;
  vendorId: string;
  vendorName?: string;
  status?: VendorStatus;
  maxLimit?: number;
  reason: string;
}

export const DEFAULT_CORPORATE_AVL: VendorRecord[] = [
  {
    vendorId: 'vendor_aws_cloud',
    name: 'Amazon Web Services, Inc.',
    status: 'PREFERRED',
    category: 'CLOUD_INFRASTRUCTURE',
    maxPerOrderLimit: 100_000,
    currencies: ['USD', 'EUR'],
  },
  {
    vendorId: 'vendor_github_enterprise',
    name: 'GitHub, Inc.',
    status: 'PREFERRED',
    category: 'DEV_TOOLS',
    maxPerOrderLimit: 50_000,
    currencies: ['USD'],
  },
  {
    vendorId: 'vendor_openai_api',
    name: 'OpenAI, LLC',
    status: 'PREFERRED',
    category: 'AI_SERVICES',
    maxPerOrderLimit: 75_000,
    currencies: ['USD'],
  },
  {
    vendorId: 'vendor_anthropic_api',
    name: 'Anthropic PBC',
    status: 'PREFERRED',
    category: 'AI_SERVICES',
    maxPerOrderLimit: 75_000,
    currencies: ['USD'],
  },
  {
    vendorId: 'vendor_datadog_monitor',
    name: 'Datadog, Inc.',
    status: 'APPROVED',
    category: 'OBSERVABILITY',
    maxPerOrderLimit: 40_000,
    currencies: ['USD', 'EUR'],
  },
  {
    vendorId: 'vendor_snowflake_data',
    name: 'Snowflake, Inc.',
    status: 'APPROVED',
    category: 'DATA_WAREHOUSE',
    maxPerOrderLimit: 80_000,
    currencies: ['USD'],
  },
  {
    vendorId: 'vendor_stripe_payments',
    name: 'Stripe, Inc.',
    status: 'PREFERRED',
    category: 'PAYMENTS',
    maxPerOrderLimit: 150_000,
    currencies: ['USD', 'EUR', 'GBP'],
  },
  {
    vendorId: 'vendor_shady_reseller',
    name: 'Shady Hardware Reseller LLC',
    status: 'BLOCKED',
    category: 'HARDWARE',
    maxPerOrderLimit: 0,
    currencies: ['USD'],
  },
];

export class VendorAVLRegistry {
  private readonly vendors: Map<string, VendorRecord>;

  constructor(initialVendors?: VendorRecord[]) {
    this.vendors = new Map();
    const list = initialVendors || DEFAULT_CORPORATE_AVL;
    for (const v of list) {
      this.vendors.set(v.vendorId.toLowerCase(), v);
    }
  }

  /**
   * Verifies that a target vendor is approved, unblocked, and within transactional order limits.
   */
  public verifyVendor(vendorId: string, requestedAmount: number): VendorVerificationResult {
    const key = vendorId.trim().toLowerCase();
    const vendor = this.vendors.get(key);

    if (!vendor) {
      return {
        passed: false,
        vendorId,
        reason: `Vendor AVL Rejection: Target vendor '${vendorId}' is not registered on the Corporate Approved Vendor List`,
      };
    }

    if (vendor.status === 'BLOCKED') {
      return {
        passed: false,
        vendorId,
        vendorName: vendor.name,
        status: vendor.status,
        reason: `Vendor AVL Rejection: Target vendor '${vendor.name}' has status 'BLOCKED' due to security or compliance holds`,
      };
    }

    if (requestedAmount > vendor.maxPerOrderLimit) {
      return {
        passed: false,
        vendorId,
        vendorName: vendor.name,
        status: vendor.status,
        maxLimit: vendor.maxPerOrderLimit,
        reason: `Vendor AVL Rejection: Requested order amount of $${requestedAmount} exceeds vendor max per-order limit of $${vendor.maxPerOrderLimit}`,
      };
    }

    return {
      passed: true,
      vendorId,
      vendorName: vendor.name,
      status: vendor.status,
      maxLimit: vendor.maxPerOrderLimit,
      reason: `Vendor AVL Verified: '${vendor.name}' is an active ${vendor.status} enterprise vendor`,
    };
  }

  /**
   * Registers or updates an approved vendor in the registry.
   */
  public upsertVendor(vendor: VendorRecord): void {
    this.vendors.set(vendor.vendorId.toLowerCase(), vendor);
  }
}
