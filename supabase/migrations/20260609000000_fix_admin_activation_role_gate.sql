-- Fix admin activation role gate.
-- Pending admin/superadmin invitations must not grant application roles before
-- the activation link has been accepted.

create or replace function app.role_for_email(input_email text)
returns app.app_role
language sql
stable
security definer
set search_path = app
as $$
  select coalesce((
    select assigned_role
    from app.admin_registry
    where lower(email) = lower(coalesce(input_email, ''))
      and (
        (assigned_role = 'voter'::app.app_role and status in ('pending', 'active'))
        or (assigned_role = 'admin'::app.app_role and status = 'active')
        or (assigned_role = 'super_admin'::app.app_role and status = 'active')
      )
      and assigned_role in ('voter'::app.app_role, 'admin'::app.app_role, 'super_admin'::app.app_role)
    limit 1
  ), 'voter'::app.app_role);
$$;
