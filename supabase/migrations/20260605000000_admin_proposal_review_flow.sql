-- Align admin proposal review flow with superadmin-paid deployment.

alter type app.proposal_status add value if not exists 'revision_requested';

drop policy if exists "space_registry_map_insert_superadmin" on app.space_registry_map;
drop policy if exists "space_registry_map_update_superadmin" on app.space_registry_map;

create policy "space_registry_map_insert_superadmin"
on app.space_registry_map
for insert
with check (app.has_role(array['super_admin'::app.app_role]));

create policy "space_registry_map_update_superadmin"
on app.space_registry_map
for update
using (app.has_role(array['super_admin'::app.app_role]))
with check (app.has_role(array['super_admin'::app.app_role]));
