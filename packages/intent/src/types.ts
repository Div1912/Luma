/**
 * @file packages/intent/src/types.ts
 * Core types, data schemas, and contracts for @ghost/intent.
 */

export type StandardCommerceCategory =
  | 'travel'
  | 'cloud_compute'
  | 'ai_apis'
  | 'saas_subscription'
  | 'hardware'
  | 'office_supplies'
  | 'freelance_services'
  | 'general_procurement';

export interface CommerceScope {
  scopeId: string;
  agentId: string;
  maxBudget: number;
  currency: string;
  primaryCategory: StandardCommerceCategory;
  allowedSubcategories?: string[];
  merchantDomainPattern?: string; // e.g. '*.united.com', 'aws.amazon.com'
  validUntil: number; // Unix timestamp ms
  nonce: string; // 32-byte hex nonce
  orgAuthRoot: string; // Corporate root of trust
  purposeSummary?: string;
}

export interface SignedIntentToken {
  scope: CommerceScope;
  commitmentHash: string;
  signature: string;
  signerPublicKey: string;
  issuedAt: string;
}

export interface IntentCompilerOptions {
  agentId?: string;
  defaultCurrency?: string;
  defaultTtlSeconds?: number;
  orgAuthRoot?: string;
  fallbackCategory?: StandardCommerceCategory;
}

export interface IntentCompilationResult {
  scope: CommerceScope;
  extractedBudget: number;
  extractedCategory: StandardCommerceCategory;
  extractedMerchantPattern?: string;
  confidenceScore: number;
}
