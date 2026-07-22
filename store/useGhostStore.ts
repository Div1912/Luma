"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────

export type PolicyStatus = "active" | "paused" | "archived";
export type AgentStatus = "connected" | "paused" | "revoked" | "pending";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired";
export type EventType =
  | "purchase_approved"
  | "purchase_blocked"
  | "agent_connected"
  | "agent_revoked"
  | "policy_created"
  | "policy_updated"
  | "proof_verified"
  | "approval_requested"
  | "approval_granted"
  | "approval_rejected";

export interface Policy {
  id: string;
  name: string;
  status: PolicyStatus;
  perTransactionLimit: number;
  dailyLimit: number;
  monthlyLimit: number;
  categoryRestrictions: string[];
  merchantAllowlist: string[];
  merchantBlocklist: string[];
  highRiskThreshold: number;
  requiresApprovalAbove: number;
  emergencyRevoke: boolean;
  agentCount: number;
  createdAt: string;
  updatedAt: string;
  spentToday: number;
  spentThisMonth: number;
}

export interface Agent {
  id: string;
  name: string;
  type: "shopping" | "procurement" | "research" | "financial";
  status: AgentStatus;
  risk: RiskLevel;
  policyId: string | null;
  permissions: string[];
  lastActivity: string;
  totalTransactions: number;
  totalSpent: number;
  blockedAttempts: number;
  connectedAt: string;
  description: string;
  version: string;
}

export interface Approval {
  id: string;
  agentId: string;
  agentName: string;
  policyId: string;
  merchant: string;
  amount: number;
  currency: string;
  reason: string;
  status: ApprovalStatus;
  requestedAt: string;
  expiresAt: string;
  resolvedAt?: string;
  category: string;
  proofHash: string;
  ruleTriggered: string;
}

export interface AuditEvent {
  id: string;
  type: EventType;
  agentId?: string;
  agentName?: string;
  policyId?: string;
  merchant?: string;
  amount?: number;
  currency?: string;
  timestamp: string;
  proofHash?: string;
  status: "success" | "failed" | "blocked" | "pending";
  description: string;
  metadata: Record<string, string | number | boolean>;
}

export interface DashboardMetrics {
  activePolicies: number;
  activeAgents: number;
  pendingApprovals: number;
  blockedToday: number;
  approvedToday: number;
  totalSpentToday: number;
  totalSpentMonth: number;
  proofVerifications: number;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED_POLICIES: Policy[] = [
  {
    id: "pol_01",
    name: "Standard Shopping",
    status: "active",
    perTransactionLimit: 250,
    dailyLimit: 1000,
    monthlyLimit: 5000,
    categoryRestrictions: ["gambling", "crypto", "adult"],
    merchantAllowlist: [],
    merchantBlocklist: ["casino.io", "cryptobay.net"],
    highRiskThreshold: 200,
    requiresApprovalAbove: 150,
    emergencyRevoke: true,
    agentCount: 2,
    createdAt: "2025-01-15T09:00:00Z",
    updatedAt: "2025-06-10T14:22:00Z",
    spentToday: 340,
    spentThisMonth: 2180,
  },
  {
    id: "pol_02",
    name: "Enterprise Procurement",
    status: "active",
    perTransactionLimit: 5000,
    dailyLimit: 20000,
    monthlyLimit: 100000,
    categoryRestrictions: ["personal", "entertainment"],
    merchantAllowlist: ["aws.amazon.com", "stripe.com", "twilio.com"],
    merchantBlocklist: [],
    highRiskThreshold: 3000,
    requiresApprovalAbove: 2500,
    emergencyRevoke: true,
    agentCount: 1,
    createdAt: "2025-02-20T10:00:00Z",
    updatedAt: "2025-07-01T09:00:00Z",
    spentToday: 8250,
    spentThisMonth: 67400,
  },
  {
    id: "pol_03",
    name: "Research Budget",
    status: "active",
    perTransactionLimit: 50,
    dailyLimit: 200,
    monthlyLimit: 800,
    categoryRestrictions: [],
    merchantAllowlist: [],
    merchantBlocklist: [],
    highRiskThreshold: 40,
    requiresApprovalAbove: 30,
    emergencyRevoke: false,
    agentCount: 3,
    createdAt: "2025-03-05T08:00:00Z",
    updatedAt: "2025-07-15T11:30:00Z",
    spentToday: 45,
    spentThisMonth: 320,
  },
  {
    id: "pol_04",
    name: "Travel & Expenses",
    status: "paused",
    perTransactionLimit: 800,
    dailyLimit: 3000,
    monthlyLimit: 15000,
    categoryRestrictions: ["crypto"],
    merchantAllowlist: ["booking.com", "airbnb.com", "uber.com"],
    merchantBlocklist: [],
    highRiskThreshold: 500,
    requiresApprovalAbove: 600,
    emergencyRevoke: true,
    agentCount: 0,
    createdAt: "2025-04-12T12:00:00Z",
    updatedAt: "2025-06-28T16:45:00Z",
    spentToday: 0,
    spentThisMonth: 0,
  },
];

const SEED_AGENTS: Agent[] = [
  {
    id: "agt_01",
    name: "ShopperBot v2",
    type: "shopping",
    status: "connected",
    risk: "low",
    policyId: "pol_01",
    permissions: ["browse", "compare", "purchase", "return"],
    lastActivity: "2 min ago",
    totalTransactions: 247,
    totalSpent: 18430,
    blockedAttempts: 12,
    connectedAt: "2025-01-16T10:00:00Z",
    description: "Autonomous shopping assistant for consumer goods",
    version: "2.4.1",
  },
  {
    id: "agt_02",
    name: "ProcureAI",
    type: "procurement",
    status: "connected",
    risk: "medium",
    policyId: "pol_02",
    permissions: ["browse", "compare", "negotiate", "purchase", "invoice"],
    lastActivity: "14 min ago",
    totalTransactions: 89,
    totalSpent: 412800,
    blockedAttempts: 4,
    connectedAt: "2025-02-21T09:30:00Z",
    description: "Enterprise procurement automation for SaaS and cloud services",
    version: "1.9.0",
  },
  {
    id: "agt_03",
    name: "ResearchCrawler",
    type: "research",
    status: "connected",
    risk: "low",
    policyId: "pol_03",
    permissions: ["browse", "compare"],
    lastActivity: "1 hr ago",
    totalTransactions: 523,
    totalSpent: 2890,
    blockedAttempts: 2,
    connectedAt: "2025-03-06T14:00:00Z",
    description: "Market research and price comparison agent",
    version: "3.1.2",
  },
  {
    id: "agt_04",
    name: "FinanceGuard",
    type: "financial",
    status: "paused",
    risk: "high",
    policyId: "pol_01",
    permissions: ["browse", "compare", "purchase"],
    lastActivity: "3 days ago",
    totalTransactions: 31,
    totalSpent: 6720,
    blockedAttempts: 28,
    connectedAt: "2025-05-01T11:00:00Z",
    description: "Automated financial instrument purchasing agent",
    version: "1.0.3",
  },
  {
    id: "agt_05",
    name: "SupplyChainBot",
    type: "procurement",
    status: "revoked",
    risk: "critical",
    policyId: null,
    permissions: [],
    lastActivity: "7 days ago",
    totalTransactions: 15,
    totalSpent: 89000,
    blockedAttempts: 67,
    connectedAt: "2025-04-10T08:00:00Z",
    description: "Supply chain vendor negotiation agent — access revoked",
    version: "0.8.5",
  },
];

const SEED_APPROVALS: Approval[] = [
  {
    id: "apr_01",
    agentId: "agt_01",
    agentName: "ShopperBot v2",
    policyId: "pol_01",
    merchant: "Apple Store",
    amount: 189.99,
    currency: "USD",
    reason: "Purchase amount $189.99 exceeds approval threshold of $150.00",
    status: "pending",
    requestedAt: new Date(Date.now() - 12 * 60000).toISOString(),
    expiresAt: new Date(Date.now() + 48 * 60000).toISOString(),
    category: "Electronics",
    proofHash: "0x7f3a9b2c4e8d1f6a5b9c3e7d2f4a8b1c",
    ruleTriggered: "requiresApprovalAbove",
  },
  {
    id: "apr_02",
    agentId: "agt_02",
    agentName: "ProcureAI",
    policyId: "pol_02",
    merchant: "AWS Marketplace",
    amount: 4200.0,
    currency: "USD",
    reason: "High-value transaction requires manual approval per enterprise policy",
    status: "pending",
    requestedAt: new Date(Date.now() - 45 * 60000).toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60000).toISOString(),
    category: "Cloud Services",
    proofHash: "0x2c8e4f7a1b3d5e9f2a4c6b8d1e3f5a7c",
    ruleTriggered: "requiresApprovalAbove",
  },
  {
    id: "apr_03",
    agentId: "agt_03",
    agentName: "ResearchCrawler",
    policyId: "pol_03",
    merchant: "Statista",
    amount: 49.0,
    currency: "USD",
    reason: "Purchase amount $49.00 exceeds approval threshold of $30.00",
    status: "approved",
    requestedAt: new Date(Date.now() - 3 * 60 * 60000).toISOString(),
    expiresAt: new Date(Date.now() + 21 * 60 * 60000).toISOString(),
    resolvedAt: new Date(Date.now() - 2.5 * 60 * 60000).toISOString(),
    category: "Data & Research",
    proofHash: "0x9d1a3c5e7f2b4d6a8c1e3f5b7d9a1c3e",
    ruleTriggered: "requiresApprovalAbove",
  },
  {
    id: "apr_04",
    agentId: "agt_04",
    agentName: "FinanceGuard",
    policyId: "pol_01",
    merchant: "CryptoBay",
    amount: 320.0,
    currency: "USD",
    reason: "Merchant 'cryptobay.net' is on the blocked list for this policy",
    status: "rejected",
    requestedAt: new Date(Date.now() - 6 * 60 * 60000).toISOString(),
    expiresAt: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
    resolvedAt: new Date(Date.now() - 5.8 * 60 * 60000).toISOString(),
    category: "Cryptocurrency",
    proofHash: "0x3e7a9c1f5b2d4e8a6c1f3e5b9d2a4c6f",
    ruleTriggered: "merchantBlocklist",
  },
];

const SEED_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: "evt_001",
    type: "purchase_approved",
    agentId: "agt_01",
    agentName: "ShopperBot v2",
    merchant: "Amazon",
    amount: 89.99,
    currency: "USD",
    timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
    proofHash: "0xa1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
    status: "success",
    description: "Purchase approved within policy limits",
    metadata: { policyId: "pol_01", category: "Electronics", latency_ms: 142 },
  },
  {
    id: "evt_002",
    type: "approval_requested",
    agentId: "agt_01",
    agentName: "ShopperBot v2",
    merchant: "Apple Store",
    amount: 189.99,
    currency: "USD",
    timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
    status: "pending",
    description: "Approval requested: amount exceeds threshold",
    metadata: { threshold: 150, policyId: "pol_01" },
  },
  {
    id: "evt_003",
    type: "proof_verified",
    agentId: "agt_02",
    agentName: "ProcureAI",
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
    proofHash: "0xf1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4",
    status: "success",
    description: "ZK proof verified on Midnight chain",
    metadata: { blockHeight: 2847391, gasUsed: 0.0004 },
  },
  {
    id: "evt_004",
    type: "purchase_blocked",
    agentId: "agt_04",
    agentName: "FinanceGuard",
    merchant: "CryptoBay",
    amount: 320.0,
    currency: "USD",
    timestamp: new Date(Date.now() - 6 * 60 * 60000).toISOString(),
    status: "blocked",
    description: "Transaction blocked: merchant on blocklist",
    metadata: { policyId: "pol_01", rule: "merchantBlocklist" },
  },
  {
    id: "evt_005",
    type: "agent_revoked",
    agentId: "agt_05",
    agentName: "SupplyChainBot",
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60000).toISOString(),
    status: "success",
    description: "Agent access revoked due to anomalous spending behavior",
    metadata: { trigger: "manual", initiatedBy: "admin@ghost.xyz" },
  },
  {
    id: "evt_006",
    type: "policy_updated",
    policyId: "pol_01",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60000).toISOString(),
    status: "success",
    description: "Policy 'Standard Shopping' limits updated",
    metadata: {
      field: "requiresApprovalAbove",
      oldValue: 200,
      newValue: 150,
      initiatedBy: "admin@ghost.xyz",
    },
  },
  {
    id: "evt_007",
    type: "purchase_approved",
    agentId: "agt_02",
    agentName: "ProcureAI",
    merchant: "Stripe",
    amount: 1800.0,
    currency: "USD",
    timestamp: new Date(Date.now() - 4 * 60 * 60000).toISOString(),
    proofHash: "0xd4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9",
    status: "success",
    description: "High-value purchase approved after manual approval",
    metadata: { policyId: "pol_02", approvalId: "apr_99", latency_ms: 6420 },
  },
];

// ─── Store ────────────────────────────────────────────────────────────────────

interface GhostStore {
  // Auth
  isAuthenticated: boolean;
  isDemoMode: boolean;
  user: { email: string; name: string; avatar?: string } | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInDemo: () => void;
  signInWallet: (address: string) => void;
  signOut: () => void;

  // Data
  policies: Policy[];
  agents: Agent[];
  approvals: Approval[];
  auditEvents: AuditEvent[];
  metrics: DashboardMetrics;

  // Policy actions
  createPolicy: (policy: Omit<Policy, "id" | "createdAt" | "updatedAt" | "spentToday" | "spentThisMonth" | "agentCount">) => void;
  updatePolicy: (id: string, updates: Partial<Policy>) => void;
  deletePolicy: (id: string) => void;
  archivePolicy: (id: string) => void;

  // Agent actions
  revokeAgent: (id: string) => void;
  pauseAgent: (id: string) => void;
  resumeAgent: (id: string) => void;

  // Approval actions
  approveRequest: (id: string) => void;
  rejectRequest: (id: string) => void;

  // Audit actions
  addAuditEvent: (event: Omit<AuditEvent, "id" | "timestamp">) => void;

  // UI state
  commandMenuOpen: boolean;
  setCommandMenuOpen: (open: boolean) => void;
}

export const useGhostStore = create<GhostStore>()(
  persist(
    (set, get) => ({
      // Auth
      isAuthenticated: false,
      isDemoMode: false,
      user: null,

      signIn: async (email, password) => {
        await new Promise((r) => setTimeout(r, 800));
        if (email === "demo@ghost.xyz" && password === "ghost2025") {
          set({
            isAuthenticated: true,
            isDemoMode: false,
            user: { email, name: "Alex Morgan", avatar: undefined },
          });
          return { success: true };
        }
        if (email && password.length >= 6) {
          set({
            isAuthenticated: true,
            isDemoMode: false,
            user: { email, name: email.split("@")[0] },
          });
          return { success: true };
        }
        return { success: false, error: "Invalid credentials. Try demo@ghost.xyz / ghost2025" };
      },

      signInDemo: () => {
        set({
          isAuthenticated: true,
          isDemoMode: true,
          user: { email: "demo@ghost.xyz", name: "Demo User" },
        });
      },

      signInWallet: (address: string) => {
        set({
          isAuthenticated: true,
          isDemoMode: false,
          user: { 
            email: `${address.slice(0, 8)}...${address.slice(-6)}@wallet`, 
            name: "Wallet User" 
          },
        });
      },

      signOut: () => {
        set({ isAuthenticated: false, isDemoMode: false, user: null });
      },

      // Data
      policies: SEED_POLICIES,
      agents: SEED_AGENTS,
      approvals: SEED_APPROVALS,
      auditEvents: SEED_AUDIT_EVENTS,

      metrics: {
        activePolicies: 3,
        activeAgents: 3,
        pendingApprovals: 2,
        blockedToday: 7,
        approvedToday: 23,
        totalSpentToday: 8635,
        totalSpentMonth: 69900,
        proofVerifications: 1247,
      },

      // Policy actions
      createPolicy: (policy) => {
        const newPolicy: Policy = {
          ...policy,
          id: `pol_${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          spentToday: 0,
          spentThisMonth: 0,
          agentCount: 0,
        };
        set((s) => ({ policies: [newPolicy, ...s.policies] }));
        supabase.from('policies').insert([newPolicy]).then(({ error }) => {
          if (error) console.error('Supabase policy save error:', error);
        });
      },

      updatePolicy: (id, updates) => {
        set((s) => ({
          policies: s.policies.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },

      deletePolicy: (id) => {
        set((s) => ({ policies: s.policies.filter((p) => p.id !== id) }));
      },

      archivePolicy: (id) => {
        get().updatePolicy(id, { status: "archived" });
      },

      // Agent actions
      revokeAgent: (id) => {
        set((s) => ({
          agents: s.agents.map((a) =>
            a.id === id ? { ...a, status: "revoked" as AgentStatus, policyId: null, permissions: [] } : a
          ),
        }));
      },

      pauseAgent: (id) => {
        set((s) => ({
          agents: s.agents.map((a) =>
            a.id === id ? { ...a, status: "paused" as AgentStatus } : a
          ),
        }));
      },

      resumeAgent: (id) => {
        set((s) => ({
          agents: s.agents.map((a) =>
            a.id === id ? { ...a, status: "connected" as AgentStatus } : a
          ),
        }));
      },

      // Approval actions
      approveRequest: (id) => {
        set((s) => ({
          approvals: s.approvals.map((a) =>
            a.id === id
              ? { ...a, status: "approved" as ApprovalStatus, resolvedAt: new Date().toISOString() }
              : a
          ),
          metrics: { ...s.metrics, pendingApprovals: Math.max(0, s.metrics.pendingApprovals - 1) },
        }));
      },

      rejectRequest: (id) => {
        set((s) => ({
          approvals: s.approvals.map((a) =>
            a.id === id
              ? { ...a, status: "rejected" as ApprovalStatus, resolvedAt: new Date().toISOString() }
              : a
          ),
          metrics: { ...s.metrics, pendingApprovals: Math.max(0, s.metrics.pendingApprovals - 1) },
        }));
      },

      addAuditEvent: (event) => {
        set((s) => {
          const newEvent: AuditEvent = {
            ...event,
            id: `evt_${Date.now()}`,
            timestamp: new Date().toISOString(),
          };
          supabase.from('audit_events').insert([{
            id: newEvent.id,
            type: newEvent.type,
            agent_id: newEvent.agentId || null,
            agent_name: newEvent.agentName || null,
            policy_id: newEvent.policyId || null,
            merchant: newEvent.merchant || null,
            amount: newEvent.amount || 0,
            currency: newEvent.currency || 'USD',
            timestamp: newEvent.timestamp,
            proof_hash: newEvent.proofHash || null,
            status: newEvent.status,
            description: newEvent.description,
            metadata: newEvent.metadata
          }]).then(({ error }) => {
            if (error) console.error('Supabase audit event error:', error);
          });
          return {
            auditEvents: [newEvent, ...s.auditEvents],
            metrics: {
              ...s.metrics,
              totalSpentToday: event.type === 'purchase_approved' ? s.metrics.totalSpentToday + (event.amount || 0) : s.metrics.totalSpentToday
            }
          };
        });
      },

      // UI state
      commandMenuOpen: false,
      setCommandMenuOpen: (open) => set({ commandMenuOpen: open }),
    }),
    {
      name: "ghost-store",
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        isDemoMode: state.isDemoMode,
        user: state.user,
      }),
    }
  )
);
