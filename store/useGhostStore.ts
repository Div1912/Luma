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

// ─── No Seed Data, Fetching from Supabase ──────────────────────────────────────

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

  // Data actions
  fetchData: () => Promise<void>;

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
      policies: [],
      agents: [],
      approvals: [],
      auditEvents: [],

      metrics: {
        activePolicies: 0,
        activeAgents: 0,
        pendingApprovals: 0,
        blockedToday: 0,
        approvedToday: 0,
        totalSpentToday: 0,
        totalSpentMonth: 0,
        proofVerifications: 0,
      },

      fetchData: async () => {
        const { fetchOnChainStateFromSupabase } = await import('@/lib/supabase');
        const data = await fetchOnChainStateFromSupabase();
        if (data) {
          set({
            policies: data.policies || [],
            agents: data.agents || [],
            approvals: data.approvals || [],
            auditEvents: data.auditEvents || [],
            metrics: {
              activePolicies: data.policies?.length || 0,
              activeAgents: data.agents?.filter((a: any) => a.status === 'connected').length || 0,
              pendingApprovals: data.approvals?.filter((a: any) => a.status === 'pending').length || 0,
              blockedToday: data.auditEvents?.filter((e: any) => e.type === 'purchase_blocked').length || 0,
              approvedToday: data.auditEvents?.filter((e: any) => e.type === 'purchase_approved').length || 0,
              totalSpentToday: 0, // calculate if needed
              totalSpentMonth: 0,
              proofVerifications: data.auditEvents?.filter((e: any) => e.type === 'proof_verified').length || 0,
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
