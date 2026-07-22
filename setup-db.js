import postgres from 'postgres';

const sql = postgres('postgresql://postgres:1912Divyanshu%40@db.xdovsqzuedezkigyvxbv.supabase.co:5432/postgres', { ssl: 'require' });

async function setup() {
  try {
    console.log('Creating tables if they do not exist...');

    await sql`
      CREATE TABLE IF NOT EXISTS audit_events (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        agent_id TEXT,
        agent_name TEXT,
        policy_id TEXT,
        merchant TEXT,
        amount NUMERIC,
        currency TEXT,
        timestamp TIMESTAMP WITH TIME ZONE,
        proof_hash TEXT,
        status TEXT,
        description TEXT,
        metadata JSONB
      );
    `;
    console.log('Table audit_events ready.');

    await sql`
      CREATE TABLE IF NOT EXISTS policies (
        id TEXT PRIMARY KEY,
        name TEXT,
        status TEXT,
        "perTransactionLimit" NUMERIC,
        "dailyLimit" NUMERIC,
        "monthlyLimit" NUMERIC,
        "categoryRestrictions" JSONB,
        "merchantAllowlist" JSONB,
        "merchantBlocklist" JSONB,
        "highRiskThreshold" NUMERIC,
        "requiresApprovalAbove" NUMERIC,
        "emergencyRevoke" BOOLEAN,
        "agentCount" NUMERIC,
        "createdAt" TIMESTAMP WITH TIME ZONE,
        "updatedAt" TIMESTAMP WITH TIME ZONE,
        "spentToday" NUMERIC,
        "spentThisMonth" NUMERIC
      );
    `;
    console.log('Table policies ready.');

    await sql`
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        name TEXT,
        type TEXT,
        status TEXT,
        risk TEXT,
        "policyId" TEXT,
        permissions JSONB,
        "lastActivity" TEXT,
        "totalTransactions" NUMERIC,
        "totalSpent" NUMERIC,
        "blockedAttempts" NUMERIC,
        "connectedAt" TIMESTAMP WITH TIME ZONE,
        description TEXT,
        version TEXT
      );
    `;
    console.log('Table agents ready.');

    await sql`
      CREATE TABLE IF NOT EXISTS approvals (
        id TEXT PRIMARY KEY,
        "agentId" TEXT,
        "agentName" TEXT,
        "policyId" TEXT,
        merchant TEXT,
        amount NUMERIC,
        currency TEXT,
        reason TEXT,
        status TEXT,
        "requestedAt" TIMESTAMP WITH TIME ZONE,
        "expiresAt" TIMESTAMP WITH TIME ZONE,
        "resolvedAt" TIMESTAMP WITH TIME ZONE,
        category TEXT,
        "proofHash" TEXT,
        "ruleTriggered" TEXT
      );
    `;
    console.log('Table approvals ready.');
    console.log('Database setup complete!');
    
  } catch (err) {
    console.error('Error creating tables:', err);
  } finally {
    await sql.end();
  }
}

setup();
