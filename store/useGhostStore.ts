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
  | "approval_rejected"
  | "contract_deployed"
  | "dispute_filed";

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
  contractAddress?: string;
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
  authType?: "wallet" | "credentials";
  walletAddress?: string;
  contractAddress?: string;
  profileCompleted: boolean;
}

interface GhostStore {
  // Auth
  isAuthenticated: boolean;
  user: UserProfile | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; isNewUser?: boolean; error?: string }>;
  signInWallet: (address: string) => Promise<{ isNewUser: boolean }>;
  completeProfile: (profileData: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  setUserContractAddress: (contractAddress: string) => Promise<void>;
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

  updateUser: (userUpdates: Partial<UserProfile>) => Promise<void>;

  // UI state
  commandMenuOpen: boolean;
  setCommandMenuOpen: (open: boolean) => void;
}

export const useGhostStore = create<GhostStore>()(
  persist(
    (set, get) => ({
      // Auth
      isAuthenticated: false,
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
          if (dbUser.contract_address && typeof window !== 'undefined') {
            const currentSaved = localStorage.getItem('ghost_contract_address');
            if (!currentSaved || currentSaved === 'none' || currentSaved === 'reset') {
              localStorage.setItem('ghost_contract_address', dbUser.contract_address);
            }
          }
          set({
            isAuthenticated: true,
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
              contractAddress: dbUser.contract_address || undefined,
              profileCompleted: true
            },
          });
          return { success: true, isNewUser: false };
        }

        const namePart = email.split("@")[0];
        const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        if (dbUser?.contract_address && typeof window !== 'undefined') {
          const currentSaved = localStorage.getItem('ghost_contract_address');
          if (!currentSaved || currentSaved === 'none' || currentSaved === 'reset') {
            localStorage.setItem('ghost_contract_address', dbUser.contract_address);
          }
        }
        set({
          isAuthenticated: true,
          user: { 
            email, 
            name: dbUser?.name || formattedName, 
            avatar: undefined,
            role: dbUser?.role || "Chief AI Security Architect",
            organization: dbUser?.organization || "Ghost Autonomous Swarms Inc.",
            bio: dbUser?.bio || "Orchestrating zero-knowledge policy firewalls across autonomous AI agent fleets.",
            timezone: dbUser?.timezone || "UTC-8 (Pacific Time)",
            authType: "credentials",
            walletAddress: dbUser?.wallet_address || undefined,
            contractAddress: dbUser?.contract_address || undefined,
            profileCompleted: Boolean(dbUser?.profile_completed)
          },
        });
        return { success: true, isNewUser: !dbUser?.profile_completed };
      },

      signInWallet: async (address: string) => {
        const { checkUserRegistered, saveUserToSupabase } = await import("@/lib/supabase");
        const { isRegistered, user: fetchedUser } = await checkUserRegistered({ walletAddress: address });
        let dbUser = fetchedUser;

        const uniqueEmail = `${address.slice(0, 14)}_${address.slice(-6)}@midnight.network`;

        // If user is not yet in Supabase, immediately persist them so they are NEVER lost!
        if (!dbUser) {
          const autoName = `Operator ${address.slice(-4)}`;
          const saveRes = await saveUserToSupabase({
            walletAddress: address,
            name: autoName,
            email: uniqueEmail,
            role: "Lead ZK Systems Engineer",
            organization: "Midnight Enterprise Validator",
            bio: "Verifying encrypted proofs and multi-party quorum contracts on Midnight preprod ledger.",
            timezone: "UTC (Coordinated Universal Time)",
            authType: "wallet",
            profileCompleted: false
          });
          if (saveRes.success && saveRes.data) {
            dbUser = saveRes.data;
          }
        }

        if (isRegistered && dbUser && dbUser.profile_completed) {
          // Existing user who already completed registration and saved their profile once!
          if (dbUser.contract_address && typeof window !== 'undefined') {
            const currentSaved = localStorage.getItem('ghost_contract_address');
            if (!currentSaved || currentSaved === 'none' || currentSaved === 'reset') {
              localStorage.setItem('ghost_contract_address', dbUser.contract_address);
            }
          }
          set({
            isAuthenticated: true,
            user: { 
              email: dbUser.email || uniqueEmail, 
              name: dbUser.name,
              role: dbUser.role || "Lead ZK Systems Engineer",
              organization: dbUser.organization || "Midnight Enterprise Validator",
              bio: dbUser.bio || "Verifying encrypted proofs and multi-party quorum contracts on Midnight preprod ledger.",
              timezone: dbUser.timezone || "UTC (Coordinated Universal Time)",
              authType: "wallet",
              walletAddress: address,
              contractAddress: dbUser.contract_address || undefined,
              profileCompleted: true
            },
          });
          return { isNewUser: false };
        }

        // New user or incomplete profile:
        if (dbUser?.contract_address && typeof window !== 'undefined') {
          const currentSaved = localStorage.getItem('ghost_contract_address');
          if (!currentSaved || currentSaved === 'none' || currentSaved === 'reset') {
            localStorage.setItem('ghost_contract_address', dbUser.contract_address);
          }
        }
        set({
          isAuthenticated: true,
          user: { 
            email: dbUser?.email || uniqueEmail, 
            name: dbUser?.name || `Operator ${address.slice(-4)}`,
            role: dbUser?.role || "Lead ZK Systems Engineer",
            organization: dbUser?.organization || "Midnight Enterprise Validator",
            bio: dbUser?.bio || "Verifying encrypted proofs and multi-party quorum contracts on Midnight preprod ledger.",
            timezone: dbUser?.timezone || "UTC (Coordinated Universal Time)",
            authType: "wallet",
            walletAddress: address,
            contractAddress: dbUser?.contract_address || undefined,
            profileCompleted: false
          },
        });
        return { isNewUser: true };
      },

      completeProfile: async (profileData) => {
        const currentUser = get().user;
        // profileData.walletAddress takes priority — it comes directly from the
        // active 1AM wallet on the profile page. Fall back to what is persisted in Zustand.
        const walletAddress = (profileData as any).walletAddress || currentUser?.walletAddress;
        const contractAddress = currentUser?.contractAddress || (typeof window !== 'undefined' ? localStorage.getItem('ghost_contract_address') || undefined : undefined);
        const cleanContract = (contractAddress && contractAddress !== 'none' && contractAddress !== 'reset')
          ? contractAddress.replace(/^0x/, '').trim()
          : undefined;
        const fallbackEmail = walletAddress
          ? `${walletAddress.slice(0, 14)}_${walletAddress.slice(-6)}@midnight.network`
          : `user_${Date.now()}@midnight.network`;
        const email = profileData.email || currentUser?.email || fallbackEmail;
        const name = profileData.name || currentUser?.name || (walletAddress ? `Operator ${walletAddress.slice(-4)}` : "Midnight Node Admin");
        const role = profileData.role || currentUser?.role || "Lead ZK Systems Engineer";
        const organization = profileData.organization || currentUser?.organization || "Midnight Enterprise Validator";
        const bio = profileData.bio || currentUser?.bio || "";
        const timezone = profileData.timezone || currentUser?.timezone || "UTC";

        const { saveUserToSupabase } = await import("@/lib/supabase");
        const res = await saveUserToSupabase({
          walletAddress,
          contractAddress: cleanContract,
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
            contractAddress: cleanContract,
            authType: currentUser?.authType || (walletAddress ? "wallet" : "credentials"),
            profileCompleted: true
          }
        });

        return { success: true };
      },

      setUserContractAddress: async (contractAddress: string) => {
        const clean = contractAddress ? contractAddress.replace(/^0x/, '').trim() : '';
        if (!clean) return;

        if (typeof window !== 'undefined') {
          localStorage.setItem('ghost_contract_address', clean);
        }

        const currentUser = get().user;
        if (currentUser) {
          set({
            user: {
              ...currentUser,
              contractAddress: clean
            }
          });
        }

        const wallet = currentUser?.walletAddress || (currentUser as any)?.wallet_address;
        if (wallet && wallet !== 'mn_unspecified') {
          const { updateUserContractAddress } = await import("@/lib/supabase");
          await updateUserContractAddress(wallet, clean);
        }
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
        set({ isAuthenticated: false, user: null });
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

        if (updatedUser.contractAddress && typeof window !== 'undefined') {
          localStorage.setItem('ghost_contract_address', updatedUser.contractAddress.replace(/^0x/, '').trim());
        }

        const effectiveWallet = updatedUser.walletAddress || currentUser?.walletAddress;
        if (effectiveWallet || updatedUser.email) {
          const { saveUserToSupabase } = await import("@/lib/supabase");
          const res = await saveUserToSupabase({
            walletAddress: effectiveWallet,
            contractAddress: updatedUser.contractAddress || currentUser?.contractAddress,
            email: updatedUser.email,
            name: updatedUser.name,
            role: updatedUser.role,
            organization: updatedUser.organization,
            bio: updatedUser.bio,
            timezone: updatedUser.timezone,
            authType: updatedUser.authType,
            profileCompleted: updatedUser.profileCompleted
          });
          if (!res.success) {
            console.warn("Supabase updateUser sync warning:", res.error);
          }
        }
      },

      // Data
      policies: [],
      agents: [],
      fleets: [],
      approvals: [],
      auditEvents: [],
      transactions: [],

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
          const policies = data.policies || [];
          const agents = data.agents || [];
          const fleets = data.fleets || [];
          const approvals = data.approvals || [];
          const auditEvents = data.auditEvents || [];
          const transactions = data.transactions || [];

          // Compute today's and this month's spent dynamically from transactions & audit events
          const now = new Date();
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

          let spentToday = 0;
          let spentMonth = 0;
          let blockedToday = 0;
          let approvedToday = 0;
          let proofVerifications = 0;

          for (const tx of transactions) {
            const txTime = new Date(tx.created_at || tx.timestamp).getTime();
            const amt = Number(tx.amount) || 0;
            if (txTime >= monthStart) {
              spentMonth += amt;
            }
            if (txTime >= todayStart) {
              spentToday += amt;
            }
          }

          for (const evt of auditEvents) {
            const evtTime = new Date(evt.timestamp).getTime();
            if (evt.type === 'proof_verified') {
              proofVerifications++;
            }
            if (evtTime >= todayStart) {
              if (evt.type === 'purchase_blocked') blockedToday++;
              if (evt.type === 'purchase_approved') approvedToday++;
            }
          }

          set((s) => ({
            policies: policies.length > 0 ? policies : s.policies,
            agents: agents.length > 0 ? agents : s.agents,
            fleets: fleets.length > 0 ? fleets : s.fleets,
            approvals: approvals.length > 0 ? approvals : s.approvals,
            auditEvents: auditEvents.length > 0 ? auditEvents : s.auditEvents,
            transactions: transactions.length > 0 ? transactions : s.transactions,
            metrics: {
              activePolicies: policies.filter((p: any) => p.status === 'active').length,
              activeAgents: agents.filter((a: any) => a.status === 'connected').length,
              pendingApprovals: approvals.filter((a: any) => a.status === 'pending').length,
              blockedToday,
              approvedToday,
              totalSpentToday: spentToday,
              totalSpentMonth: spentMonth,
              proofVerifications,
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
          const rawContractAddress = (event as any).contractAddress 
            || (event as any).metadata?.contractAddress 
            || (event.type === 'policy_created' ? event.policyId : null);
          const cleanContractAddress = rawContractAddress && typeof rawContractAddress === 'string' && rawContractAddress !== 'none' && rawContractAddress !== 'reset'
            ? rawContractAddress.replace(/^0x/, '').trim()
            : null;

          const newEvent: AuditEvent = {
            ...event,
            id: `evt_${Date.now()}`,
            walletAddress: userWallet || undefined,
            userName: currentUserName || undefined,
            contractAddress: cleanContractAddress || undefined,
            txHash: txHash || undefined,
            timestamp: new Date().toISOString(),
          };

          // 1. Write to Supabase audit_events table with wallet address, user name, tx hash, and contract address
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
            contract_address: cleanContractAddress,
            status: newEvent.status,
            description: newEvent.description,
            metadata: {
              ...(newEvent.metadata || {}),
              contractAddress: cleanContractAddress,
              wallet_address: userWallet,
              user_name: currentUserName,
              tx_hash: txHash
            }
          }]).then(({ error }) => {
            if (error) console.error('Supabase audit event error:', error);
          });

          // 2. If this is an on-chain transaction with a tx hash (or contract deployment), record in transactions table
          const isDeploy = newEvent.type === 'policy_created' || (newEvent as any).type === 'contract_deployed';
          if (txHash && (newEvent.type === 'purchase_approved' || newEvent.type === 'proof_verified' || isDeploy)) {
            import('@/lib/supabase').then(({ saveTransactionToSupabase, updateUserContractAddress }) => {
              saveTransactionToSupabase({
                txHash,
                walletAddress: userWallet || 'mn_unspecified',
                userName: currentUserName || 'Midnight Node Admin',
                agentId: newEvent.agentId,
                agentName: newEvent.agentName,
                amount: newEvent.amount,
                currency: newEvent.currency,
                type: isDeploy ? 'contract_deployment' : newEvent.type,
                status: newEvent.status,
                network: (newEvent.metadata?.network as string) || 'preprod',
                contractAddress: cleanContractAddress || undefined,
                description: newEvent.description,
                metadata: {
                  ...(newEvent.metadata || {}),
                  contractAddress: cleanContractAddress,
                  walletAddress: userWallet,
                  userName: currentUserName,
                  txHash
                }
              });

              // When deploying, persist user's contract address to their user record in Supabase
              if (isDeploy && cleanContractAddress && userWallet && userWallet !== 'mn_unspecified') {
                updateUserContractAddress(userWallet, cleanContractAddress);
              }
            });
          }

          const updatedUser = (isDeploy && cleanContractAddress && s.user)
            ? { ...s.user, contractAddress: cleanContractAddress }
            : s.user;

          if (isDeploy && cleanContractAddress && typeof window !== 'undefined') {
            localStorage.setItem('ghost_contract_address', cleanContractAddress);
          }

          return {
            user: updatedUser,
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
        user: state.user,
        fleets: state.fleets,
        agents: state.agents,
        policies: state.policies,
      }),
    }
  )
);
