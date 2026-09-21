/**
 * @file packages/intent/src/index.ts
 * Main entry point for @ghost/intent.
 * Cryptographic Intent-Binding & Prompt-Injection Firewall for Autonomous AI Agents.
 */

// Intent Compiler
export { SemanticIntentCompiler } from './compiler/extractor.js';
export { classifyCategory, normalizeCategory, CATEGORY_KEYWORDS } from './compiler/taxonomy.js';

// Cryptography & Signing Enclave
export { computeIntentCommitment } from './crypto/commitment.js';
export { IntentSigningEnclave } from './crypto/signer.js';
export { IntentTokenManager } from './crypto/token.js';

// Types & Contracts
export type {
  CommerceScope,
  SignedIntentToken,
  StandardCommerceCategory,
  IntentCompilerOptions,
  IntentCompilationResult,
} from './types.js';
