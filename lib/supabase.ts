import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xdovsqzuedezkigyvxbv.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkb3ZzcXp1ZWRlemtpZ3l2eGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3Mzg4MTEsImV4cCI6MjEwMDMxNDgxMX0.rI2F37gh_jvxe7Mcn-9_MSD-H9p_4wyJh6DN_RQnbCU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface DbUser {
  id: string;
  wallet_address?: string | null;
  contract_address?: string | null;
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
  contractAddress?: string | null;
  name: string;
  email?: string;
  role?: string;
  organization?: string;
  bio?: string;
  timezone?: string;
  authType?: string;
  profileCompleted?: boolean;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Deterministic ID: wallet address first, then email — NEVER a random timestamp.
    // This ensures upsert always matches the same row on repeated saves.
    const id = userData.id
      || (userData.walletAddress ? userData.walletAddress.trim() : null)
      || (userData.email ? userData.email.trim().toLowerCase() : null)
      || `usr_${Date.now()}`;

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
      ...(userData.contractAddress !== undefined ? { contract_address: userData.contractAddress ? userData.contractAddress.replace(/^0x/, '').trim() : null } : {}),
      profile_completed: userData.profileCompleted !== undefined ? userData.profileCompleted : true,
      last_active: new Date().toISOString()
    };

    // Pick the conflict column that actually has a unique index.
    // wallet users  → conflict on 'wallet_address'
    // email users   → conflict on 'email'  (fallback: 'id' which is set to email)
    const onConflict = userData.walletAddress
      ? 'wallet_address'
      : userData.email
        ? 'email'
        : 'id';

    let { data, error } = await supabase
      .from('users')
      .upsert(record, { onConflict })
      .select()
      .maybeSingle();

    if (error && error.message?.includes('users_email_key')) {
      console.warn(`Duplicate email detected on user upsert (${error.message}). Retrying with unique address-based email or null...`);
      record.email = userData.walletAddress
        ? `${userData.walletAddress.slice(0, 16)}_${userData.walletAddress.slice(-8)}@midnight.network`
        : null;
      const emailRetry = await supabase
        .from('users')
        .upsert(record, { onConflict })
        .select()
        .maybeSingle();
      data = emailRetry.data;
      error = emailRetry.error;
    }

    if (error && onConflict !== 'id') {
      console.warn(`Upsert on ${onConflict} failed, retrying on conflict 'id':`, error.message);
      const retry = await supabase
        .from('users')
        .upsert(record, { onConflict: 'id' })
        .select()
        .maybeSingle();
      data = retry.data;
      error = retry.error;
    }

    // Direct update fallback if upsert fails on constraint
    if (error && userData.walletAddress) {
      console.warn(`Upsert failed, falling back to direct UPDATE for wallet ${userData.walletAddress.slice(0, 16)}...`);
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({
          name: record.name,
          email: record.email,
          role: record.role,
          organization: record.organization,
          bio: record.bio,
          timezone: record.timezone,
          auth_type: record.auth_type,
          ...(record.contract_address ? { contract_address: record.contract_address } : {}),
          profile_completed: record.profile_completed,
          last_active: record.last_active
        })
        .or(`wallet_address.eq.${userData.walletAddress.trim()},id.eq.${record.id}`)
        .select()
        .maybeSingle();

      if (!updateError && updateData) {
        return { success: true, data: updateData };
      }
    }

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
 * Updates a user's deployed contract address in Supabase.
 */
export async function updateUserContractAddress(
  walletAddress: string,
  contractAddress: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanWallet = walletAddress.trim();
    const cleanContract = contractAddress.replace(/^0x/, '').trim();

    // First try a plain UPDATE (fast path for existing users)
    const { data: updated, error: updateErr } = await supabase
      .from('users')
      .update({ contract_address: cleanContract, last_active: new Date().toISOString() })
      .or(`wallet_address.eq.${cleanWallet},id.eq.${cleanWallet}`)
      .select('id');

    if (updateErr) {
      console.error('Supabase updateUserContractAddress update error:', updateErr);
      return { success: false, error: updateErr.message };
    }

    // If no row was matched (user deployed BEFORE completing profile), upsert to create the row
    if (!updated || updated.length === 0) {
      console.warn(`updateUserContractAddress: no row for wallet ${cleanWallet.slice(0, 20)}... — upserting`);
      const fallbackEmail = `${cleanWallet.slice(0, 14)}_${cleanWallet.slice(-6)}@midnight.network`;
      const { error: upsertErr } = await supabase
        .from('users')
        .upsert({
          id: cleanWallet,
          wallet_address: cleanWallet,
          contract_address: cleanContract,
          name: `Operator ${cleanWallet.slice(-4)}`,
          email: fallbackEmail,
          auth_type: 'wallet',
          profile_completed: false,
          last_active: new Date().toISOString()
        }, { onConflict: 'wallet_address' });

      if (upsertErr) {
        console.error('Supabase updateUserContractAddress upsert error:', upsertErr);
        return { success: false, error: upsertErr.message };
      }
    }

    return { success: true };
  } catch (e: any) {
    console.error('updateUserContractAddress unexpected error:', e);
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
  try {
    const cleanHash = txData.txHash ? txData.txHash.replace(/^0x/, '').trim() : `${Date.now()}`;
    const txId = txData.id || (cleanHash.length >= 64 ? `tx_${cleanHash}` : `tx_${cleanHash}_${Date.now()}`);
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
      contract_address: txData.contractAddress ? txData.contractAddress.replace(/^0x/, '').trim() : null,
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
