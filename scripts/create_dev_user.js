const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const targetEmail = process.env.DEV_USER_EMAIL;
const targetPassword = process.env.DEV_USER_PASSWORD;
const targetWallet = process.env.DEV_USER_WALLET;

if (!supabaseUrl || !supabaseServiceKey || !targetEmail || !targetPassword || !targetWallet) {
  throw new Error('Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEV_USER_EMAIL, DEV_USER_PASSWORD, dan DEV_USER_WALLET sebelum menjalankan script.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createDevUser() {
  console.log('--- SYSTEM RESET INITIATED ---');

  // 1. Delete existing just in case
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const existing = users.find(u => u.email === targetEmail);
  if (existing) {
    console.log('Old user found, purging...');
    await supabase.auth.admin.deleteUser(existing.id);
  }

  // 2. Create user properly via Admin API
  console.log('Creating official auth user...');
  const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
    email: targetEmail,
    password: targetPassword,
    email_confirm: true,
    user_metadata: { full_name: process.env.DEV_USER_DISPLAY_NAME ?? 'Development User' }
  });

  if (createError) {
    console.error('Error creating user:', createError.message);
    return;
  }

  console.log('User created with ID:', user.id);

  // 3. Create profile with super_admin role
  console.log('Setting up profile with Super Admin privileges...');
  const { error: profileError } = await supabase
    .schema('app')
    .from('app_profiles')
    .insert({
      user_id: user.id,
      email: targetEmail,
      wallet_address: targetWallet,
      display_name: process.env.DEV_USER_DISPLAY_NAME ?? 'Development User',
      role: process.env.DEV_USER_ROLE ?? 'super_admin',
      role_hint: 'Development environment'
    });

  if (profileError) {
    console.error('Error creating profile:', profileError.message);
  } else {
    console.log('Profile setup complete!');
  }

  console.log('--- ALL DONE ---');
  console.log('Email:', targetEmail);
}

createDevUser();
