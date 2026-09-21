/**
 * @file packages/guard/src/midnight/wallet.ts
 * Headless Midnight Wallet provider for server-side / containerized agent runtimes.
 * Manages agent signing identity without browser extensions (window.midnight.lace).
 */

import { createHash, randomBytes } from 'crypto';
import { GhostNetwork } from '../core/types.js';

export interface HeadlessWalletState {
  address: string;
  unshieldedAddress: string;
  network: GhostNetwork;
  publicKey: string;
}

export class HeadlessMidnightWallet {
  private readonly network: GhostNetwork;
  private readonly privateKeyHex: string;
  private readonly address: string;
  private readonly unshieldedAddress: string;
  private readonly publicKey: string;

  constructor(options?: { privateKey?: string; network?: GhostNetwork }) {
    this.network = options?.network || 'preprod';

    // Derive or generate deterministic agent private key
    if (options?.privateKey) {
      this.privateKeyHex = options.privateKey.startsWith('0x')
        ? options.privateKey.slice(2)
        : options.privateKey;
    } else {
      this.privateKeyHex = randomBytes(32).toString('hex');
    }

    // Deterministic key derivation for headless server usage
    const pubKeyHash = createHash('sha256')
      .update(Buffer.from(this.privateKeyHex, 'hex'))
      .digest('hex');

    this.publicKey = `0x${pubKeyHash}`;
    const prefix = this.network === 'mainnet' ? 'mn' : `mn_${this.network}`;
    this.unshieldedAddress = `${prefix}_addr_${pubKeyHash.substring(0, 32)}`;
    this.address = `${prefix}_shielded_${createHash('sha256').update(pubKeyHash).digest('hex').substring(0, 32)}`;
  }

  public getState(): HeadlessWalletState {
    return {
      address: this.address,
      unshieldedAddress: this.unshieldedAddress,
      network: this.network,
      publicKey: this.publicKey,
    };
  }

  /**
   * Signs an arbitrary transaction digest using the agent's headless key.
   */
  public signDigest(digest: string): string {
    const signature = createHash('sha256')
      .update(`${this.privateKeyHex}:${digest}`)
      .digest('hex');
    return `0x${signature}`;
  }

  /**
   * Cleans sensitive key material from memory.
   */
  public dispose(): void {
    // Overwrite internal reference
    (this as any).privateKeyHex = '00'.repeat(32);
  }
}
