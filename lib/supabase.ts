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

export async function fetchOnChainStateFromSupabase() {
  if (supabaseUrl === 'https://mock.supabase.co') return null;
  try {
    const { data: auditEvents } = await supabase.from('audit_events').select('*').order('timestamp', { ascending: false });
    const { data: policies } = await supabase.from('policies').select('*');
    const { data: agents } = await supabase.from('agents').select('*');
    const { data: fleets } = await supabase.from('fleets').select('*');
    const { data: approvals } = await supabase.from('approvals').select('*');
    return { auditEvents, policies, agents, fleets, approvals };
  } catch (e) {
    console.error('Supabase fetch error:', e);
    return null;
  }
}
