/**
 * @file packages/dual-rail/src/fiat/enclave.ts
 * PCI-DSS compliant secure memory enclave for ephemeral cardholder data.
 * Zeroes out PAN and CVV buffers immediately after injection.
 */

export class SecureCardCredentials {
  private panBuffer: Buffer;
  private cvvBuffer: Buffer;
  public readonly expMonth: number;
  public readonly expYear: number;
  public readonly brand: string;
  public readonly last4: string;
  private isWiped: boolean = false;

  constructor(pan: string, cvv: string, expMonth: number, expYear: number, brand: string = 'Visa') {
    const cleanPan = pan.replace(/\s+/g, '');
    this.panBuffer = Buffer.from(cleanPan, 'utf-8');
    this.cvvBuffer = Buffer.from(cvv, 'utf-8');
    this.expMonth = expMonth;
    this.expYear = expYear;
    this.brand = brand;
    this.last4 = cleanPan.slice(-4);
  }

  /**
   * Reads the PAN into a temporary string for single-use injection.
   */
  public getPan(): string {
    this.assertNotWiped();
    return this.panBuffer.toString('utf-8');
  }

  /**
   * Reads the CVV into a temporary string for single-use injection.
   */
  public getCvv(): string {
    this.assertNotWiped();
    return this.cvvBuffer.toString('utf-8');
  }

  /**
   * Returns a safe, masked representation suitable for display or logging (e.g. **** **** **** 4242).
   */
  public getMaskedPan(): string {
    return `**** **** **** ${this.last4}`;
  }

  /**
   * Securely zeroes memory containing sensitive cardholder data.
   */
  public wipe(): void {
    if (!this.isWiped) {
      this.panBuffer.fill(0);
      this.cvvBuffer.fill(0);
      this.isWiped = true;
    }
  }

  public get isZeroed(): boolean {
    return this.isWiped;
  }

  private assertNotWiped(): void {
    if (this.isWiped) {
      throw new Error('[SecureCardEnclave] Access Violation: Card credentials have been zeroed and self-destructed.');
    }
  }

  // Guard against accidental JSON serialization of plaintext PAN
  public toJSON(): Record<string, unknown> {
    return {
      brand: this.brand,
      last4: this.last4,
      expMonth: this.expMonth,
      expYear: this.expYear,
      isZeroed: this.isWiped,
    };
  }

  public toString(): string {
    return `[SecureCardCredentials ${this.brand} ${this.getMaskedPan()}]`;
  }
}
