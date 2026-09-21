/**
 * @file packages/audit/src/tree/accumulator.ts
 * High-Performance Append-Only Merkle Compliance Accumulator for @ghost/audit.
 * Aggregates autonomous agent transaction compliance leaves into an authenticated
 * cryptographic Merkle tree root for Zero-Knowledge proof generation on Midnight.
 */

import { createHash } from 'node:crypto';
import { ComplianceLeafRecord, MerkleProof } from '../types.js';
import { createComplianceLeafRecord } from './leaf.js';

export function hashPair(left: string, right: string): string {
  const hash = createHash('sha256').update(`${left}:${right}`, 'utf8').digest('hex');
  return `0x${hash}`;
}

export const EMPTY_LEAF_ROOT =
  '0x' + createHash('sha256').update('GHOST_EMPTY_COMPLIANCE_EPOCH', 'utf8').digest('hex');

export class ComplianceMerkleAccumulator {
  public readonly epochId: string;
  private readonly records: ComplianceLeafRecord[];
  private readonly leafHashes: string[];

  constructor(epochId?: string, initialRecords?: ComplianceLeafRecord[]) {
    this.epochId = epochId || `EPOCH_${new Date().getFullYear()}_Q${Math.floor(new Date().getMonth() / 3) + 1}`;
    this.records = [];
    this.leafHashes = [];

    if (initialRecords) {
      for (const rec of initialRecords) {
        this.records.push(rec);
        this.leafHashes.push(rec.leafHash);
      }
    }
  }

  /**
   * Appends a new compliance record into the Merkle tree and updates the accumulator.
   */
  public append(record: Omit<ComplianceLeafRecord, 'leafHash'> | ComplianceLeafRecord): {
    index: number;
    leafHash: string;
    newRoot: string;
  } {
    let fullRecord: ComplianceLeafRecord;
    if ('leafHash' in record && record.leafHash) {
      fullRecord = record as ComplianceLeafRecord;
    } else {
      fullRecord = createComplianceLeafRecord(record);
    }

    const index = this.records.length;
    this.records.push(fullRecord);
    this.leafHashes.push(fullRecord.leafHash);

    return {
      index,
      leafHash: fullRecord.leafHash,
      newRoot: this.getRoot(),
    };
  }

  /**
   * Returns the total count of accumulated transaction leaves.
   */
  public getCount(): number {
    return this.records.length;
  }

  /**
   * Returns the cumulative financial volume of all accumulated transactions.
   */
  public getTotalVolume(): number {
    return this.records.reduce((sum, r) => sum + r.amount, 0);
  }

  /**
   * Returns all stored compliance leaf records.
   */
  public getRecords(): ComplianceLeafRecord[] {
    return [...this.records];
  }

  /**
   * Computes the authenticated Merkle root of all currently accumulated leaves.
   */
  public getRoot(): string {
    if (this.leafHashes.length === 0) {
      return EMPTY_LEAF_ROOT;
    }

    let currentLevel = [...this.leafHashes];

    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        // If odd number of nodes, duplicate the last node to form balanced tree
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
        nextLevel.push(hashPair(left, right));
      }
      currentLevel = nextLevel;
    }

    return currentLevel[0];
  }

  /**
   * Generates a cryptographic Merkle inclusion proof for a leaf at a given index.
   */
  public getProof(targetIndex: number): MerkleProof {
    if (targetIndex < 0 || targetIndex >= this.leafHashes.length) {
      throw new Error(`Index out of bounds: target ${targetIndex}, total leaves ${this.leafHashes.length}`);
    }

    const siblings: string[] = [];
    let currentLevel = [...this.leafHashes];
    let currentIndex = targetIndex;

    while (currentLevel.length > 1) {
      const isRightNode = currentIndex % 2 === 1;
      const siblingIndex = isRightNode ? currentIndex - 1 : currentIndex + 1;

      if (siblingIndex < currentLevel.length) {
        siblings.push(currentLevel[siblingIndex]);
      } else {
        // Unpaired leaf duplicates itself
        siblings.push(currentLevel[currentIndex]);
      }

      const nextLevel: string[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
        nextLevel.push(hashPair(left, right));
      }

      currentLevel = nextLevel;
      currentIndex = Math.floor(currentIndex / 2);
    }

    return {
      leaf: this.leafHashes[targetIndex],
      index: targetIndex,
      siblings,
      root: currentLevel[0],
    };
  }

  /**
   * Cryptographically verifies a Merkle inclusion proof against a root.
   */
  public static verifyProof(proof: MerkleProof): boolean {
    let currentHash = proof.leaf;
    let currentIndex = proof.index;

    for (const sibling of proof.siblings) {
      const isRightNode = currentIndex % 2 === 1;
      if (isRightNode) {
        currentHash = hashPair(sibling, currentHash);
      } else {
        currentHash = hashPair(currentHash, sibling);
      }
      currentIndex = Math.floor(currentIndex / 2);
    }

    return currentHash === proof.root;
  }

  /**
   * Serializes current Merkle accumulator state to JSON for persistence.
   */
  public exportSnapshot(): string {
    return JSON.stringify({
      epochId: this.epochId,
      root: this.getRoot(),
      count: this.records.length,
      totalVolume: this.getTotalVolume(),
      records: this.records,
    });
  }

  /**
   * Restores an accumulator from an exported JSON snapshot.
   */
  public static importSnapshot(snapshotJson: string): ComplianceMerkleAccumulator {
    const data = JSON.parse(snapshotJson);
    return new ComplianceMerkleAccumulator(data.epochId, data.records);
  }
}
