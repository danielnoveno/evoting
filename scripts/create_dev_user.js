const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cuxoheyjxjeeqpxtfssb.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eG9oZXlqeGplZXFweHRmc3NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNDg3NTMsImV4cCI6MjA5NDkyNDc1M30.bezV_0XuAk81t0ETaeaIFqTV4bnxmR8LV1HPGMkNiVc';
const targetEmail = '220711663@students.uajy.ac.id';
const targetPassword = 'PasswordBaru123!';

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
    user_metadata: { full_name: 'Developer Admin' }
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
      display_name: 'Dev Super Admin',
      role: 'super_admin',
      role_hint: 'Developer God Mode'
    });

  if (profileError) {
    console.error('Error creating profile:', profileError.message);
  } else {
    console.log('Profile setup complete!');
  }

  console.log('--- ALL DONE ---');
  console.log('Email:', targetEmail);
  console.log('Password:', targetPassword);
}

createDevUser();
