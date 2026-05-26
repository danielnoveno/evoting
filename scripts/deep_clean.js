const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cuxoheyjxjeeqpxtfssb.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eG9oZXlqeGplZXFweHRmc3NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNDg3NTMsImV4cCI6MjA5NDkyNDc1M30.bezV_0XuAk81t0ETaeaIFqTV4bnxmR8LV1HPGMkNiVc';
const targetEmail = '220711663@students.uajy.ac.id';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function deepClean() {
  console.log('--- DEEP CLEAN INITIATED ---');
  
  // 1. Delete from app_profiles if exists
  const { error: profileError } = await supabase
    .schema('app')
    .from('app_profiles')
    .delete()
    .eq('email', targetEmail);
    
  if (profileError) console.log('Profile delete error (ignore if empty):', profileError.message);
  else console.log('Profile ghost records cleared.');

  // 2. Try to invite user and then delete them (this often clears "half-baked" Auth states)
  console.log('Attempting to force-clear Auth state...');
  const { data: invite, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(targetEmail);
  
  if (!inviteError && invite.user) {
    console.log('Ghost Auth detected and refreshed. Deleting now...');
    await supabase.auth.admin.deleteUser(invite.user.id);
    console.log('Ghost Auth purged.');
  } else {
    console.log('No Auth ghost found or invite failed (likely clean).');
  }

  console.log('--- CLEAN UP FINISHED ---');
}

deepClean();
