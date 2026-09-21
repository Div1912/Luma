/**
 * @file packages/intent/src/compiler/extractor.ts
 * Deterministic Semantic Scope Compiler.
 * Translates human task descriptions into mathematically bound CommerceScope objects.
 */

import { randomBytes } from 'crypto';
import { CommerceScope, IntentCompilationResult, IntentCompilerOptions } from '../types.js';
import { classifyCategory } from './taxonomy.js';

export class SemanticIntentCompiler {
  private readonly defaultTtlSeconds: number;
  private readonly defaultCurrency: string;
  private readonly defaultOrgAuthRoot: string;

  constructor(options?: IntentCompilerOptions) {
    this.defaultTtlSeconds = options?.defaultTtlSeconds || 86400; // 24 hours
    this.defaultCurrency = options?.defaultCurrency || 'USD';
    this.defaultOrgAuthRoot =
      options?.orgAuthRoot || '0x063d2925b9428dd77e829933b9a41dc7b8c7ae8a702e15c16d56fcc0ae8e5889';
  }

  /**
   * Compiles an unstructured human natural-language prompt into a verified, deterministic CommerceScope.
   */
  public compile(prompt: string, overrides?: Partial<IntentCompilerOptions>): IntentCompilationResult {
    const cleaned = prompt.trim();
    if (!cleaned) {
      throw new Error('[IntentCompiler] Prompt cannot be empty.');
    }

    // 1. Extract monetary budget bounds
    // Patterns: "under $800", "up to 1,200 USD", "max $500", "< 350", "budget of $750", "for $150"
    const budgetMatch =
      cleaned.match(/(?:under|up to|max(?:imum)?|below|budget of|less than|<|\$)\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i) ||
      cleaned.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/);

    let extractedBudget = 100; // Default conservative fallback
    let confidence = 0.5;

    if (budgetMatch) {
      const parsed = parseFloat(budgetMatch[1].replace(/,/g, ''));
      if (!isNaN(parsed) && parsed > 0) {
        extractedBudget = parsed;
        confidence += 0.3;
      }
    }

    // 2. Classify commercial category
    const extractedCategory = classifyCategory(cleaned, overrides?.fallbackCategory || 'general_procurement');
    if (extractedCategory !== 'general_procurement') {
      confidence += 0.2;
    }

    // 3. Extract domain pattern if present
    const domainMatch = cleaned.match(/(?:at|from|on|via|merchant:?)\s+([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    const extractedMerchantPattern = domainMatch ? domainMatch[1].toLowerCase().trim() : undefined;

    // 4. Synthesize unique 32-byte cryptographic nonce
    const nonce = '0x' + randomBytes(32).toString('hex');
    const scopeId = `scope_${Date.now()}_${randomBytes(4).toString('hex')}`;
    const ttlSeconds = overrides?.defaultTtlSeconds || this.defaultTtlSeconds;

    const scope: CommerceScope = {
      scopeId,
      agentId: overrides?.agentId || 'autonomous_agent_default',
      maxBudget: extractedBudget,
      currency: (overrides?.defaultCurrency || this.defaultCurrency).toUpperCase(),
      primaryCategory: extractedCategory,
      merchantDomainPattern: extractedMerchantPattern,
      validUntil: Date.now() + ttlSeconds * 1000,
      nonce,
      orgAuthRoot: overrides?.orgAuthRoot || this.defaultOrgAuthRoot,
      purposeSummary: cleaned,
    };

    return {
      scope,
      extractedBudget,
      extractedCategory,
      extractedMerchantPattern,
      confidenceScore: Math.min(1.0, confidence),
    };
  }
}
