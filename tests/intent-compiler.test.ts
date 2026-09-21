/**
 * @file tests/intent-compiler.test.ts
 * Rigorous test suite for @ghost/intent semantic compiler, commitment hashing, and signing enclave.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  SemanticIntentCompiler,
  IntentSigningEnclave,
  IntentTokenManager,
  computeIntentCommitment,
  classifyCategory,
} from '../packages/intent/src/index.js';

describe('@ghost/intent: Semantic Compiler, Commitment Hashing & Enclave', () => {
  let compiler: SemanticIntentCompiler;
  let enclave: IntentSigningEnclave;

  beforeEach(() => {
    compiler = new SemanticIntentCompiler();
    enclave = new IntentSigningEnclave();
  });

  describe('1. Semantic Scope Compiler', () => {
    it('compiles human travel tasks into bounded CommerceScope objects', () => {
      const prompt = 'Find the best flight to DevCon in Tokyo under $800 on singaporeair.com';
      const result = compiler.compile(prompt, { agentId: 'travel_agent_01' });

      expect(result.extractedBudget).toBe(800);
      expect(result.extractedCategory).toBe('travel');
      expect(result.extractedMerchantPattern).toBe('singaporeair.com');
      expect(result.scope.maxBudget).toBe(800);
      expect(result.scope.primaryCategory).toBe('travel');
      expect(result.scope.currency).toBe('USD');
      expect(result.scope.nonce).toMatch(/^0x[a-f0-9]{64}$/);
      expect(result.confidenceScore).toBeGreaterThan(0.7);
    });

    it('compiles cloud compute provisioning tasks accurately', () => {
      const prompt = 'Spin up 2 GPU H100 instances on aws.amazon.com with a budget of $2,500';
      const result = compiler.compile(prompt);

      expect(result.extractedBudget).toBe(2500);
      expect(result.extractedCategory).toBe('cloud_compute');
      expect(result.extractedMerchantPattern).toBe('aws.amazon.com');
      expect(result.scope.maxBudget).toBe(2500);
    });

    it('compiles AI API token procurement tasks', () => {
      const prompt = 'Add $150 credits for OpenAI GPT-4 inference API tokens';
      const result = compiler.compile(prompt);

      expect(result.extractedBudget).toBe(150);
      expect(result.extractedCategory).toBe('ai_apis');
    });

    it('classifies categories correctly across varied terminology', () => {
      expect(classifyCategory('Renew GitHub team subscription licenses')).toBe('saas_subscription');
      expect(classifyCategory('Order 3 Dell 4K monitors for dev workstations')).toBe('hardware');
      expect(classifyCategory('Hire a smart contract security auditor')).toBe('freelance_services');
    });

    it('throws when prompt is empty or whitespace', () => {
      expect(() => compiler.compile('')).toThrow('Prompt cannot be empty');
      expect(() => compiler.compile('   ')).toThrow('Prompt cannot be empty');
    });
  });

  describe('2. Deterministic Commitment Hashing', () => {
    it('produces identical commitment hashes for identical scopes', () => {
      const scope = compiler.compile('Book hotel under $400').scope;

      const hash1 = computeIntentCommitment(scope);
      const hash2 = computeIntentCommitment(scope);

      expect(hash1).toMatch(/^0x[a-f0-9]{64}$/);
      expect(hash1).toBe(hash2);
    });

    it('produces completely different hashes if ANY attribute is modified (tamper sensitivity)', () => {
      const originalScope = compiler.compile('Book hotel under $400').scope;
      const baseHash = computeIntentCommitment(originalScope);

      // Tamper 1: Modify budget
      const tamperedBudget = { ...originalScope, maxBudget: 401 };
      expect(computeIntentCommitment(tamperedBudget)).not.toBe(baseHash);

      // Tamper 2: Modify category
      const tamperedCategory = { ...originalScope, primaryCategory: 'hardware' as const };
      expect(computeIntentCommitment(tamperedCategory)).not.toBe(baseHash);

      // Tamper 3: Modify merchant
      const tamperedMerchant = { ...originalScope, merchantDomainPattern: 'malicious-domain.com' };
      expect(computeIntentCommitment(tamperedMerchant)).not.toBe(baseHash);
    });
  });

  describe('3. Cryptographic Signing Enclave & Tamper Detection', () => {
    it('signs an intent scope and validates authentic signatures', () => {
      const scope = compiler.compile('Purchase Datadog monitoring under $350').scope;
      const token = enclave.signScope(scope);

      expect(token.commitmentHash).toMatch(/^0x/);
      expect(token.signature).toMatch(/^0xsig_/);
      expect(token.signerPublicKey).toBe(enclave.publicKeyHex);

      const isValid = enclave.verifySignature(token);
      expect(isValid).toBe(true);
    });

    it('rejects signature if scope attributes were tampered with post-signing', () => {
      const scope = compiler.compile('Purchase Datadog monitoring under $350').scope;
      const token = enclave.signScope(scope);

      // Attacker tampers with budget post-signing: $350 -> $35,000!
      token.scope.maxBudget = 35000;

      const isValid = enclave.verifySignature(token);
      expect(isValid).toBe(false); // Tamper detected!
    });

    it('serializes to base64url and deserializes without data degradation', () => {
      const scope = compiler.compile('Buy Figma seats under $90 on figma.com').scope;
      const token = enclave.signScope(scope);

      const serialized = IntentTokenManager.serialize(token);
      expect(typeof serialized).toBe('string');
      expect(serialized).not.toContain('{'); // Valid base64url

      const deserialized = IntentTokenManager.deserialize(serialized);
      expect(deserialized.scope.maxBudget).toBe(90);
      expect(deserialized.scope.merchantDomainPattern).toBe('figma.com');
      expect(deserialized.commitmentHash).toBe(token.commitmentHash);
      expect(deserialized.signature).toBe(token.signature);

      const integrity = IntentTokenManager.verifyIntegrity(deserialized);
      expect(integrity.valid).toBe(true);
    });

    it('flags expired intent tokens during integrity verification', () => {
      const scope = compiler.compile('Test intent').scope;
      // Set expired timestamp
      scope.validUntil = Date.now() - 1000;

      const token = enclave.signScope(scope);
      const integrity = IntentTokenManager.verifyIntegrity(token);

      expect(integrity.valid).toBe(false);
      expect(integrity.reason).toContain('expired');
    });
  });
});
