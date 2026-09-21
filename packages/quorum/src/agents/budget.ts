/**
 * @file packages/quorum/src/agents/budget.ts
 * Autonomous Budget Controller Specialist Bot for @ghost/quorum.
 * Maintains real-time departmental budget ledgers, enforces quarterly cost-center caps,
 * atomically commits spending allocations, and emits signed BudgetAttestations.
 */

import { AgentIdentity } from '../crypto/identity.js';
import { computeOrderIntentDigest } from '../crypto/digest.js';
import { OrderIntent, RoleAttestation } from '../types.js';

export interface DepartmentBudget {
  department: string;
  quarter: string;
  allocatedBudget: number;
  committedSpend: number;
  remainingHeadroom: number;
}

export interface BudgetControllerBotConfig {
  agentId?: string;
  privateKeyDerHex?: string;
  quarter?: string;
  initialBudgets?: Record<string, number>;
}

export const DEFAULT_DEPARTMENT_BUDGETS: Record<string, number> = {
  ENG_INFRA: 100_000,
  DATA_AI: 80_000,
  SECURITY_OPS: 50_000,
  MARKETING: 40_000,
  GENERAL_ADMIN: 25_000,
};

export class BudgetControllerBot {
  public readonly identity: AgentIdentity;
  private readonly quarter: string;
  private readonly ledgers: Map<string, DepartmentBudget>;

  constructor(config?: BudgetControllerBotConfig) {
    this.identity = new AgentIdentity(
      config?.agentId || 'budget_controller_bot_01',
      'BUDGET_CONTROLLER',
      config?.privateKeyDerHex
    );

    this.quarter = config?.quarter || 'Q3-2026';
    this.ledgers = new Map();

    const budgets = config?.initialBudgets || DEFAULT_DEPARTMENT_BUDGETS;
    for (const [dept, allocation] of Object.entries(budgets)) {
      this.allocateDepartmentBudget(dept, allocation, this.quarter);
    }
  }

  /**
   * Allocates or updates quarterly budget for a specific cost center.
   */
  public allocateDepartmentBudget(dept: string, allocatedBudget: number, quarter?: string): void {
    const key = dept.trim().toUpperCase();
    const q = quarter || this.quarter;
    const existing = this.ledgers.get(key);
    const committedSpend = existing ? existing.committedSpend : 0;

    this.ledgers.set(key, {
      department: key,
      quarter: q,
      allocatedBudget,
      committedSpend,
      remainingHeadroom: Math.max(0, allocatedBudget - committedSpend),
    });
  }

  /**
   * Returns current ledger snapshot for a department.
   */
  public getDepartmentBudget(dept: string): DepartmentBudget | undefined {
    return this.ledgers.get(dept.trim().toUpperCase());
  }

  /**
   * Audits department budget headroom and commits spend upon approval.
   */
  public evaluateOrder(order: OrderIntent): RoleAttestation {
    const orderIntentDigest = computeOrderIntentDigest(order);
    const deptKey = order.department.trim().toUpperCase();
    const budget = this.ledgers.get(deptKey);

    // 1. Department Existence Check
    if (!budget) {
      return this.identity.signAttestation({
        orderIntentDigest,
        approved: false,
        rejectionReason: `Budget Rejection: Cost center / department '${order.department}' is not recognized in current fiscal plan`,
        assertionDetails: { department: order.department },
      });
    }

    // 2. Budget Headroom Solvency Check
    if (order.amount > budget.remainingHeadroom) {
      return this.identity.signAttestation({
        orderIntentDigest,
        approved: false,
        rejectionReason: `Budget Headroom Exhausted: Requisition of $${order.amount} exceeds remaining ${deptKey} headroom of $${budget.remainingHeadroom} (Allocated: $${budget.allocatedBudget}, Committed: $${budget.committedSpend})`,
        assertionDetails: {
          department: deptKey,
          requestedAmount: order.amount,
          remainingHeadroom: budget.remainingHeadroom,
          allocatedBudget: budget.allocatedBudget,
          committedSpend: budget.committedSpend,
        },
      });
    }

    // 3. Atomic Allocation Commit: Reserve funds from headroom
    const headroomBefore = budget.remainingHeadroom;
    budget.committedSpend += order.amount;
    budget.remainingHeadroom -= order.amount;
    const headroomAfter = budget.remainingHeadroom;

    // 4. Positive Attestation Emission
    return this.identity.signAttestation({
      orderIntentDigest,
      approved: true,
      assertionDetails: {
        department: deptKey,
        quarter: budget.quarter,
        allocatedBudget: budget.allocatedBudget,
        committedSpend: budget.committedSpend,
        headroomBefore,
        headroomAfter,
        allocationCommitted: true,
      },
    });
  }
}
