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
  walletAddress?: string;
  txHash?: string;
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
  walletAddress?: string;
  userName?: string;
  policyId?: string;
  merchant?: string;
  amount?: number;
  currency?: string;
  timestamp: string;
  proofHash?: string;
  txHash?: string;
  status: "success" | "failed" | "blocked" | "pending";
  description: string;
  metadata: Record<string, any>;
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
  authType?: "wallet" | "credentials" | "demo";
  walletAddress?: string;
  profileCompleted: boolean;
}

interface GhostStore {
  // Auth
  isAuthenticated: boolean;
  isDemoMode: boolean;
  user: UserProfile | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; isNewUser?: boolean; error?: string }>;
  signInDemo: () => void;
  signInWallet: (address: string) => Promise<{ isNewUser: boolean }>;
  completeProfile: (profileData: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;

  // Data
  policies: Policy[];
  agents: Agent[];
  fleets: Fleet[];
  approvals: Approval[];
  auditEvents: AuditEvent[];
  transactions: any[];
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

  updateUser: (userUpdates: Partial<{ email: string; name: string; avatar?: string; role?: string; organization?: string; bio?: string; timezone?: string }>) => Promise<void>;

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
        await new Promise((r) => setTimeout(r, 400));
        if (!email || !password) {
          return { success: false, error: "Please enter your email and password" };
        }
        if (password.length < 6) {
          return { success: false, error: "Password must be at least 6 characters" };
        }

        const { checkUserRegistered } = await import("@/lib/supabase");
        const { isRegistered, user: dbUser } = await checkUserRegistered({ email });

        if (isRegistered && dbUser) {
          set({
            isAuthenticated: true,
            isDemoMode: false,
            user: { 
              email: dbUser.email || email, 
              name: dbUser.name, 
              avatar: undefined,
              role: dbUser.role || "Chief AI Security Architect",
              organization: dbUser.organization || "Ghost Autonomous Swarms Inc.",
              bio: dbUser.bio || "Orchestrating zero-knowledge policy firewalls across autonomous AI agent fleets.",
              timezone: dbUser.timezone || "UTC-8 (Pacific Time)",
              authType: "credentials",
              walletAddress: dbUser.wallet_address || undefined,
              profileCompleted: true
            },
          });
          return { success: true, isNewUser: false };
        }

        const namePart = email.split("@")[0];
        const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        const isDemo = email === "demo@ghost.xyz";
        set({
          isAuthenticated: true,
          isDemoMode: isDemo,
          user: { 
            email, 
            name: isDemo ? "Alex Morgan" : (dbUser?.name || formattedName), 
            avatar: undefined,
            role: dbUser?.role || "Chief AI Security Architect",
            organization: dbUser?.organization || "Ghost Autonomous Swarms Inc.",
            bio: dbUser?.bio || "Orchestrating zero-knowledge policy firewalls across autonomous AI agent fleets.",
            timezone: dbUser?.timezone || "UTC-8 (Pacific Time)",
            authType: "credentials",
            walletAddress: dbUser?.wallet_address || undefined,
            profileCompleted: isDemo ? true : Boolean(dbUser?.profile_completed)
          },
        });
        return { success: true, isNewUser: !isDemo && !dbUser?.profile_completed };
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
            timezone: "UTC-8 (Pacific Time)",
            authType: "demo",
            walletAddress: undefined,
            profileCompleted: true
          },
        });
      },

      signInWallet: async (address: string) => {
        const { checkUserRegistered } = await import("@/lib/supabase");
        const { isRegistered, user: dbUser } = await checkUserRegistered({ walletAddress: address });

        if (isRegistered && dbUser) {
          // Existing user who already completed registration and saved their profile once!
          set({
            isAuthenticated: true,
            isDemoMode: false,
            user: { 
              email: dbUser.email || `${address.slice(0, 8)}...${address.slice(-6)}@midnight.network`, 
              name: dbUser.name,
              role: dbUser.role || "Lead ZK Systems Engineer",
              organization: dbUser.organization || "Midnight Enterprise Validator",
              bio: dbUser.bio || "Verifying encrypted proofs and multi-party quorum contracts on Midnight preprod ledger.",
              timezone: dbUser.timezone || "UTC (Coordinated Universal Time)",
              authType: "wallet",
              walletAddress: address,
              profileCompleted: true
            },
          });
          return { isNewUser: false };
        }

        // New user or incomplete profile: must complete onboarding before accessing dashboard
        set({
          isAuthenticated: true,
          isDemoMode: false,
          user: { 
            email: `${address.slice(0, 8)}...${address.slice(-6)}@midnight.network`, 
            name: dbUser?.name || "",
            role: dbUser?.role || "Lead ZK Systems Engineer",
            organization: dbUser?.organization || "Midnight Enterprise Validator",
            bio: dbUser?.bio || "Verifying encrypted proofs and multi-party quorum contracts on Midnight preprod ledger.",
            timezone: dbUser?.timezone || "UTC (Coordinated Universal Time)",
            authType: "wallet",
            walletAddress: address,
            profileCompleted: false
          },
        });
        return { isNewUser: true };
      },

      completeProfile: async (profileData) => {
        const currentUser = get().user;
        const walletAddress = currentUser?.walletAddress;
        const email = profileData.email || currentUser?.email || "user@midnight.network";
        const name = profileData.name || currentUser?.name || "Midnight Node Admin";
        const role = profileData.role || currentUser?.role || "Lead ZK Systems Engineer";
        const organization = profileData.organization || currentUser?.organization || "Midnight Enterprise Validator";
        const bio = profileData.bio || currentUser?.bio || "";
        const timezone = profileData.timezone || currentUser?.timezone || "UTC";

        const { saveUserToSupabase } = await import("@/lib/supabase");
        const res = await saveUserToSupabase({
          walletAddress,
          email,
          name,
          role,
          organization,
          bio,
          timezone,
          authType: currentUser?.authType || (walletAddress ? "wallet" : "credentials"),
          profileCompleted: true
        });

        if (!res.success) {
          console.error("completeProfile Supabase error:", res.error);
          return { success: false, error: res.error };
        }

        set({
          user: {
            ...currentUser,
            name,
            email,
            role,
            organization,
            bio,
            timezone,
            walletAddress,
            authType: currentUser?.authType || (walletAddress ? "wallet" : "credentials"),
            profileCompleted: true
          }
        });

        return { success: true };
      },

      signOut: () => {
        // Synchronously nuke the persisted auth from localStorage so the next
        // page load never rehydrates as authenticated. We cannot rely on the
        // Zustand persist flush timing being fast enough before router.replace fires.
        try {
          const raw = localStorage.getItem('ghost-store');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.state) {
              parsed.state.isAuthenticated = false;
              parsed.state.user = null;
              localStorage.setItem('ghost-store', JSON.stringify(parsed));
            }
          }
          localStorage.removeItem('ghost_contract_address');
        } catch (_) { /* ignore */ }
        set({ isAuthenticated: false, isDemoMode: false, user: null });
      },

      updateUser: async (userUpdates) => {
        const currentUser = get().user;
        const updatedUser: UserProfile = currentUser ? { ...currentUser, ...userUpdates } : {
          email: "alex@ghost.xyz",
          name: "Alex Morgan",
          profileCompleted: true,
          authType: "credentials",
          ...userUpdates
        };
        set({ user: updatedUser });

        if (updatedUser.walletAddress || updatedUser.email) {
          const { saveUserToSupabase } = await import("@/lib/supabase");
          saveUserToSupabase({
            walletAddress: updatedUser.walletAddress,
            email: updatedUser.email,
            name: updatedUser.name,
            role: updatedUser.role,
            organization: updatedUser.organization,
            bio: updatedUser.bio,
            timezone: updatedUser.timezone,
            authType: updatedUser.authType,
            profileCompleted: updatedUser.profileCompleted
          }).then(res => {
            if (!res.success) console.warn("Supabase updateUser sync warning:", res.error);
          });
        }
      },

      // Data
      policies: [],
      agents: [],
      fleets: [],
      approvals: INITIAL_APPROVALS,
      auditEvents: [],
      transactions: [],

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
        if (data) {
          set((s) => ({
            policies: data.policies || s.policies,
            agents: data.agents || s.agents,
            fleets: data.fleets || s.fleets,
            approvals: data.approvals && data.approvals.length > 0 ? data.approvals : s.approvals,
            auditEvents: data.auditEvents || s.auditEvents,
            transactions: data.transactions || s.transactions,
            metrics: {
              activePolicies: data.policies?.length || s.metrics.activePolicies,
              activeAgents: data.agents?.filter((a: any) => a.status === 'connected').length || s.metrics.activeAgents,
              pendingApprovals: data.approvals?.filter((a: any) => a.status === 'pending').length || s.metrics.pendingApprovals,
              blockedToday: data.auditEvents?.filter((e: any) => e.type === 'purchase_blocked').length || s.metrics.blockedToday,
              approvedToday: data.auditEvents?.filter((e: any) => e.type === 'purchase_approved').length || s.metrics.approvedToday,
              totalSpentToday: 38400,
              totalSpentMonth: 194500,
              proofVerifications: data.auditEvents?.filter((e: any) => e.type === 'proof_verified').length || s.metrics.proofVerifications,
            }
          }));
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
          policyId: newAgent.policyId,
          permissions: newAgent.permissions,
          lastActivity: newAgent.lastActivity,
          totalTransactions: newAgent.totalTransactions,
          totalSpent: newAgent.totalSpent,
          blockedAttempts: newAgent.blockedAttempts,
          connectedAt: newAgent.connectedAt,
          description: newAgent.description,
          version: newAgent.version,
          wallet_address: (newAgent as any).walletAddress || null
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
        
        const records = newAgents.map(a => ({
          id: a.id,
          name: a.name,
          type: a.type,
          status: a.status,
          risk: a.risk,
          policyId: a.policyId,
          permissions: a.permissions,
          lastActivity: a.lastActivity,
          totalTransactions: a.totalTransactions,
          totalSpent: a.totalSpent,
          blockedAttempts: a.blockedAttempts,
          connectedAt: a.connectedAt,
          description: a.description,
          version: a.version,
          wallet_address: (a as any).walletAddress || null
        }));

        supabase.from('agents').insert(records).then(({ error }) => {
          if (error) console.error('Supabase bulk agents save error:', error);
        });
      },

      revokeAgent: (id) => {
        set((s) => ({
          agents: s.agents.map((a) =>
            a.id === id ? { ...a, status: "revoked" as AgentStatus, policyId: null, permissions: [] } : a
          ),
        }));
        supabase.from('agents').update({ status: 'revoked', policyId: null, permissions: [] }).eq('id', id).then(({ error }) => {
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
          
          const dbUpdates: Record<string, any> = { ...updates };
          if (updates.policyId !== undefined) dbUpdates.policyId = updates.policyId;
          if (updates.totalSpent !== undefined) dbUpdates.totalSpent = updates.totalSpent;
          if (updates.totalTransactions !== undefined) dbUpdates.totalTransactions = updates.totalTransactions;
          if (updates.lastActivity !== undefined) dbUpdates.lastActivity = updates.lastActivity;
          
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
        supabase.from('approvals').update({ status: 'approved', resolvedAt: new Date().toISOString() }).eq('id', id).then(({ error }) => {
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
        supabase.from('approvals').update({ status: 'rejected', resolvedAt: new Date().toISOString() }).eq('id', id).then(({ error }) => {
          if (error) console.error('Supabase reject error:', error);
        });
      },

      addAuditEvent: (event) => {
        set((s) => {
          const userWallet = (event as any).walletAddress || (event as any).metadata?.wallet_address || s.user?.walletAddress || null;
          const currentUserName = (event as any).userName || (event as any).metadata?.user_name || s.user?.name || null;
          const txHash = (event as any).txHash || event.proofHash || null;

          const newEvent: AuditEvent = {
            ...event,
            id: `evt_${Date.now()}`,
            walletAddress: userWallet || undefined,
            userName: currentUserName || undefined,
            txHash: txHash || undefined,
            timestamp: new Date().toISOString(),
          };

          // 1. Write to Supabase audit_events table
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
            proof_hash: newEvent.proofHash || txHash || null,
            tx_hash: txHash || newEvent.proofHash || null,
            wallet_address: userWallet,
            user_name: currentUserName,
            status: newEvent.status,
            description: newEvent.description,
            metadata: {
              ...(newEvent.metadata || {}),
              wallet_address: userWallet,
              user_name: currentUserName,
              tx_hash: txHash
            }
          }]).then(({ error }) => {
            if (error) console.error('Supabase audit event error:', error);
          });

          // 2. If this is an on-chain transaction with a tx hash, record in transactions table
          if (txHash && (newEvent.type === 'purchase_approved' || newEvent.type === 'proof_verified')) {
            import('@/lib/supabase').then(({ saveTransactionToSupabase }) => {
              saveTransactionToSupabase({
                txHash,
                walletAddress: userWallet || 'mn_unspecified',
                userName: currentUserName || 'Midnight Node Admin',
                agentId: newEvent.agentId,
                agentName: newEvent.agentName,
                amount: newEvent.amount,
                currency: newEvent.currency,
                type: newEvent.type,
                status: newEvent.status,
                description: newEvent.description,
                contractAddress: newEvent.metadata?.contractAddress,
                metadata: newEvent.metadata
              });
            });
          }

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
