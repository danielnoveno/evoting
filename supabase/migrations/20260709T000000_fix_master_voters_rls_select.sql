-- Migration: Fix master_voters RLS SELECT policy
-- Problem: Any authenticated user (including voters) can read ALL master voter records
--          (NIM, email, full_name, prodi, fakultas, wallet_address).
-- Fix: Restrict SELECT to admin and super_admin only.

-- Drop the overly permissive policy
drop policy if exists "master_voters_select_auth" on app.master_voters;

-- Replace with admin-only SELECT
create policy "master_voters_select_admin"
on app.master_voters
for select
using (
  app.has_role(array['admin'::app.app_role, 'super_admin'::app.app_role])
);
