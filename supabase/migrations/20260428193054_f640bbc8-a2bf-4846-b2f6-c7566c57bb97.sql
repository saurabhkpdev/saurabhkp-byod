
-- Helper function: check if a rule set is visible to a user via attachments
-- Uses SECURITY DEFINER to bypass RLS on referenced tables, avoiding recursion.
CREATE OR REPLACE FUNCTION public.user_can_see_rule_set(_user_id uuid, _rule_set_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- Attached to a template the user owns or is shared with via group
    EXISTS (
      SELECT 1
      FROM public.template_quality_rules tqr
      JOIN public.custom_templates t ON t.id = tqr.template_id
      WHERE tqr.rule_set_id = _rule_set_id
        AND (
          t.owner_id = _user_id
          OR EXISTS (
            SELECT 1 FROM public.template_group_shares s
            JOIN public.group_members gm ON gm.group_id = s.group_id
            WHERE s.template_id = t.id AND gm.user_id = _user_id
          )
        )
    )
    OR
    -- Attached to a dataset the user owns or has shared access to
    EXISTS (
      SELECT 1
      FROM public.dataset_quality_rules dqr
      JOIN public.data_versions v ON v.dataset_name = dqr.dataset_name
      WHERE dqr.rule_set_id = _rule_set_id
        AND (
          v.user_id = _user_id
          OR EXISTS (
            SELECT 1 FROM public.dataset_group_shares s
            JOIN public.group_members gm ON gm.group_id = s.group_id
            WHERE s.dataset_version_id = v.id AND gm.user_id = _user_id
          )
        )
    );
$$;

-- Replace the recursive SELECT policy
DROP POLICY IF EXISTS "Visible via attachments, ownership, or admin" ON public.quality_rule_sets;

CREATE POLICY "Visible via attachments, ownership, or admin"
ON public.quality_rule_sets
FOR SELECT
TO authenticated
USING (
  is_admin(auth.uid())
  OR owner_id = auth.uid()
  OR public.user_can_see_rule_set(auth.uid(), id)
);
