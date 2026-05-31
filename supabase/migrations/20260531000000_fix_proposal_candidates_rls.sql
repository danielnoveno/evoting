-- Fix RLS policy for proposal_candidates to allow deletion by the owner or an admin
DROP POLICY IF EXISTS "proposal_candidates_manage_parent_owner_or_admin" ON app.proposal_candidates;

CREATE POLICY "proposal_candidates_manage_parent_owner_or_admin"
ON app.proposal_candidates
FOR ALL
USING (
  EXISTS (
    SELECT 1
    from app.proposal_drafts d
    where d.id = proposal_draft_id
      and (
        d.created_by = app.current_profile_id()
        OR app.has_role(ARRAY['admin'::app.app_role, 'super_admin'::app.app_role])
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    from app.proposal_drafts d
    where d.id = proposal_draft_id
      and (
        d.created_by = app.current_profile_id()
        OR app.has_role(ARRAY['admin'::app.app_role, 'super_admin'::app.app_role])
      )
  )
);
