import { createClient } from '@supabase/supabase-js';

// Load env vars (hard‑coded for demo – normally use process.env)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cuxoheyjxjeeqpxtfssb.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eG9oZXlqeGplZXFweHRmc3NiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTM0ODc1MywiZXhwIjoyMDk0OTI0NzUzfQ.Vkehfsp8NLVwxAcwuzPzqwBUEx_J_FJNAKSJusoP1Fc';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  // Use fetch API (no realtime needed)
  auth: { persistSession: false },
});

async function run() {
  console.log('--- SELECT existing profiles (should be empty) ---');
  let { data: select1, error: err1 } = await supabase
    .from('app_profiles')
    .select('*');
  console.log('select error:', err1);
  console.log('data:', select1);

  console.log('\n--- INSERT a test profile ---');
  const testProfile = {
    user_id: '11111111-1111-1111-1111-111111111111', // dummy auth uid
    wallet_address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    display_name: 'Test User',
    email: 'test@example.com',
    role: 'voter',
  };
  let { data: insert, error: errInsert } = await supabase
    .from('app_profiles')
    .insert(testProfile)
    .single();
  console.log('insert error:', errInsert);
  console.log('inserted:', insert);

  console.log('\n--- SELECT after insert ---');
  let { data: afterInsert, error: errAfter } = await supabase
    .from('app_profiles')
    .select('*')
    .eq('wallet_address', testProfile.wallet_address);
  console.log('select after insert error:', errAfter);
  console.log('data:', afterInsert);

  if (afterInsert && afterInsert.length > 0) {
    const id = afterInsert[0].id;
    console.log('\n--- UPDATE the display_name ---');
    const { data: upd, error: errUpd } = await supabase
      .from('app_profiles')
      .update({ display_name: 'Updated User' })
      .eq('id', id)
      .single();
    console.log('update error:', errUpd);
    console.log('updated row:', upd);

    console.log('\n--- DELETE the profile ---');
    const { data: del, error: errDel } = await supabase
      .from('app_profiles')
      .delete()
      .eq('id', id)
      .single();
    console.log('delete error:', errDel);
    console.log('deleted row:', del);
  }
}

run().catch((e) => console.error('Unexpected error', e));
