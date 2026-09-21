/**
 * @file packages/guard/src/core/types.ts
 * Core types and configuration contracts for @ghost/guard.
 */

export type GhostNetwork = 'preview' | 'preprod' | 'mainnet' | 'local';

export type PolicyViolationReasonCode =
  | 'LIMIT_EXCEEDED'
  | 'DAILY_CAP_EXCEEDED'
  | 'MERCHANT_BLOCKED'
  | 'MERCHANT_NOT_ALLOWLISTED'
  | 'CATEGORY_RESTRICTED'
  | 'POLICY_FROZEN'
  | 'ZK_PROOF_FAILED'
  | 'PROVER_UNREACHABLE'
  | 'EXECUTION_TIMEOUT'
  | 'INVALID_TOOL_PAYLOAD'
  | 'QUORUM_REJECTED';

export interface ToolSpendContext {
  amount: number;
  currency: string;
  merchant: string;
  category?: string;
  purpose?: string;
  metadata?: Record<string, unknown>;
}

export interface LocalPolicyConfig {
  id?: string;
  name?: string;
  maxPerTransaction: number;
  dailyCap: number;
  merchantAllowlist?: string[];
  merchantBlocklist?: string[];
  categoryBlocklist?: string[];
  requiresApprovalAbove?: number;
  frozen?: boolean;
}

export interface GhostExecutionReceipt {
  txDigest: string;
  proofHash: string;
  status: 'verified' | 'blocked' | 'escalated';
  latencyMs: number;
  timestamp: string;
  network: GhostNetwork;
  contractAddress: string;
  verifiedOnChain: boolean;
  context: ToolSpendContext;
}

export interface PreflightEvaluationResult {
  approved: boolean;
  code?: PolicyViolationReasonCode;
  reason?: string;
  remainingDailyAllowance?: number;
  requiresHumanApproval?: boolean;
  latencyMs: number;
}

export interface GhostGuardConfig {
  /** Target policy ID deployed on Ghost / Midnight */
  policyId?: string;
  /** Unique identifier of the autonomous agent */
  agentId?: string;
  /** Midnight network environment */
  network?: GhostNetwork;
  /** Midnight smart contract address enforcing this policy */
  contractAddress?: string;
  /** Midnight Proof Server RPC endpoint (default: http://localhost:6300) */
  proofServerUrl?: string;
  /** Midnight Indexer public query endpoint */
  indexerUrl?: string;
  /** Headless private key or hex seed for agent signing */
  agentPrivateKey?: string;
  /** If true (default), blocks the transaction when proof server/network is offline */
  failClosed?: boolean;
  /** Maximum duration (ms) for the entire guard verification lifecycle before timeout (default: 15000) */
  timeoutMs?: number;
  /** Local in-memory policy rules for instant verification & preflight checks */
  localPolicy?: LocalPolicyConfig;
  /** Custom extractor to normalize framework-specific tool arguments into ToolSpendContext */
  extractContext?: (args: any[]) => Partial<ToolSpendContext> | Promise<Partial<ToolSpendContext>>;
  /** Callback fired when an action is blocked by policy */
  onBlock?: (error: Error, context: ToolSpendContext) => Promise<any> | any;
  /** Callback fired when a ZK proof receipt has been generated */
  onProofGenerated?: (receipt: GhostExecutionReceipt) => Promise<void> | void;
  /** Optional SignedIntentToken or serialized base64 string to bind execution cryptographically to human intent */
  intentToken?: any;
  /** Optional callback fired when an intent divergence or prompt injection is detected */
  onIntentViolation?: (error: any, context: ToolSpendContext) => Promise<any> | any;
  /** Optional AdaptiveVelocityDampener instance to enforce token-bucket limits and EWMA anomaly dampening */
  velocityDampener?: any;
  /** Optional callback fired when velocity circuit breaker trips */
  onVelocityTripped?: (error: any, context: ToolSpendContext) => Promise<any> | any;
  /** Optional QuorumCoordinator to require multi-agent M-of-N consensus for high-value purchases */
  quorumCoordinator?: any;
  /** Minimum spend amount (e.g. $1,000) that triggers mandatory multi-agent quorum consensus (default: 1000) */
  quorumThresholdAmount?: number;
  /** Optional callback fired when multi-agent quorum consensus is rejected */
  onQuorumRejected?: (error: any, context: ToolSpendContext) => Promise<any> | any;
}
