/**
 * @file types.ts
 * Core types and interfaces for the @ghost/sdk Zero-Knowledge policy execution layer.
 */

export type GhostNetwork = 'preview' | 'preprod' | 'mainnet' | 'sandbox';

export type PolicyAction = 'allow' | 'deny' | 'require_approval' | 'escalate';

export type AgentRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface GhostClientConfig {
  /** Ghost API secret key (starts with gsk_...) */
  apiKey: string;
  /** Active target Midnight network environment (defaults to 'preprod') */
  network?: GhostNetwork;
  /** Base URL for the Ghost Orchestration Gateway */
  baseUrl?: string;
  /** Custom deployed Ghost smart contract address on Midnight */
  contractAddress?: string;
  /** Enable verbose cryptographic logging */
  debug?: boolean;
}

export interface RuleDefinition {
  action: PolicyAction;
  condition: string;
  description?: string;
}

export interface PolicyConfig {
  id?: string;
  name: string;
  description?: string;
  perTransactionLimit: number;
  dailyLimit: number;
  monthlyLimit?: number;
  requiresApprovalAbove?: number;
  categoryRestrictions?: string[];
  merchantAllowlist?: string[];
  merchantBlocklist?: string[];
  rules?: RuleDefinition[];
  multiSigThresholdUSD?: number;
  requiredApprovers?: string[];
}

export interface PolicyEvaluationRequest {
  agentId: string;
  action?: 'spend' | 'transfer' | 'api_call' | 'contract_execution' | string;
  amount: number;
  currency?: string;
  merchant?: string;
  category?: string;
  metadata?: Record<string, unknown>;
}

export interface PolicyEvaluationResult {
  approved: boolean;
  action: PolicyAction;
  reason?: string;
  proofHash?: string;
  requiresMultiPartyApproval?: boolean;
  evaluationLatencyMs: number;
  ruleTriggered?: string;
  remainingDailyAllowance?: number;
  timestamp: string;
}

export interface ZKProofRecord {
  id: string;
  contractAddress: string;
  network: GhostNetwork;
  proofHash: string;
  verifiedOnChain: boolean;
  blockHeight?: number;
  generatedAt: string;
  circuit: 'ghost_spend_v1' | 'ghost_spend_v2_multisig' | 'ghost_rebalance_threshold';
  publicStateCommitment: string;
}

export interface SpendExecutionResult {
  success: boolean;
  txHash: string;
  proofHash: string;
  amountSpent: number;
  remainingBudget: number;
  timestamp: string;
  network: GhostNetwork;
  contractAddress: string;
}
