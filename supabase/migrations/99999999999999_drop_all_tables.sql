-- WARNING: DESTRUCTIVE SCRIPT
-- This script drops all custom tables, types, functions, and policies.
-- Run this only if you intend to reset your database and run a consolidated migration file afterward.

-- Drop all RLS policies from tables
DROP POLICY IF EXISTS "profiles_select_self_or_admin" ON app.app_profiles;
DROP POLICY IF EXISTS "profiles_insert_self" ON app.app_profiles;
DROP POLICY IF EXISTS "profiles_update_self_or_admin" ON app.app_profiles;
DROP POLICY IF EXISTS "profiles_update_self_or_superadmin" ON app.app_profiles;
DROP POLICY IF EXISTS "proposal_drafts_select_owner_or_admin" ON app.proposal_drafts;
DROP POLICY IF EXISTS "proposal_drafts_insert_admin" ON app.proposal_drafts;
DROP POLICY IF EXISTS "proposal_drafts_update_owner_or_admin" ON app.proposal_drafts;
DROP POLICY IF EXISTS "proposal_candidates_manage_parent_owner_or_admin" ON app.proposal_candidates;
DROP POLICY IF EXISTS "whitelist_jobs_manage_parent_owner_or_admin" ON app.whitelist_import_jobs;
DROP POLICY IF EXISTS "whitelist_entries_manage_parent_owner_or_admin" ON app.proposal_whitelist_entries;
DROP POLICY IF EXISTS "metadata_versions_select_owner_or_admin" ON app.space_metadata_versions;
DROP POLICY IF EXISTS "metadata_versions_insert_admin" ON app.space_metadata_versions;
DROP POLICY IF EXISTS "space_registry_map_select_owner_or_admin" ON app.space_registry_map;
DROP POLICY IF EXISTS "tx_audit_log_select_owner_or_admin" ON app.tx_audit_log;
DROP POLICY IF EXISTS "tx_audit_log_insert_owner_or_admin" ON app.tx_audit_log;
DROP POLICY IF EXISTS "proof_exports_select_owner_or_admin" ON app.proof_exports;
DROP POLICY IF EXISTS "proof_exports_insert_owner_or_admin" ON app.proof_exports;
DROP POLICY IF EXISTS "ops_audit_log_select_admin_only" ON app.ops_audit_log;
DROP POLICY IF EXISTS "notification_jobs_select_target_or_admin" ON app.notification_jobs;
DROP POLICY IF EXISTS "indexer_sync_status_select_authenticated" ON indexer.indexer_sync_status;
DROP POLICY IF EXISTS "admin_registry_select_self_or_superadmin" ON app.admin_registry;
DROP POLICY IF EXISTS "admin_registry_insert_superadmin" ON app.admin_registry;
DROP POLICY IF EXISTS "admin_registry_update_superadmin" ON app.admin_registry;
DROP POLICY IF EXISTS "admin_registry_delete_superadmin" ON app.admin_registry;
DROP POLICY IF EXISTS "super_admin_all_risk_alerts" ON app.risk_alerts;
DROP POLICY IF EXISTS "super_admin_all_blocked_entities" ON app.blocked_entities;
DROP POLICY IF EXISTS "platform_settings_select_all" ON app.platform_settings;
DROP POLICY IF EXISTS "platform_settings_manage_superadmin" ON app.platform_settings;

-- Drop all tables in schema 'app' and 'indexer'
DROP TABLE IF EXISTS app.platform_settings CASCADE;
DROP TABLE IF EXISTS app.proposal_candidates CASCADE;
DROP TABLE IF EXISTS app.proposal_whitelist_entries CASCADE;
DROP TABLE IF EXISTS app.whitelist_import_jobs CASCADE;
DROP TABLE IF EXISTS app.space_metadata_versions CASCADE;
DROP TABLE IF EXISTS app.space_registry_map CASCADE;
DROP TABLE IF EXISTS app.tx_audit_log CASCADE;
DROP TABLE IF EXISTS app.proof_exports CASCADE;
DROP TABLE IF EXISTS app.ops_audit_log CASCADE;
DROP TABLE IF EXISTS app.notification_jobs CASCADE;
DROP TABLE IF EXISTS app.admin_registry CASCADE;
DROP TABLE IF EXISTS app.risk_alerts CASCADE;
DROP TABLE IF EXISTS app.blocked_entities CASCADE;
DROP TABLE IF EXISTS app.proposal_drafts CASCADE;
DROP TABLE IF EXISTS app.app_profiles CASCADE;
DROP TABLE IF EXISTS indexer.indexer_sync_status CASCADE;

-- Drop all functions in schema 'app'
DROP FUNCTION IF EXISTS app.set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS app.current_profile_id() CASCADE;
DROP FUNCTION IF EXISTS app.current_user_role() CASCADE;
DROP FUNCTION IF EXISTS app.has_role(app.app_role[]) CASCADE;
DROP FUNCTION IF EXISTS app.role_for_email(text) CASCADE;

-- Drop all custom types in schema 'app' and 'indexer'
DROP TYPE IF EXISTS app.app_role;
DROP TYPE IF EXISTS app.proposal_status;
DROP TYPE IF EXISTS app.whitelist_source;
DROP TYPE IF EXISTS app.validation_status;
DROP TYPE IF EXISTS app.tx_action_type;
DROP TYPE IF EXISTS app.proof_type;
DROP TYPE IF EXISTS app.notification_channel;
DROP TYPE IF EXISTS app.notification_status;
DROP TYPE IF EXISTS app.risk_tone;
DROP TYPE IF EXISTS app.risk_status;
DROP TYPE IF EXISTS indexer.sync_health_status;

-- Confirmation message
SELECT 'Successfully dropped all specified tables, types, and functions.' as status;
