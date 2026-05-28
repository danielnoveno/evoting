-- Migration: Ensure Schema Permissions
-- Description: Grants usage on 'app' schema to necessary roles.

grant usage on schema app to anon, authenticated, service_role;
grant usage on schema indexer to anon, authenticated, service_role;

grant all privileges on all tables in schema app to service_role;
grant all privileges on all sequences in schema app to service_role;
grant all privileges on all functions in schema app to service_role;

grant usage on all sequences in schema app to authenticated;
grant execute on all functions in schema app to authenticated;

grant usage on all sequences in schema app to anon;
grant execute on all functions in schema app to anon;
