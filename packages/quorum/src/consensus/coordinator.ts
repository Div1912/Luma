/**
 * @file packages/quorum/src/consensus/coordinator.ts
 * Multi-Agent Consensus Coordinator Engine for @ghost/quorum.
 * Orchestrates parallel evaluation across autonomous specialist agents,
 * asserts Segregation of Duties (SoD), synthesizes ZK witnesses, and settles on Midnight.
 */

import { randomBytes } from 'node:crypto';
import {
  OrderIntent,
  QuorumConsensusReceipt,
  RoleAttestation,
  DEFAULT_REQUIRED_ROLES_MASK,
} from '../types.js';
import { ProcurementBot } from '../agents/procurement.js';
import { ComplianceBot } from '../agents/compliance.js';
import { BudgetControllerBot } from '../agents/budget.js';
import { SegregationOfDutiesEnforcer } from '../compliance/sod.js';
import { QuorumWitnessSynthesizer } from '../midnight/prover.js';
import { GhostQuorumContractClient } from '../midnight/contract.js';
import { computeOrderIntentDigest } from '../crypto/digest.js';

export interface QuorumCoordinatorConfig {
  procurementBot?: ProcurementBot;
  complianceBot?: ComplianceBot;
  budgetBot?: BudgetControllerBot;
  sodEnforcer?: SegregationOfDutiesEnforcer;
  witnessSynthesizer?: QuorumWitnessSynthesizer;
  contractClient?: GhostQuorumContractClient;
  requiredRoleMask?: number;
  minimumQuorumThreshold?: number;
}

export class QuorumCoordinator {
  public readonly procurementBot: ProcurementBot;
  public readonly complianceBot: ComplianceBot;
  public readonly budgetBot: BudgetControllerBot;
  public readonly sodEnforcer: SegregationOfDutiesEnforcer;
  public readonly witnessSynthesizer: QuorumWitnessSynthesizer;
  public readonly contractClient: GhostQuorumContractClient;
  private readonly requiredRoleMask: number;
  private readonly minimumQuorumThreshold: number;

  constructor(config?: QuorumCoordinatorConfig) {
    this.requiredRoleMask = config?.requiredRoleMask ?? DEFAULT_REQUIRED_ROLES_MASK;
    this.minimumQuorumThreshold = config?.minimumQuorumThreshold ?? 3;

    this.procurementBot = config?.procurementBot || new ProcurementBot();
    this.complianceBot = config?.complianceBot || new ComplianceBot();
    this.budgetBot = config?.budgetBot || new BudgetControllerBot();

    this.sodEnforcer =
      config?.sodEnforcer || new SegregationOfDutiesEnforcer(this.requiredRoleMask);
    this.witnessSynthesizer =
      config?.witnessSynthesizer ||
      new QuorumWitnessSynthesizer({
        minimumQuorumThreshold: this.minimumQuorumThreshold,
        requiredRoleMask: this.requiredRoleMask,
      });
    this.contractClient =
      config?.contractClient ||
      new GhostQuorumContractClient({
        minimumQuorumThreshold: this.minimumQuorumThreshold,
      });
  }

  /**
   * Orchestrates multi-agent consensus round and on-chain ZK settlement for an OrderIntent.
   */
  public async evaluateOrder(order: OrderIntent): Promise<QuorumConsensusReceipt> {
    const orderIntentDigest = computeOrderIntentDigest(order);
    const receiptId = `rcpt_${order.orderId}_${Date.now()}_${randomBytes(4).toString('hex')}`;

    // 1. Parallel Specialist Agent Evaluation
    const [procurementAtt, complianceAtt, budgetAtt] = await Promise.all([
      Promise.resolve(this.procurementBot.evaluateOrder(order)),
      Promise.resolve(this.complianceBot.evaluateOrder(order)),
      Promise.resolve(this.budgetBot.evaluateOrder(order)),
    ]);

    const attestations: RoleAttestation[] = [procurementAtt, complianceAtt, budgetAtt];

    // 2. Check for Specialist Rejections
    const rejectedAttestation = attestations.find((a) => !a.approved);
    if (rejectedAttestation) {
      return {
        receiptId,
        orderId: order.orderId,
        orderIntentDigest,
        status: 'REJECTED',
        amount: order.amount,
        currency: order.currency,
        merchantId: order.merchantId,
        requiredRoleMask: this.requiredRoleMask,
        satisfiedRoleMask: attestations.reduce((acc, a) => (a.approved ? acc | a.roleMask : acc), 0),
        attestations,
        settledAt: new Date().toISOString(),
        rejectionDetails: {
          failedRole: rejectedAttestation.role,
          reason: rejectedAttestation.rejectionReason || 'Specialist agent rejected order',
          violatingAgentId: rejectedAttestation.agentId,
        },
      };
    }

    // 3. Segregation of Duties & Anti-Self-Dealing Assertion
    const sodResult = this.sodEnforcer.assertSegregation(attestations);
    if (!sodResult.passed) {
      return {
        receiptId,
        orderId: order.orderId,
        orderIntentDigest,
        status: 'REJECTED',
        amount: order.amount,
        currency: order.currency,
        merchantId: order.merchantId,
        requiredRoleMask: this.requiredRoleMask,
        satisfiedRoleMask: sodResult.satisfiedRoleMask,
        attestations,
        settledAt: new Date().toISOString(),
        rejectionDetails: {
          reason: sodResult.reason,
          violatingAgentId: sodResult.violatingAgentId,
        },
      };
    }

    // 4. Synthesize ZK Quorum Witness & Generate Proof
    const witness = this.witnessSynthesizer.synthesizeWitness(order, attestations);
    const proof = this.witnessSynthesizer.generateProof(witness, this.contractClient.contractAddress);

    // 5. Midnight Smart Contract Settlement
    await this.contractClient.verifyAndSettleQuorum(witness, proof);

    // 6. Return Verified Consensus Receipt
    return {
      receiptId,
      orderId: order.orderId,
      orderIntentDigest,
      status: 'APPROVED',
      amount: order.amount,
      currency: order.currency,
      merchantId: order.merchantId,
      requiredRoleMask: this.requiredRoleMask,
      satisfiedRoleMask: sodResult.satisfiedRoleMask,
      proof,
      attestations,
      settledAt: proof.publicOutputs.settledAt,
    };
  }
}
