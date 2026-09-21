/**
 * @file packages/intent/src/firewall/evaluator.ts
 * Cryptographic Intent-Binding Firewall Evaluator.
 * Intercepts agent tool checkouts and validates them against signed human intent commitments,
 * rejecting indirect prompt injections before any money moves.
 */

import { createHash, randomUUID } from 'crypto';
import {
  CommerceScope,
  IntentFirewallEvaluationResult,
  IntentSettlementReceipt,
  ProposedCommerceAction,
  SignedIntentToken,
  StandardCommerceCategory,
} from '../types.js';
import { IntentTokenManager } from '../crypto/token.js';
import { classifyCategory, normalizeCategory } from '../compiler/taxonomy.js';
import { IntentWitnessSynthesizer } from '../midnight/prover.js';
import { GhostIntentContractClient } from '../midnight/contract.js';
import { GhostPromptInjectionDetectedError } from './errors.js';

export class IntentFirewallEvaluator {
  private readonly contractClient: GhostIntentContractClient;

  constructor(contractClient?: GhostIntentContractClient) {
    this.contractClient = contractClient || new GhostIntentContractClient();
  }

  /**
   * Retrieves the underlying Midnight contract client.
   */
  public getContractClient(): GhostIntentContractClient {
    return this.contractClient;
  }

  /**
   * Evaluates a proposed commerce action against an intent token.
   * Throws GhostPromptInjectionDetectedError if any security constraint or circuit assertion is violated.
   */
  public async evaluate(
    action: ProposedCommerceAction,
    tokenOrSerialized: SignedIntentToken | string
  ): Promise<IntentFirewallEvaluationResult> {
    // 1. Token Resolution
    const token: SignedIntentToken =
      typeof tokenOrSerialized === 'string'
        ? IntentTokenManager.deserialize(tokenOrSerialized)
        : tokenOrSerialized;

    // 2. Token Integrity & Expiration Check
    const integrity = IntentTokenManager.verifyIntegrity(token);
    if (!integrity.valid) {
      const isExpired = integrity.reason?.toLowerCase().includes('expired');
      throw new GhostPromptInjectionDetectedError({
        divergenceType: isExpired ? 'EXPIRED_INTENT' : 'SIGNATURE_INVALID',
        attemptedAction: action,
        authorizedScope: token.scope,
        rejectionReason: integrity.reason || 'Token integrity verification failed.',
      });
    }

    // 3. Nonce Replay Check (Prevent double-spending / replay of consumed intents)
    if (this.contractClient.isNonceConsumed(token.scope.nonce)) {
      throw new GhostPromptInjectionDetectedError({
        divergenceType: 'REPLAY_VIOLATION',
        attemptedAction: action,
        authorizedScope: token.scope,
        rejectionReason: `Intent nonce '${token.scope.nonce}' has already been consumed in a prior settlement.`,
      });
    }

    // 4. Sanity Check on Amount
    if (action.amount <= 0 || isNaN(action.amount)) {
      throw new GhostPromptInjectionDetectedError({
        divergenceType: 'BUDGET_ESCALATION',
        attemptedAction: action,
        authorizedScope: token.scope,
        rejectionReason: `Invalid transaction amount: $${action.amount}. Must be positive.`,
      });
    }

    // 5. Budget Escalation Check
    if (action.amount > token.scope.maxBudget) {
      throw new GhostPromptInjectionDetectedError({
        divergenceType: 'BUDGET_ESCALATION',
        attemptedAction: action,
        authorizedScope: token.scope,
        rejectionReason: `Proposed transaction amount ($${action.amount}) exceeds authorized intent limit ($${token.scope.maxBudget}).`,
      });
    }

    // 6. Category Alignment & Prompt Injection Diversion Check
    // Check for explicit diversion cues first (e.g. gift card purchase, crypto transfer)
    const suspiciousDiversionReason = this.detectExplicitDiversion(action, token.scope);
    if (suspiciousDiversionReason) {
      throw new GhostPromptInjectionDetectedError({
        divergenceType: 'CATEGORY_DIVERGENCE',
        attemptedAction: action,
        authorizedScope: token.scope,
        rejectionReason: suspiciousDiversionReason,
      });
    }

    const inferredCategory = this.resolveActionCategory(action);
    const isCategoryAllowed =
      inferredCategory === token.scope.primaryCategory ||
      (token.scope.allowedSubcategories &&
        token.scope.allowedSubcategories.includes(inferredCategory));

    if (!isCategoryAllowed) {
      throw new GhostPromptInjectionDetectedError({
        divergenceType: 'CATEGORY_DIVERGENCE',
        attemptedAction: action,
        authorizedScope: token.scope,
        rejectionReason: `Category divergence detected: Agent attempted transaction in '${inferredCategory}', but human intent is restricted to '${token.scope.primaryCategory}'.`,
      });
    }

    // 7. Merchant Domain Lock & Homoglyph Protection Check
    if (token.scope.merchantDomainPattern) {
      const domainValidation = this.validateDomainMatch(
        action.merchantDomain || action.merchant,
        token.scope.merchantDomainPattern
      );

      if (!domainValidation.match) {
        throw new GhostPromptInjectionDetectedError({
          divergenceType: 'MERCHANT_HIJACK',
          attemptedAction: action,
          authorizedScope: token.scope,
          rejectionReason:
            domainValidation.reason ||
            `Target merchant domain violates authorized merchant pattern '${token.scope.merchantDomainPattern}'.`,
        });
      }
    }

    // 8. Zero-Knowledge Witness Synthesis & Midnight Compact Circuit Proving
    const witness = IntentWitnessSynthesizer.synthesizeWitness(action, token);
    const proof = await IntentWitnessSynthesizer.generateProof(
      witness,
      this.contractClient.contractAddress,
      token.commitmentHash
    );

    // 9. On-Chain Midnight Settlement Simulation
    let settlementResult;
    try {
      settlementResult = await this.contractClient.verifyAndSettle(witness, proof);
    } catch (contractErr: any) {
      throw new GhostPromptInjectionDetectedError({
        divergenceType: 'CATEGORY_DIVERGENCE',
        attemptedAction: action,
        authorizedScope: token.scope,
        rejectionReason: `Midnight Compact Circuit Assertion Failure: ${contractErr.message}`,
      });
    }

    // 10. Generate Sealed Audit Receipt
    const receipt: IntentSettlementReceipt = {
      receiptId: '0xrcpt_' + createHash('sha256').update(randomUUID()).digest('hex').slice(0, 32),
      verified: true,
      scopeId: token.scope.scopeId,
      agentId: token.scope.agentId,
      amount: action.amount,
      currency: action.currency || token.scope.currency,
      merchant: action.merchant,
      category: token.scope.primaryCategory,
      proof,
      txDigest: settlementResult.txDigest,
      settledAt: new Date().toISOString(),
    };

    return {
      verified: true,
      action,
      scope: token.scope,
      proof,
      receipt,
    };
  }

  /**
   * Resolves the commerce category from explicit fields or order description keywords.
   */
  private resolveActionCategory(action: ProposedCommerceAction): StandardCommerceCategory {
    if (action.category) {
      return normalizeCategory(action.category);
    }

    const description = [action.orderDescription, action.merchant, action.rawPromptSnippet]
      .filter(Boolean)
      .join(' ');

    return classifyCategory(description, 'general_procurement');
  }

  /**
   * Scans for high-risk prompt injection cues such as gift card purchases or crypto transfers
   * when the human intent was for physical goods, travel, or compute.
   */
  private detectExplicitDiversion(
    action: ProposedCommerceAction,
    scope: CommerceScope
  ): string | null {
    const text = [action.orderDescription, action.rawPromptSnippet, action.merchant]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const highRiskKeywords = [
      'gift card',
      'giftcard',
      'apple card',
      'amazon card',
      'steam wallet',
      'prepaid visa',
      'wire transfer',
      'western union',
      'send btc',
      'send eth',
      'crypto transfer',
    ];

    for (const kw of highRiskKeywords) {
      if (text.includes(kw)) {
        if (scope.primaryCategory !== 'general_procurement') {
          return `Category divergence: Prompt Injection Alert - Detected diversion payload '${kw}' incompatible with '${scope.primaryCategory}' intent.`;
        }
      }
    }

    return null;
  }

  /**
   * Validates target merchant domain against allowed domain patterns.
   * Includes strict homoglyph / punycode spoofing detection.
   */
  public validateDomainMatch(
    targetInput: string,
    allowedPattern: string
  ): { match: boolean; reason?: string } {
    if (!allowedPattern || allowedPattern === '*' || allowedPattern === 'any_merchant') {
      return { match: true };
    }

    // 1. Normalize target domain
    let domain = targetInput.trim().toLowerCase();
    domain = domain.replace(/^https?:\/\//, ''); // Strip protocol
    domain = domain.split('/')[0]; // Strip path
    domain = domain.split(':')[0]; // Strip port

    // 2. Homoglyph / Non-ASCII Detection
    // Attackers frequently use Cyrillic 'а' (\u0430) or Greek letters to spoof domains like 'singаporeair.com'
    if (/[^\u0020-\u007E]/.test(domain)) {
      return {
        match: false,
        reason: `Homoglyph / Punycode spoofing detected in merchant domain '${domain}'.`,
      };
    }

    // 3. Multi-pattern support (comma or pipe separated)
    const patterns = allowedPattern
      .split(/[,|]/)
      .map((p) => p.trim().toLowerCase())
      .filter(Boolean);

    for (const pattern of patterns) {
      if (pattern === '*' || pattern === 'any_merchant') {
        return { match: true };
      }

      if (pattern.startsWith('*.')) {
        const rootDomain = pattern.slice(2);
        // Matches exact root or any valid subdomain
        if (domain === rootDomain || domain.endsWith('.' + rootDomain)) {
          return { match: true };
        }
      } else {
        if (domain === pattern || domain.endsWith('.' + pattern)) {
          return { match: true };
        }
      }
    }

    return {
      match: false,
      reason: `Domain '${domain}' does not match authorized pattern '${allowedPattern}'.`,
    };
  }
}
