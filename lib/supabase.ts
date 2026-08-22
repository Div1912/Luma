import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : {
      from: () => ({
        select: () => ({ order: () => Promise.resolve({ data: null }) }),
        insert: () => Promise.resolve({ error: null }),
        update: () => ({ eq: () => Promise.resolve({ error: null }) }),
        delete: () => ({ eq: () => Promise.resolve({ error: null }) })
      })
    } as any;

export async function fetchOnChainStateFromSupabase() {
  if (!supabaseUrl) return null;
  try {
    const { data: auditEvents } = await supabase.from('audit_events').select('*').order('timestamp', { ascending: false });
    const { data: policies } = await supabase.from('policies').select('*');
    const { data: agents } = await supabase.from('agents').select('*');
    const { data: approvals } = await supabase.from('approvals').select('*');
    return { auditEvents, policies, agents, approvals };
  } catch (e) {
    console.error('Supabase fetch error:', e);
    return null;
  }
}
