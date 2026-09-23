import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkb3ZzcXp1ZWRlemtpZ3l2eGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3Mzg4MTEsImV4cCI6MjEwMDMxNDgxMX0.mock';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (...args) => {
      if (supabaseUrl === 'https://mock.supabase.co') {
        return Promise.resolve(new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      return fetch(...args);
    }
  }
});

export interface DbUser {
  id: string;
  wallet_address?: string | null;
  name: string;
  email?: string | null;
  role?: string | null;
  organization?: string | null;
  bio?: string | null;
  timezone?: string | null;
  auth_type?: string | null;
  profile_completed?: boolean;
  created_at?: string;
  last_active?: string;
}

export interface DbTransaction {
  id: string;
  tx_hash: string;
  wallet_address: string;
  user_name: string;
  agent_id?: string | null;
  agent_name?: string | null;
  amount?: number | null;
  currency?: string | null;
  type?: string | null;
  status?: string | null;
  network?: string | null;
  contract_address?: string | null;
  description?: string | null;
  timestamp?: string;
  metadata?: Record<string, any>;
}

/**
 * Checks whether a user exists and has already completed their profile.
 * Used to ensure existing users are only registered once and not repeatedly asked.
 */
export async function checkUserRegistered(identifier: { walletAddress?: string; email?: string }): Promise<{ isRegistered: boolean; user?: DbUser | null }> {
  if (supabaseUrl === 'https://mock.supabase.co') {
    return { isRegistered: false, user: null };
  }
  try {
    let query = supabase.from('users').select('*');
    if (identifier.walletAddress) {
      query = query.eq('wallet_address', identifier.walletAddress.trim());
    } else if (identifier.email) {
      query = query.eq('email', identifier.email.trim().toLowerCase());
    } else {
      return { isRegistered: false, user: null };
    }

    const { data, error } = await query.limit(1).maybeSingle();
    if (error) {
      console.warn('Supabase checkUserRegistered error:', error.message);
      return { isRegistered: false, user: null };
    }

    if (data && data.profile_completed) {
      return { isRegistered: true, user: data as DbUser };
    }

    return { isRegistered: false, user: (data as DbUser) || null };
  } catch (e) {
    console.error('checkUserRegistered unexpected error:', e);
    return { isRegistered: false, user: null };
  }
}

/**
 * Saves or updates a user profile in Supabase and marks profile_completed = true.
 */
export async function saveUserToSupabase(userData: {
  id?: string;
  walletAddress?: string;
  name: string;
  email?: string;
  role?: string;
  organization?: string;
  bio?: string;
  timezone?: string;
  authType?: string;
  profileCompleted?: boolean;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  if (supabaseUrl === 'https://mock.supabase.co') {
    return { success: true };
  }
  try {
    const id = userData.id || userData.walletAddress || userData.email || `usr_${Date.now()}`;
    const record: DbUser = {
      id,
      wallet_address: userData.walletAddress ? userData.walletAddress.trim() : null,
      name: userData.name.trim(),
      email: userData.email ? userData.email.trim().toLowerCase() : null,
      role: userData.role ? userData.role.trim() : 'AI Systems Architect',
      organization: userData.organization ? userData.organization.trim() : 'Ghost Network',
      bio: userData.bio || '',
      timezone: userData.timezone || 'UTC',
      auth_type: userData.authType || 'wallet',
      profile_completed: userData.profileCompleted !== undefined ? userData.profileCompleted : true,
      last_active: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('users')
      .upsert(record, { onConflict: userData.walletAddress ? 'wallet_address' : 'id' })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Supabase saveUser error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (e: any) {
    console.error('saveUserToSupabase unexpected error:', e);
    return { success: false, error: e.message || String(e) };
  }
}

/**
 * Stores an immutable on-chain transaction record in Supabase with wallet address,
 * user name, and transaction hash.
 */
export async function saveTransactionToSupabase(txData: {
  id?: string;
  txHash: string;
  walletAddress: string;
  userName: string;
  agentId?: string;
  agentName?: string;
  amount?: number;
  currency?: string;
  type?: string;
  status?: string;
  network?: string;
  contractAddress?: string;
  description?: string;
  metadata?: Record<string, any>;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  if (supabaseUrl === 'https://mock.supabase.co') {
    return { success: true };
  }
  try {
    const cleanHash = txData.txHash ? txData.txHash.replace(/^0x/, '').trim() : `${Date.now()}`;
    const txId = txData.id || `tx_${cleanHash}`;
    const record: DbTransaction = {
      id: txId,
      tx_hash: txData.txHash,
      wallet_address: txData.walletAddress,
      user_name: txData.userName,
      agent_id: txData.agentId || null,
      agent_name: txData.agentName || null,
      amount: txData.amount || 0,
      currency: txData.currency || 'tDUST',
      type: txData.type || 'spend',
      status: txData.status || 'success',
      network: txData.network || 'preprod',
      contract_address: txData.contractAddress || null,
      description: txData.description || null,
      timestamp: new Date().toISOString(),
      metadata: txData.metadata || {}
    };

    const { data, error } = await supabase
      .from('transactions')
      .upsert(record, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Supabase saveTransaction error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (e: any) {
    console.error('saveTransactionToSupabase unexpected error:', e);
    return { success: false, error: e.message || String(e) };
  }
}

export async function fetchOnChainStateFromSupabase() {
  if (supabaseUrl === 'https://mock.supabase.co') return null;
  try {
    const { data: auditEvents } = await supabase.from('audit_events').select('*').order('timestamp', { ascending: false });
    const { data: policies } = await supabase.from('policies').select('*');
    const { data: agents } = await supabase.from('agents').select('*');
    const { data: fleets } = await supabase.from('fleets').select('*');
    const { data: approvals } = await supabase.from('approvals').select('*');
    const { data: users } = await supabase.from('users').select('*');
    const { data: transactions } = await supabase.from('transactions').select('*').order('timestamp', { ascending: false });
    return { auditEvents, policies, agents, fleets, approvals, users, transactions };
  } catch (e) {
    console.error('Supabase fetch error:', e);
    return null;
  }
}
