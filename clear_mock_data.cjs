const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xdovsqzuedezkigyvxbv.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkb3ZzcXp1ZWRlemtpZ3l2eGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3Mzg4MTEsImV4cCI6MjEwMDMxNDgxMX0.rI2F37gh_jvxe7Mcn-9_MSD-H9p_4wyJh6DN_RQnbCU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearData() {
  console.log('Clearing mock data from Supabase...');
  
  // Clear audit events
  const { error: err1 } = await supabase.from('audit_events').delete().neq('id', 'mock');
  console.log('Cleared audit events', err1 || 'success');
  
  // Clear approvals
  const { error: err2 } = await supabase.from('approvals').delete().neq('id', 'mock');
  console.log('Cleared approvals', err2 || 'success');
  
  // Clear agents
  const { error: err3 } = await supabase.from('agents').delete().neq('id', 'mock');
  console.log('Cleared agents', err3 || 'success');
  
  // Clear policies
  const { error: err4 } = await supabase.from('policies').delete().neq('id', 'mock');
  console.log('Cleared policies', err4 || 'success');

  console.log('Done clearing all mock data!');
}

clearData();
