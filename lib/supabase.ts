import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xdovsqzuedezkigyvxbv.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkb3ZzcXp1ZWRlemtpZ3l2eGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3Mzg4MTEsImV4cCI6MjEwMDMxNDgxMX0.rI2F37gh_jvxe7Mcn-9_MSD-H9p_4wyJh6DN_RQnbCU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function fetchOnChainStateFromSupabase() {
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
