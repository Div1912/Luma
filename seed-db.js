import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xdovsqzuedezkigyvxbv.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkb3ZzcXp1ZWRlemtpZ3l2eGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3Mzg4MTEsImV4cCI6MjEwMDMxNDgxMX0.rI2F37gh_jvxe7Mcn-9_MSD-H9p_4wyJh6DN_RQnbCU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SEED_POLICIES = [
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
  }
];

const SEED_AGENTS = [
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
  }
];

const SEED_APPROVALS = [
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
  }
];

const SEED_AUDIT_EVENTS = [
  {
    id: "evt_001",
    type: "purchase_approved",
    agent_id: "agt_01",
    agent_name: "ShopperBot v2",
    policy_id: "pol_01",
    merchant: "Amazon",
    amount: 89.99,
    currency: "USD",
    timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
    proof_hash: "0xa1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
    status: "success",
    description: "Purchase approved within policy limits",
    metadata: { policyId: "pol_01", category: "Electronics", latency_ms: 142 },
  },
  {
    id: "evt_002",
    type: "purchase_blocked",
    agent_id: "agt_04",
    agent_name: "FinanceGuard",
    merchant: "CryptoBay",
    amount: 320.0,
    currency: "USD",
    timestamp: new Date(Date.now() - 6 * 60 * 60000).toISOString(),
    status: "blocked",
    description: "Transaction blocked: merchant on blocklist",
    metadata: { policyId: "pol_01", rule: "merchantBlocklist" },
  }
];

async function seed() {
  console.log('Seeding policies...');
  await supabase.from('policies').insert(SEED_POLICIES);
  console.log('Seeding agents...');
  await supabase.from('agents').insert(SEED_AGENTS);
  console.log('Seeding approvals...');
  await supabase.from('approvals').insert(SEED_APPROVALS);
  console.log('Seeding audit events...');
  await supabase.from('audit_events').insert(SEED_AUDIT_EVENTS);
  console.log('Done seeding!');
}

seed().catch(console.error);
