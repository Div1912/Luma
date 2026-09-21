/**
 * @file tests/fiat-rail.test.ts
 * Rigorous test suite for Fiat Rail (Ephemeral Virtual Cards & Midnight ZK Escrow).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  SecureCardCredentials,
  StripeIssuingSimulator,
  WebhookAuthorizationDaemon,
  MidnightCardEscrowClient,
  WebhookPayload,
} from '../packages/dual-rail/src/index.js';

describe('@ghost/dual-rail: Fiat Ephemeral Cards & ZK Escrow', () => {
  describe('1. Secure Memory Enclave (PCI-DSS Compliance)', () => {
    it('provides single-use access to PAN and CVV then securely zeroes memory on wipe', () => {
      const credentials = new SecureCardCredentials('4242424242421234', '987', 12, 2028, 'Visa');

      expect(credentials.getPan()).toBe('4242424242421234');
      expect(credentials.getCvv()).toBe('987');
      expect(credentials.getMaskedPan()).toBe('**** **** **** 1234');
      expect(credentials.last4).toBe('1234');
      expect(credentials.isZeroed).toBe(false);

      // Perform secure wipe (memory zeroing)
      credentials.wipe();
      expect(credentials.isZeroed).toBe(true);

      // Subsequent access must strictly throw Access Violation
      expect(() => credentials.getPan()).toThrow('Access Violation');
      expect(() => credentials.getCvv()).toThrow('Access Violation');
    });

    it('prevents plaintext card numbers from leaking into JSON serialization or toString', () => {
      const credentials = new SecureCardCredentials('4242424242429999', '555', 6, 2027);

      const jsonStr = JSON.stringify(credentials);
      expect(jsonStr).not.toContain('4242424242429999');
      expect(jsonStr).toContain('"last4":"9999"');

      const strRep = credentials.toString();
      expect(strRep).not.toContain('4242424242429999');
      expect(strRep).toContain('**** **** **** 9999');
    });
  });

  describe('2. Ephemeral Card Lifecycle & Spending Bounds', () => {
    let simulator: StripeIssuingSimulator;
    let escrowClient: MidnightCardEscrowClient;

    beforeEach(() => {
      simulator = new StripeIssuingSimulator();
      escrowClient = new MidnightCardEscrowClient();
    });

    it('mints an ephemeral card, approves compliant charge, and immediately self-destructs', async () => {
      // 1. Lock collateral in Midnight ZK escrow
      const escrow = await escrowClient.lockCollateral(100, 'AWS Cloud Purchase');

      // 2. Mint single-use card with $100 spending limit locked to 'aws'
      const card = await simulator.createEphemeralCard({
        spendingLimit: 100,
        merchantBound: 'aws',
        escrowLockDigest: escrow.lockDigest,
      });

      expect(card.status).toBe('active');
      expect(card.spendingLimit).toBe(100);
      expect(card.credentials.isZeroed).toBe(false);

      // 3. Process Visa authorization for $75 at AWS
      const decision = await simulator.handleAuthorizationRequest({
        id: 'auth_req_001',
        cardId: card.id,
        amount: 75,
        currency: 'USD',
        merchant: 'Amazon Web Services (AWS)',
        merchantDomain: 'aws.amazon.com',
      });

      expect(decision.approved).toBe(true);
      expect(decision.responseCode).toBe('approve');
      expect(decision.selfDestructed).toBe(true);
      expect(decision.latencyMs).toBeLessThan(100);

      // 4. Verify card transitioned to 'consumed' and memory was zeroed!
      const updatedCard = await simulator.getCard(card.id);
      expect(updatedCard?.status).toBe('consumed');
      expect(updatedCard?.credentials.isZeroed).toBe(true);

      // Settle on Midnight
      await escrowClient.settleCollateral(75, '0xsettle_digest');
      const ledger = escrowClient.getLedgerState();
      expect(ledger.escrowLockedBalance).toBe(25n);
      expect(ledger.totalSettledBalance).toBe(75n);
    });

    it('declines charges exceeding the single-use spending limit', async () => {
      const card = await simulator.createEphemeralCard({
        spendingLimit: 50,
        escrowLockDigest: '0xescrow123',
      });

      const decision = await simulator.handleAuthorizationRequest({
        id: 'auth_req_002',
        cardId: card.id,
        amount: 90, // $90 > $50 limit
        currency: 'USD',
        merchant: 'GitHub',
      });

      expect(decision.approved).toBe(false);
      expect(decision.responseCode).toBe('decline');
      expect(decision.reason).toContain('exceeds single-use card spending limit');

      // Card remains active for a retry within limit
      const updatedCard = await simulator.getCard(card.id);
      expect(updatedCard?.status).toBe('active');
    });

    it('declines charges with mismatched merchant domain (merchant lock)', async () => {
      const card = await simulator.createEphemeralCard({
        spendingLimit: 200,
        merchantBound: 'openai.com',
        escrowLockDigest: '0xescrow456',
      });

      const decision = await simulator.handleAuthorizationRequest({
        id: 'auth_req_003',
        cardId: card.id,
        amount: 50,
        currency: 'USD',
        merchant: 'Suspicious Store',
        merchantDomain: 'evil-store.com',
      });

      expect(decision.approved).toBe(false);
      expect(decision.responseCode).toBe('decline');
      expect(decision.reason).toContain('Merchant lock violation');
    });
  });

  describe('3. Sub-2-Second Webhook Authorization Daemon', () => {
    it('processes Stripe issuing_authorization.request in <200ms well within network SLA', async () => {
      const simulator = new StripeIssuingSimulator();
      const daemon = new WebhookAuthorizationDaemon(simulator, 2000);

      const card = await simulator.createEphemeralCard({
        spendingLimit: 150,
        merchantBound: 'github',
        escrowLockDigest: '0xlock_999',
      });

      const webhookPayload: WebhookPayload = {
        type: 'issuing_authorization.request',
        data: {
          object: {
            id: 'iauth_test_001',
            card: card.id,
            amount: 4250, // 4250 cents = $42.50
            currency: 'usd',
            merchant_data: {
              name: 'GitHub Inc',
              category: 'software',
            },
          },
        },
      };

      const decision = await daemon.handleWebhook(webhookPayload);

      expect(decision.approved).toBe(true);
      expect(decision.responseCode).toBe('approve');
      expect(decision.latencyMs).toBeLessThan(200); // Sub-200ms processing
      expect(decision.selfDestructed).toBe(true);
    });
  });

  describe('4. Midnight Compact Escrow Lifecycle', () => {
    it('locks collateral, settles spends, and refunds uncharged balances', async () => {
      const escrow = new MidnightCardEscrowClient();

      // Lock $300 collateral
      const receipt = await escrow.lockCollateral(300, 'Agent Fleet Allowance');
      expect(receipt.depositAmount).toBe(300);
      expect(escrow.getLedgerState().escrowLockedBalance).toBe(300n);

      // Settle $120
      await escrow.settleCollateral(120, '0xsettle_proof_1');
      expect(escrow.getLedgerState().escrowLockedBalance).toBe(180n);
      expect(escrow.getLedgerState().totalSettledBalance).toBe(120n);

      // Refund remaining $180 expired collateral
      await escrow.refundExpired(180);
      expect(escrow.getLedgerState().escrowLockedBalance).toBe(0n);

      // Attempting to settle more than available collateral throws
      await expect(escrow.settleCollateral(50, '0xinvalid')).rejects.toThrow('exceeds locked collateral');
    });
  });
});
