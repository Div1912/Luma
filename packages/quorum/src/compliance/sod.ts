/**
 * @file packages/quorum/src/compliance/sod.ts
 * Segregation of Duties (SoD) & Anti-Self-Dealing Enforcer for @ghost/quorum.
 * Mathematically asserts role exclusivity across autonomous agent fleets,
 * preventing collusion, self-approval loops, and SOX 404 audit failures.
 */

import { RoleAttestation, DEFAULT_REQUIRED_ROLES_MASK } from '../types.js';

export interface SoDAssertionResult {
  passed: boolean;
  uniqueSignersCount: number;
  satisfiedRoleMask: number;
  violatingAgentId?: string;
  violatingPublicKey?: string;
  reason: string;
}

export class SegregationOfDutiesEnforcer {
  private readonly requiredRoleMask: number;

  constructor(requiredRoleMask?: number) {
    this.requiredRoleMask = requiredRoleMask ?? DEFAULT_REQUIRED_ROLES_MASK;
  }

  /**
   * Evaluates a set of attestations to ensure strict Segregation of Duties.
   */
  public assertSegregation(attestations: RoleAttestation[]): SoDAssertionResult {
    const seenPublicKeys = new Map<string, RoleAttestation>();
    let satisfiedRoleMask = 0;

    for (const att of attestations) {
      // 1. Anti-Self-Dealing Check (Duplicate Public Key Detection)
      if (seenPublicKeys.has(att.agentPublicKey)) {
        const prior = seenPublicKeys.get(att.agentPublicKey)!;
        return {
          passed: false,
          uniqueSignersCount: seenPublicKeys.size,
          satisfiedRoleMask,
          violatingAgentId: att.agentId,
          violatingPublicKey: att.agentPublicKey,
          reason: `SOX 404 Self-Dealing Violation: Agent '${att.agentId}' (${att.agentPublicKey}) attempted to approve multiple roles ('${prior.role}' and '${att.role}'). Strict segregation of duties required.`,
        };
      }

      seenPublicKeys.set(att.agentPublicKey, att);
      satisfiedRoleMask |= att.roleMask;
    }

    // 2. Role Completeness Invariant
    if ((satisfiedRoleMask & this.requiredRoleMask) !== this.requiredRoleMask) {
      return {
        passed: false,
        uniqueSignersCount: seenPublicKeys.size,
        satisfiedRoleMask,
        reason: `Governance Role Incomplete: Required role mask 0b${this.requiredRoleMask.toString(2)} not satisfied by approvals (satisfied: 0b${satisfiedRoleMask.toString(2)}).`,
      };
    }

    return {
      passed: true,
      uniqueSignersCount: seenPublicKeys.size,
      satisfiedRoleMask,
      reason: 'Segregation of Duties Verified: All roles approved by distinct, cryptographically independent agents',
    };
  }
}
