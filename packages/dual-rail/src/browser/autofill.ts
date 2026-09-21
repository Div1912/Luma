/**
 * @file packages/dual-rail/src/browser/autofill.ts
 * Headless browser form injection enclave for autonomous checkout agents.
 * Safely injects ephemeral virtual card data into web payment forms and zeroes memory immediately.
 */

import { EphemeralCard } from '../fiat/provider.js';

export interface FormSelectorMap {
  cardNumberInput?: string;
  cvvInput?: string;
  expiryInput?: string;
  expMonthInput?: string;
  expYearInput?: string;
  cardholderNameInput?: string;
}

export interface FormInjectionResult {
  injected: boolean;
  maskedPan: string;
  brand: string;
  cardZeroed: boolean;
  timestamp: string;
}

export interface PageLike {
  fill?: (selector: string, value: string) => Promise<void>;
  type?: (selector: string, value: string) => Promise<void>;
  [key: string]: any;
}

export class BrowserCheckoutEnclave {
  private readonly defaultSelectors: Required<FormSelectorMap> = {
    cardNumberInput: 'input[name="cardNumber"], input[name="cardnumber"], #card-number, #cardNumber, input[autocomplete="cc-number"]',
    cvvInput: 'input[name="cvv"], input[name="cvc"], #cvv, #cvc, input[autocomplete="cc-csc"]',
    expiryInput: 'input[name="expiry"], input[name="exp-date"], #expiry, input[autocomplete="cc-exp"]',
    expMonthInput: 'input[name="expMonth"], #expMonth, select[name="expMonth"]',
    expYearInput: 'input[name="expYear"], #expYear, select[name="expYear"]',
    cardholderNameInput: 'input[name="cardholderName"], input[name="name"], #cardholder-name, input[autocomplete="cc-name"]',
  };

  /**
   * Injects ephemeral card credentials into standard checkout forms and immediately wipes memory.
   */
  public async injectCardIntoForm(
    page: PageLike,
    card: EphemeralCard,
    cardholderName: string = 'Ghost Autonomous Agent',
    customSelectors?: FormSelectorMap
  ): Promise<FormInjectionResult> {
    const selectors = { ...this.defaultSelectors, ...customSelectors };
    const filler = page.fill || page.type;

    if (!filler) {
      throw new Error('[BrowserCheckoutEnclave] Invalid page object: missing fill or type method.');
    }

    try {
      // 1. Read single-use credentials from secure enclave
      const pan = card.credentials.getPan();
      const cvv = card.credentials.getCvv();
      const expMonthStr = String(card.credentials.expMonth).padStart(2, '0');
      const expYearStr = String(card.credentials.expYear).slice(-2);
      const combinedExpiry = `${expMonthStr}/${expYearStr}`;

      // 2. Inject into target fields
      await filler.call(page, selectors.cardNumberInput, pan);
      await filler.call(page, selectors.cvvInput, cvv);

      // Handle combined expiry vs split month/year inputs
      try {
        await filler.call(page, selectors.expiryInput, combinedExpiry);
      } catch {
        // Fallback to separate month and year
        if (selectors.expMonthInput) await filler.call(page, selectors.expMonthInput, expMonthStr);
        if (selectors.expYearInput) await filler.call(page, selectors.expYearInput, expYearStr);
      }

      // Cardholder name
      try {
        await filler.call(page, selectors.cardholderNameInput, cardholderName);
      } catch {
        // Optional field
      }

      const maskedPan = card.credentials.getMaskedPan();
      const brand = card.credentials.brand;

      // 3. Immediately zero card credentials from memory!
      card.credentials.wipe();

      return {
        injected: true,
        maskedPan,
        brand,
        cardZeroed: card.credentials.isZeroed,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      // Ensure memory is zeroed even on error
      card.credentials.wipe();
      throw new Error(`[BrowserCheckoutEnclave] Form injection failed: ${err.message}`);
    }
  }
}
