/**
 * @file tests/dual-rail-router.test.ts
 * Rigorous test suite for DualRailRouter, BrowserCheckoutEnclave, and EscrowReconciler.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import {
  DualRailRouter,
  BrowserCheckoutEnclave,
  EscrowReconciler,
  MidnightCardEscrowClient,
  StripeIssuingSimulator,
  createX402PaywallServer,
  PaywallServerInstance,
} from '../packages/dual-rail/src/index.js';

describe('@ghost/dual-rail: Universal Router & Checkout Enclave', () => {
  describe('1. Browser Form Checkout Enclave', () => {
    it('injects single-use credentials into payment form fields and immediately zeroes memory', async () => {
      const enclave = new BrowserCheckoutEnclave();
      const simulator = new StripeIssuingSimulator();

      const card = await simulator.createEphemeralCard({
        spendingLimit: 85,
        escrowLockDigest: '0xescrow_mock',
      });

      const filledFields: Record<string, string> = {};
      const mockPage = {
        fill: vi.fn(async (selector: string, value: string) => {
          filledFields[selector] = value;
        }),
      };

      expect(card.credentials.isZeroed).toBe(false);

      const result = await enclave.injectCardIntoForm(mockPage, card, 'Agent Smith');

      expect(result.injected).toBe(true);
      expect(result.brand).toBe('Visa');
      expect(result.maskedPan).toMatch(/^\*\*\*\* \*\*\*\* \*\*\*\* \d{4}$/);
      expect(result.cardZeroed).toBe(true);

      // Verify memory was wiped!
      expect(card.credentials.isZeroed).toBe(true);
      expect(() => card.credentials.getPan()).toThrow('Access Violation');
      expect(mockPage.fill).toHaveBeenCalled();
    });

    it('ensures card memory is zeroed even if form injection encounters an error', async () => {
      const enclave = new BrowserCheckoutEnclave();
      const simulator = new StripeIssuingSimulator();

      const card = await simulator.createEphemeralCard({
        spendingLimit: 50,
        escrowLockDigest: '0xescrow_err',
      });

      const failingPage = {
        fill: vi.fn(async () => {
          throw new Error('Element not found on DOM');
        }),
      };

      await expect(enclave.injectCardIntoForm(failingPage, card)).rejects.toThrow('Form injection failed');
      expect(card.credentials.isZeroed).toBe(true);
    });
  });

  describe('2. Escrow Settlement & Refund Reconciler', () => {
    it('handles partial captures by settling captured amount and auto-refunding difference', async () => {
      const escrow = new MidnightCardEscrowClient();
      const reconciler = new EscrowReconciler(escrow);

      // 1. Initial lock: $100
      await escrow.lockCollateral(100);
      expect(escrow.getLedgerState().escrowLockedBalance).toBe(100n);

      // 2. Hotel/SaaS capture is only $70 (authorized $100)
      const report = await reconciler.reconcileSettlement('card_partial_01', 100, 70);

      expect(report.status).toBe('settled_partial_refund');
      expect(report.capturedAmount).toBe(70);
      expect(report.refundedAmount).toBe(30);

      // Escrow balance should have settled $70 and refunded $30 -> leaving 0 locked
      const ledger = escrow.getLedgerState();
      expect(ledger.escrowLockedBalance).toBe(0n);
      expect(ledger.totalSettledBalance).toBe(70n);
    });

    it('scans and refunds expired uncharged cards back to Midnight escrow', async () => {
      const escrow = new MidnightCardEscrowClient();
      const simulator = new StripeIssuingSimulator();
      const reconciler = new EscrowReconciler(escrow);

      await escrow.lockCollateral(200);

      // Create expired card (ttl = -1 second)
      const expiredCard = await simulator.createEphemeralCard({
        spendingLimit: 200,
        escrowLockDigest: '0xexpired_lock',
        ttlSeconds: -1,
      });

      const reports = await reconciler.reconcileExpiredCards([expiredCard]);

      expect(reports.length).toBe(1);
      expect(reports[0].status).toBe('expired_refunded');
      expect(reports[0].refundedAmount).toBe(200);
      expect(expiredCard.status).toBe('expired');
      expect(expiredCard.credentials.isZeroed).toBe(true);
      expect(escrow.getLedgerState().escrowLockedBalance).toBe(0n);
    });
  });

  describe('3. Intelligent DualRailRouter', () => {
    let paywallServer: PaywallServerInstance;
    let router: DualRailRouter;

    beforeAll(async () => {
      paywallServer = await createX402PaywallServer({
        pricePerRequest: 10,
        currency: 'tDUST',
      });
      router = new DualRailRouter();
    });

    afterAll(async () => {
      await paywallServer.close();
    });

    it('routes to Machine Rail (x402) for HTTP paywalls', async () => {
      const result = await router.pay({
        target: paywallServer.url,
        amount: 15,
        currency: 'tDUST',
        rail: 'm2m_x402',
      });

      expect(result.railUsed).toBe('m2m_x402');
      expect(result.success).toBe(true);
      expect(result.response.data).toContain('Unlocked high-value AI inference dataset');
      expect(result.latencyMs).toBeGreaterThan(0);
    });

    it('routes to Fiat Rail (Ephemeral Card) for web and checkout purchases', async () => {
      const result = await router.pay({
        target: 'https://checkout.stripe.com/pay/cs_live_12345',
        amount: 60,
        merchant: 'Vercel Pro Plan',
        rail: 'fiat_card',
      });

      expect(result.railUsed).toBe('fiat_card');
      expect(result.success).toBe(true);
      expect(result.amount).toBe(60);
      expect(result.card).toBeDefined();
      expect(result.card?.spendingLimit).toBe(60);
      expect(result.card?.credentials.getMaskedPan()).toMatch(/^\*\*\*\* \*\*\*\* \*\*\*\* \d{4}$/);
      expect(result.card?.status).toBe('active');
    });

    it('auto-probes and selects appropriate rail dynamically', async () => {
      // Probing paywall server should detect 402 and route to m2m_x402
      const res = await router.pay({
        target: paywallServer.url,
        amount: 20,
        rail: 'auto',
      });

      expect(res.railUsed).toBe('m2m_x402');
      expect(res.success).toBe(true);
    });
  });
});
