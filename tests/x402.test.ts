/**
 * @file tests/x402.test.ts
 * Rigorous test suite for @ghost/dual-rail x402 HTTP micropayment protocol engine.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import {
  ghostFetch,
  parseL402Challenge,
  X402MicropaymentProver,
  createX402PaywallServer,
  PaywallServerInstance,
  GhostPaywallError,
} from '../packages/dual-rail/src/index.js';

describe('@ghost/dual-rail: x402 Micropayment Protocol', () => {
  describe('1. Challenge Header Parser', () => {
    it('parses valid WWW-Authenticate L402 challenge headers', () => {
      const header =
        'L402 contract="0xd72f60d3f297dc84078e19677b60e88759f9982a3ea3dbf87a387814cda034ad", amount="25.5", currency="tDUST", nonce="0xabc123", network="preprod"';

      const challenge = parseL402Challenge(header);
      expect(challenge).not.toBeNull();
      expect(challenge?.contract).toBe('0xd72f60d3f297dc84078e19677b60e88759f9982a3ea3dbf87a387814cda034ad');
      expect(challenge?.amount).toBe(25.5);
      expect(challenge?.currency).toBe('TDUST');
      expect(challenge?.nonce).toBe('0xabc123');
      expect(challenge?.network).toBe('preprod');
    });

    it('parses X402 formatted challenge headers', () => {
      const header = 'X402 contract="0x999", amount="10", currency="ADA", nonce="0xdef456"';
      const challenge = parseL402Challenge(header);
      expect(challenge).not.toBeNull();
      expect(challenge?.amount).toBe(10);
      expect(challenge?.currency).toBe('ADA');
    });

    it('returns null on malformed or empty challenge headers', () => {
      expect(parseL402Challenge(null)).toBeNull();
      expect(parseL402Challenge('')).toBeNull();
      expect(parseL402Challenge('Bearer token123')).toBeNull();
      expect(parseL402Challenge('L402 amount="invalid"')).toBeNull();
    });
  });

  describe('2. ZK Micropayment Prover', () => {
    it('synthesizes cryptographic payment proof and formats authorization header', () => {
      const prover = new X402MicropaymentProver({ agentId: 'agent_crawler_1' });
      const challenge = {
        contract: '0xd72f60d3f297dc84078e19677b60e88759f9982a3ea3dbf87a387814cda034ad',
        amount: 5,
        currency: 'tDUST',
        nonce: '0xservernonce999',
        network: 'preprod',
      };

      const proof = prover.synthesizePayment(challenge);
      expect(proof.proofHash).toMatch(/^0xzk_m2m_/);
      expect(proof.digest).toMatch(/^0x/);
      expect(proof.nonce).toBe('0xservernonce999');

      const authHeader = prover.formatAuthorizationHeader(proof);
      expect(authHeader).toContain('L402 proof="0xzk_m2m_');
      expect(authHeader).toContain('nonce="0xservernonce999"');
    });
  });

  describe('3. Automated Paywall Resolution End-to-End (ghostFetch <-> PaywallServer)', () => {
    let paywallServer: PaywallServerInstance;

    beforeAll(async () => {
      paywallServer = await createX402PaywallServer({
        pricePerRequest: 15,
        currency: 'tDUST',
      });
    });

    afterAll(async () => {
      await paywallServer.close();
    });

    it('intercepts HTTP 402, proves in ZK, retries, and returns 200 OK transparently', async () => {
      const paymentSettledCallback = vi.fn();

      const response = await ghostFetch(paywallServer.url, undefined, {
        maxSpendPerCall: 50,
        onPaymentSettled: paymentSettledCallback,
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toContain('Unlocked high-value AI inference dataset');
      expect(data.settledPrice).toBe(15);
      expect(data.currency).toBe('tDUST');

      expect(paywallServer.getSettledCount()).toBe(1);
      expect(paymentSettledCallback).toHaveBeenCalledTimes(1);

      const callbackArg = paymentSettledCallback.mock.calls[0][0];
      expect(callbackArg.amount).toBe(15);
      expect(callbackArg.currency).toBe('TDUST');
      expect(callbackArg.proofHash).toMatch(/^0xzk_m2m_/);
    });

    it('rejects paywalls when challenge exceeds maxSpendPerCall limit', async () => {
      const onBlocked = vi.fn();

      // Set maxSpendPerCall = 5, server requires 15
      await expect(
        ghostFetch(paywallServer.url, undefined, {
          maxSpendPerCall: 5,
          onPaymentBlocked: onBlocked,
        })
      ).rejects.toThrow(GhostPaywallError);

      expect(onBlocked).toHaveBeenCalledTimes(1);
      expect(onBlocked.mock.calls[0][0]).toContain('exceeds max allowable spend per call');
    });

    it('detects and rejects replay attacks on duplicate nonce submissions', async () => {
      const prover = new X402MicropaymentProver();
      const fixedNonce = '0xunique_replay_test_nonce_777';
      const challenge = {
        contract: '0xd72f60d3f297dc84078e19677b60e88759f9982a3ea3dbf87a387814cda034ad',
        amount: 15,
        currency: 'tDUST',
        nonce: fixedNonce,
        network: 'preprod',
      };

      const proof = prover.synthesizePayment(challenge);
      const authHeader = prover.formatAuthorizationHeader(proof);

      // First submission: passes
      const res1 = await fetch(paywallServer.url, {
        headers: { Authorization: authHeader },
      });
      expect(res1.status).toBe(200);

      // Duplicate submission with same nonce: rejected with 403 Replay Attack Detected
      const res2 = await fetch(paywallServer.url, {
        headers: { Authorization: authHeader },
      });
      expect(res2.status).toBe(403);
      const errorData = await res2.json();
      expect(errorData.error).toContain('Replay Attack Detected');
    });
  });
});
