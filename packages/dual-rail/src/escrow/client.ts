/**
 * @file packages/dual-rail/src/escrow/client.ts
 * Midnight Compact Escrow client for virtual card collateral locking and settlement.
 * Interfaces with contracts/card_escrow.compact.
 */

import { createHash } from 'crypto';

export interface EscrowLockReceipt {
  lockDigest: string;
  depositAmount: number;
  currency: string;
  timestamp: string;
  contractAddress: string;
}

export interface EscrowLedgerState {
  escrowLockedBalance: bigint;
  totalSettledBalance: bigint;
  activeCardCommitment: string;
}

export class MidnightCardEscrowClient {
  public readonly contractAddress: string;
  private lockedBalance: bigint = 0n;
  private settledBalance: bigint = 0n;
  private activeCommitment: string = '0x' + '00'.repeat(32);

  constructor(contractAddress: string = '0xd72f60d3f297dc84078e19677b60e88759f9982a3ea3dbf87a387814cda034ad') {
    this.contractAddress = contractAddress;
  }

  /**
   * Locks collateral funds in the Midnight Compact Escrow contract before an ephemeral card is minted.
   */
  public async lockCollateral(depositAmount: number, cardMemo: string = 'agent_card'): Promise<EscrowLockReceipt> {
    if (depositAmount <= 0) {
      throw new Error('[MidnightEscrow] Deposit amount must be positive.');
    }

    const timestamp = new Date().toISOString();
    const cardCommitment =
      '0x' + createHash('sha256').update(`${depositAmount}:${cardMemo}:${timestamp}`).digest('hex');

    // Emulate on-chain Compact circuit state transition: lock_escrow
    this.lockedBalance += BigInt(Math.round(depositAmount));
    this.activeCommitment = cardCommitment;

    return {
      lockDigest: cardCommitment,
      depositAmount,
      currency: 'USD',
      timestamp,
      contractAddress: this.contractAddress,
    };
  }

  /**
   * Settles locked collateral when a card charge is authorized on the fiat network.
   */
  public async settleCollateral(settleAmount: number, settlementDigest: string): Promise<void> {
    const amountBig = BigInt(Math.round(settleAmount));
    if (amountBig > this.lockedBalance) {
      throw new Error(
        `[MidnightEscrow] Settlement amount ($${settleAmount}) exceeds locked collateral ($${this.lockedBalance.toString()}).`
      );
    }

    // Emulate on-chain Compact circuit state transition: settle_escrow
    this.lockedBalance -= amountBig;
    this.settledBalance += amountBig;
  }

  /**
   * Refunds collateral if an ephemeral card expires uncharged.
   */
  public async refundExpired(refundAmount: number): Promise<void> {
    const amountBig = BigInt(Math.round(refundAmount));
    if (amountBig > this.lockedBalance) {
      throw new Error('[MidnightEscrow] Refund amount exceeds locked collateral.');
    }

    this.lockedBalance -= amountBig;
  }

  public getLedgerState(): EscrowLedgerState {
    return {
      escrowLockedBalance: this.lockedBalance,
      totalSettledBalance: this.settledBalance,
      activeCardCommitment: this.activeCommitment,
    };
  }
}
