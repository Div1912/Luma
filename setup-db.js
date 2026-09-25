import postgres from 'postgres';

const sql = postgres('postgresql://postgres:1912Divyanshu%40@db.xdovsqzuedezkigyvxbv.supabase.co:5432/postgres', { ssl: 'require' });

async function setup() {
  try {
    console.log('Running database setup and migrations on Supabase...');

    // 1. Users table (Stores wallet address, name, email, profile_completed flag)
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        wallet_address TEXT UNIQUE,
        name TEXT NOT NULL,
        email TEXT,
        role TEXT,
        organization TEXT,
        bio TEXT,
        timezone TEXT,
        auth_type TEXT,
        contract_address TEXT,
        profile_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    // Add contract_address column to users if it doesn't exist
    await sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS contract_address TEXT;
    `;
    // Add unique constraint on email if it doesn't exist
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'users_email_key'
        ) THEN
          ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
        END IF;
      END $$;
    `;
    console.log('Table users ready (with contract_address and UNIQUE email constraint).');

    // 2. Transactions table (Immutable record of every on-chain transaction with wallet address, name, and tx hash)
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        tx_hash TEXT NOT NULL,
        wallet_address TEXT NOT NULL,
        user_name TEXT NOT NULL,
        agent_id TEXT,
        agent_name TEXT,
        amount NUMERIC,
        currency TEXT,
        type TEXT,
        status TEXT,
        network TEXT,
        contract_address TEXT,
        description TEXT,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        metadata JSONB
      );
    `;
    console.log('Table transactions ready.');

    // 3. Fleets table
    await sql`
      CREATE TABLE IF NOT EXISTS fleets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        "policyId" TEXT,
        "agentCount" NUMERIC DEFAULT 0,
        "parentFleetId" TEXT
      );
    `;
    console.log('Table fleets ready.');

    // 4. Audit events table
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

    // Add missing columns to audit_events if they don't exist
    await sql`
      ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS wallet_address TEXT;
    `;
    await sql`
      ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS user_name TEXT;
    `;
    await sql`
      ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS tx_hash TEXT;
    `;
    await sql`
      ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS contract_address TEXT;
    `;
    console.log('Columns wallet_address, user_name, tx_hash, contract_address verified on audit_events.');

    // 5. Agents table
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

    // Add wallet_address column to agents if it doesn't exist
    await sql`
      ALTER TABLE agents ADD COLUMN IF NOT EXISTS wallet_address TEXT;
    `;
    console.log('Column wallet_address verified on agents.');

    // 6. Policies table
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

    // 7. Approvals table
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

    // 8. Grant all permissions to anon, authenticated, and service_role
    console.log('Granting table permissions...');
    await sql`GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;`;
    await sql`GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;`;
    await sql`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;`;
    await sql`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;`;

    // 9. Reload PostgREST schema cache
    await sql`NOTIFY pgrst, 'reload schema';`;
    console.log('PostgREST schema cache reload triggered.');

    console.log('Database setup and migration successfully completed!');
  } catch (err) {
    console.error('Error executing database setup:', err);
    throw err;
  } finally {
    await sql.end();
  }
}

setup();
