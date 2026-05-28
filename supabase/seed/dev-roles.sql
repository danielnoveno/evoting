-- Developer Roles Seed
-- This file contains initial role assignments for development accounts.

-- Register Superadmin
insert into app.admin_registry (
    email,
    assigned_role,
    display_name,
    status,
    access_scope
) values (
    'dnw022003@gmail.com',
    'super_admin',
    'Main Developer',
    'active',
    'all'
) on conflict (email) do update set
    assigned_role = 'super_admin',
    status = 'active';

-- Register Campus Admin
insert into app.admin_registry (
    email,
    assigned_role,
    display_name,
    status,
    access_scope,
    organization_name
) values (
    'novenoow@gmail.com',
    'admin',
    'FTI Admin',
    'active',
    'all',
    'FTI UAJY'
) on conflict (email) do update set
    assigned_role = 'admin',
    status = 'active';

-- Ensure profile roles are correct if they already exist
update app.app_profiles set role = 'super_admin' where email = 'dnw022003@gmail.com';
update app.app_profiles set role = 'admin' where email = 'novenoow@gmail.com';
update app.app_profiles set role = 'voter' where email = '220711663@students.uajy.ac.id';
