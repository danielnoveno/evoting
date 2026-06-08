-- WARNING: DESTRUCTIVE SCRIPT
-- This script drops all custom tables, types, functions, and policies.
-- Run this manually only when you intend to reset the database, then apply the
-- consolidated migration afterward. Do not place this file in migrations/.

-- Drop all tables in schema 'app' and 'indexer'
DROP TABLE IF EXISTS app.admin_space_access CASCADE;
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
DROP FUNCTION IF EXISTS app.on_profile_activation_notify() CASCADE;

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
