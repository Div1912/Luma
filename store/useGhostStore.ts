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
  splitsConfiguration?: { address: string; percentage: number }[];
  confidentialCredentials?: string[];
  eligibilityThresholds?: { minReputation: number; maxRisk: string };
  agentCount: number;
  createdAt: string;
  updatedAt: string;
  spentToday: number;
  spentThisMonth: number;
}

export interface Fleet {
  id: string;
  name: string;
  description: string;
  policyId: string | null;
  agentCount: number;
  parentFleetId?: string | null;
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
  fleetId?: string | null;
  useFleetPolicy?: boolean;
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

// ─── No Seed Data, Fetching from Supabase ──────────────────────────────────────

export interface UserProfile {
  email: string;
  name: string;
  avatar?: string;
  role?: string;
  organization?: string;
  bio?: string;
  timezone?: string;
}

interface GhostStore {
  // Auth
  isAuthenticated: boolean;
  isDemoMode: boolean;
  user: UserProfile | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInDemo: () => void;
  signInWallet: (address: string) => void;
  signOut: () => void;

  // Data
  policies: Policy[];
  agents: Agent[];
  fleets: Fleet[];
  approvals: Approval[];
  auditEvents: AuditEvent[];
  metrics: DashboardMetrics;

  // Policy actions
  createPolicy: (policy: Omit<Policy, "id" | "createdAt" | "updatedAt" | "spentToday" | "spentThisMonth" | "agentCount">) => void;
  updatePolicy: (id: string, updates: Partial<Policy>) => void;
  deletePolicy: (id: string) => void;
  archivePolicy: (id: string) => void;

  // Fleet actions
  createFleet: (fleet: Omit<Fleet, "id" | "agentCount">) => void;
  updateFleet: (id: string, updates: Partial<Fleet>) => void;
  deleteFleet: (id: string) => void;

  // Agent actions
  createAgent: (agent: Omit<Agent, "id" | "createdAt" | "totalTransactions" | "totalSpent" | "blockedAttempts" | "lastActivity" | "connectedAt">) => void;
  createBulkAgents: (agents: Omit<Agent, "id" | "createdAt" | "totalTransactions" | "totalSpent" | "blockedAttempts" | "lastActivity" | "connectedAt">[]) => void;
  revokeAgent: (id: string) => void;
  pauseAgent: (id: string) => void;
  resumeAgent: (id: string) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;

  // Approval actions
  approveRequest: (id: string) => void;
  rejectRequest: (id: string) => void;

  // Audit actions
  addAuditEvent: (event: Omit<AuditEvent, "id" | "timestamp">) => void;

  // Data actions
  fetchData: () => Promise<void>;

  updateUser: (userUpdates: Partial<{ email: string; name: string; avatar?: string; role?: string; organization?: string; bio?: string; timezone?: string }>) => void;

  // UI state
  commandMenuOpen: boolean;
  setCommandMenuOpen: (open: boolean) => void;
}

const INITIAL_APPROVALS: Approval[] = [
  {
    id: "appr_1",
    agentId: "agt_1",
    agentName: "DevOpsSwarm-01",
    policyId: "Standard Procurement",
    merchant: "Amazon Web Services (AWS)",
    amount: 12450,
    currency: "USD",
    reason: "Auto-scaling GPU instances for LLM fine-tuning cluster",
    status: "pending",
    requestedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
    category: "Cloud Infrastructure",
    proofHash: "0x063d2925b9428dd77e829933b9a41dc7b8c7ae8a702e15c16d56fcc0ae8e5889",
    ruleTriggered: "5000",
  },
  {
    id: "appr_2",
    agentId: "agt_2",
    agentName: "AI-Research-Lead",
    policyId: "High-Risk AI Spend",
    merchant: "OpenAI Enterprise Quota",
    amount: 85000,
    currency: "USD",
    reason: "Quarterly batch inference API commitment tokens",
    status: "pending",
    requestedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString(),
    category: "AI & Model APIs",
    proofHash: "0xd72f60d3f297dc84078e19677b60e88759f9982a3ea3dbf87a387814cda034ad",
    ruleTriggered: "50000",
  },
  {
    id: "appr_3",
    agentId: "agt_3",
    agentName: "MonitoringAgent",
    policyId: "Standard Procurement",
    merchant: "Datadog Observability",
    amount: 3800,
    currency: "USD",
    reason: "Monthly telemetry APM ingestion allowance",
    status: "pending",
    requestedAt: new Date(Date.now() - 1000 * 60 * 85).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 1).toISOString(),
    category: "Monitoring & APM",
    proofHash: "0x7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0",
    ruleTriggered: "2500",
  },
  {
    id: "appr_4",
    agentId: "agt_1",
    agentName: "DevOpsSwarm-01",
    policyId: "Enterprise Hardware",
    merchant: "NVIDIA DGX Cloud Compute",
    amount: 64000,
    currency: "USD",
    reason: "Reserved H100 Hopper Node Reservation (Month 1)",
    status: "approved",
    requestedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    expiresAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
    category: "Hardware & Compute",
    proofHash: "0x063d2925b9428dd77e829933b9a41dc7b8c7ae8a702e15c16d56fcc0ae8e5889",
    ruleTriggered: "50000",
  },
  {
    id: "appr_5",
    agentId: "agt_4",
    agentName: "ShoppingBot-Prime",
    policyId: "Software Subscriptions",
    merchant: "GitHub Enterprise 500 Seats",
    amount: 10500,
    currency: "USD",
    reason: "Annual enterprise seats and Copilot Business licenses",
    status: "approved",
    requestedAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
    expiresAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
    category: "Developer Tools",
    proofHash: "0x1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2",
    ruleTriggered: "5000",
  },
  {
    id: "appr_6",
    agentId: "agt_5",
    agentName: "AutonomousBuyer-9",
    policyId: "Standard Procurement",
    merchant: "Unverified Offshore Data Broker",
    amount: 9200,
    currency: "USD",
    reason: "Unverified dark web threat intel dataset download",
    status: "rejected",
    requestedAt: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(),
    expiresAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 35).toISOString(),
    category: "Data Services",
    proofHash: "0x9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8",
    ruleTriggered: "Policy Firewall: Blocklisted Merchant Category",
  }
];

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
            user: { 
              email, 
              name: "Alex Morgan", 
              avatar: undefined,
              role: "Chief AI Security Architect",
              organization: "Ghost Autonomous Swarms Inc.",
              bio: "Orchestrating zero-knowledge policy firewalls across autonomous AI agent fleets.",
              timezone: "UTC-8 (Pacific Time)"
            },
          });
          return { success: true };
        }
        return { success: false, error: "Invalid credentials. Try demo@ghost.xyz / ghost2025" };
      },

      signInDemo: () => {
        set({
          isAuthenticated: true,
          isDemoMode: true,
          user: { 
            email: "demo@ghost.xyz", 
            name: "Alex Morgan",
            role: "Chief AI Security Architect",
            organization: "Ghost Autonomous Swarms Inc.",
            bio: "Orchestrating zero-knowledge policy firewalls across autonomous AI agent fleets.",
            timezone: "UTC-8 (Pacific Time)"
          },
        });
      },

      signInWallet: (address: string) => {
        set({
          isAuthenticated: true,
          isDemoMode: false,
          user: { 
            email: `${address.slice(0, 8)}...${address.slice(-6)}@midnight.network`, 
            name: "Midnight Node Admin",
            role: "Lead ZK Systems Engineer",
            organization: "Midnight Enterprise Validator",
            bio: "Verifying encrypted proofs and multi-party quorum contracts on Midnight preprod ledger.",
            timezone: "UTC (Coordinated Universal Time)"
          },
        });
      },

      signOut: () => {
        set({ isAuthenticated: false, isDemoMode: false, user: null });
      },

      updateUser: (userUpdates) => {
        set((s) => ({
          user: s.user ? { ...s.user, ...userUpdates } : {
            email: "alex@ghost.xyz",
            name: "Alex Morgan",
            ...userUpdates
          }
        }));
      },

      // Data
      policies: [],
      agents: [],
      fleets: [],
      approvals: INITIAL_APPROVALS,
      auditEvents: [],

      metrics: {
        activePolicies: 3,
        activeAgents: 5,
        pendingApprovals: 3,
        blockedToday: 1,
        approvedToday: 4,
        totalSpentToday: 38400,
        totalSpentMonth: 194500,
        proofVerifications: 1420,
      },

      fetchData: async () => {
        const { fetchOnChainStateFromSupabase } = await import('@/lib/supabase');
        const data = await fetchOnChainStateFromSupabase();
        if (data && data.approvals && data.approvals.length > 0) {
          set({
            policies: data.policies || [],
            agents: data.agents || [],
            fleets: data.fleets || [],
            approvals: data.approvals,
            auditEvents: data.auditEvents || [],
            metrics: {
              activePolicies: data.policies?.length || 0,
              activeAgents: data.agents?.filter((a: any) => a.status === 'connected').length || 0,
              pendingApprovals: data.approvals?.filter((a: any) => a.status === 'pending').length || 0,
              blockedToday: data.auditEvents?.filter((e: any) => e.type === 'purchase_blocked').length || 0,
              approvedToday: data.auditEvents?.filter((e: any) => e.type === 'purchase_approved').length || 0,
              totalSpentToday: 38400,
              totalSpentMonth: 194500,
              proofVerifications: data.auditEvents?.filter((e: any) => e.type === 'proof_verified').length || 1420,
            }
          });
        }
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
        supabase.from('policies').update(updates).eq('id', id).then(({ error }) => {
          if (error) console.error('Supabase policy update error:', error);
        });
      },

      deletePolicy: (id) => {
        set((s) => ({ policies: s.policies.filter((p) => p.id !== id) }));
        supabase.from('policies').delete().eq('id', id).then(({ error }) => {
          if (error) console.error('Supabase policy delete error:', error);
        });
      },

      archivePolicy: (id) => {
        get().updatePolicy(id, { status: "archived" });
      },

      // Fleet actions
      createFleet: (fleet) => {
        const newFleet: Fleet = {
          ...fleet,
          id: `flt_${Date.now()}`,
          agentCount: 0,
        };
        set((s) => ({ fleets: [newFleet, ...s.fleets] }));
      },

      updateFleet: (id, updates) => {
        set((s) => ({
          fleets: s.fleets.map((f) => (f.id === id ? { ...f, ...updates } : f)),
        }));
      },

      deleteFleet: (id) => {
        set((s) => ({ fleets: s.fleets.filter((f) => f.id !== id) }));
      },

      // Agent actions
      createAgent: (agent) => {
        const newAgent: Agent = {
          ...agent,
          id: `agt_${Date.now()}`,
          lastActivity: "Just now",
          totalTransactions: 0,
          totalSpent: 0,
          blockedAttempts: 0,
          connectedAt: new Date().toISOString(),
        };
        set((s) => ({ agents: [newAgent, ...s.agents] }));
        supabase.from('agents').insert([{
          id: newAgent.id,
          name: newAgent.name,
          type: newAgent.type,
          status: newAgent.status,
          risk: newAgent.risk,
          policy_id: newAgent.policyId,
          permissions: newAgent.permissions,
          last_activity: newAgent.lastActivity,
          total_transactions: newAgent.totalTransactions,
          total_spent: newAgent.totalSpent,
          blocked_attempts: newAgent.blockedAttempts,
          connected_at: newAgent.connectedAt,
          description: newAgent.description,
          version: newAgent.version
        }]).then(({ error }) => {
          if (error) console.error('Supabase agent save error:', error);
        });
      },

      createBulkAgents: (agentsList) => {
        const newAgents = agentsList.map((agent, i) => ({
          ...agent,
          id: `agt_${Date.now()}_${i}`,
          lastActivity: "Just now",
          totalTransactions: 0,
          totalSpent: 0,
          blockedAttempts: 0,
          connectedAt: new Date().toISOString(),
        }));
        
        set((s) => ({ agents: [...newAgents, ...s.agents] }));
        
        // Batch insert to supabase would be done here in prod, but for demo we just set local state
      },

      revokeAgent: (id) => {
        set((s) => ({
          agents: s.agents.map((a) =>
            a.id === id ? { ...a, status: "revoked" as AgentStatus, policyId: null, permissions: [] } : a
          ),
        }));
        supabase.from('agents').update({ status: 'revoked', policy_id: null, permissions: [] }).eq('id', id).then(({ error }) => {
          if (error) console.error('Supabase agent revoke error:', error);
        });
      },

      pauseAgent: (id) => {
        set((s) => ({
          agents: s.agents.map((a) =>
            a.id === id ? { ...a, status: "paused" as AgentStatus } : a
          ),
        }));
        supabase.from('agents').update({ status: 'paused' }).eq('id', id).then(({ error }) => {
          if (error) console.error('Supabase agent pause error:', error);
        });
      },

      resumeAgent: (id) => {
        set((s) => ({
          agents: s.agents.map((a) =>
            a.id === id ? { ...a, status: "connected" as AgentStatus } : a
          ),
        }));
        supabase.from('agents').update({ status: 'connected' }).eq('id', id).then(({ error }) => {
          if (error) console.error('Supabase agent resume error:', error);
        });
      },

      updateAgent: (id, updates) => {
        set((s) => {
          const updatedAgents = s.agents.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          );
          
          // Try to push to Supabase if it exists in DB
          const dbUpdates = { ...updates };
          if (updates.totalSpent !== undefined) (dbUpdates as any).total_spent = updates.totalSpent;
          if (updates.totalTransactions !== undefined) (dbUpdates as any).total_transactions = updates.totalTransactions;
          if (updates.lastActivity !== undefined) (dbUpdates as any).last_activity = updates.lastActivity;
          
          supabase.from('agents').update(dbUpdates).eq('id', id).then(({ error }) => {
            if (error) console.error('Supabase agent update error:', error);
          });
          
          return { agents: updatedAgents };
        });
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
        supabase.from('approvals').update({ status: 'approved', resolved_at: new Date().toISOString() }).eq('id', id).then(({ error }) => {
          if (error) console.error('Supabase approval error:', error);
        });
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
        supabase.from('approvals').update({ status: 'rejected', resolved_at: new Date().toISOString() }).eq('id', id).then(({ error }) => {
          if (error) console.error('Supabase reject error:', error);
        });
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
        fleets: state.fleets,
        agents: state.agents,
        policies: state.policies,
      }),
    }
  )
);
