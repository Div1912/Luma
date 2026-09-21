/**
 * @file packages/quorum/src/types.ts
 * Core types, data structures, and cryptographic schemas for @ghost/quorum.
 * Enforces Multi-Agent Segregation of Duties (SoD) under SOX 404 & SOC 2.
 */

export type AgentRole =
  | 'PROCUREMENT'
  | 'SECURITY_AUDIT'
  | 'BUDGET_CONTROLLER'
  | 'SUPERVISOR';

export const RoleBitmask: Record<AgentRole, number> = {
  PROCUREMENT: 1,       // 0b0001
  SECURITY_AUDIT: 2,    // 0b0010
  BUDGET_CONTROLLER: 4, // 0b0100
  SUPERVISOR: 8,        // 0b1000
};

export const DEFAULT_REQUIRED_ROLES_MASK =
  RoleBitmask.PROCUREMENT | RoleBitmask.SECURITY_AUDIT | RoleBitmask.BUDGET_CONTROLLER; // 7 (0b0111)

export interface OrderLineItem {
  sku: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
}

export interface OrderIntent {
  orderId: string;
  amount: number;
  currency: string;
  merchantId: string;
  category: string;
  department: string;
  justification: string;
  lineItems: OrderLineItem[];
  nonce: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface RoleAttestation {
  attestationId: string;
  orderIntentDigest: string;
  agentId: string;
  agentPublicKey: string;
  role: AgentRole;
  roleMask: number;
  approved: boolean;
  decisionTimestamp: string;
  signature: string;
  rejectionReason?: string;
  assertionDetails: Record<string, any>;
}

export interface SignerSummary {
  agentId: string;
  publicKey: string;
  role: AgentRole;
  roleMask: number;
  signature: string;
}

export interface QuorumWitness {
  orderIntentDigest: string;
  orderAmount: number;
  orderNonce: string;
  requiredRoleMask: number;
  quorumCount: number;
  signers: SignerSummary[];
}

export interface QuorumPublicOutputs {
  orderIntentDigest: string;
  orderAmount: number;
  quorumCount: number;
  consumedNonce: string;
  settledAt: string;
}

export interface QuorumProof {
  proofHash: string;
  contractAddress: string;
  witnessCommitment: string;
  publicOutputs: QuorumPublicOutputs;
}

export interface QuorumConsensusReceipt {
  receiptId: string;
  orderId: string;
  orderIntentDigest: string;
  status: 'APPROVED' | 'REJECTED';
  amount: number;
  currency: string;
  merchantId: string;
  requiredRoleMask: number;
  satisfiedRoleMask: number;
  proof?: QuorumProof;
  attestations: RoleAttestation[];
  settledAt: string;
  rejectionDetails?: {
    failedRole?: AgentRole;
    reason: string;
    violatingAgentId?: string;
  };
}

export interface QuorumLedgerState {
  governanceRoot: string;
  lastConsumedNonce: string;
  minimumQuorumThreshold: number;
  totalQuorumVolume: bigint;
  totalSettledTransactions: bigint;
}

export interface QuorumContractConfig {
  governanceRoot?: string;
  minimumQuorumThreshold?: number;
  contractAddress?: string;
}
