-- Tighten visibility of quality_rule_sets and the attachment join tables
-- so that rule sets follow the visibility of the templates/datasets they
-- are attached to (plus admins and owners).

-- ---- quality_rule_sets ----
DROP POLICY IF EXISTS "All authenticated can view rule sets" ON public.quality_rule_sets;

CREATE POLICY "Visible via attachments, ownership, or admin"
ON public.quality_rule_sets
FOR SELECT
TO authenticated
USING (
  is_admin(auth.uid())
  OR owner_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.template_quality_rules tqr
    JOIN public.custom_templates t ON t.id = tqr.template_id
    WHERE tqr.rule_set_id = quality_rule_sets.id
      AND (
        t.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.template_group_shares s
          WHERE s.template_id = t.id
            AND user_in_group(auth.uid(), s.group_id)
        )
      )
  )
  OR EXISTS (
    SELECT 1
    FROM public.dataset_quality_rules dqr
    JOIN public.data_versions v ON v.dataset_name = dqr.dataset_name
    WHERE dqr.rule_set_id = quality_rule_sets.id
      AND (
        v.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.dataset_group_shares s
          WHERE s.dataset_version_id = v.id
            AND user_in_group(auth.uid(), s.group_id)
        )
      )
  )
);

-- ---- template_quality_rules ----
DROP POLICY IF EXISTS "View template rule attachments" ON public.template_quality_rules;

CREATE POLICY "View template rule attachments via template visibility"
ON public.template_quality_rules
FOR SELECT
TO authenticated
USING (
  is_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.custom_templates t
    WHERE t.id = template_quality_rules.template_id
      AND (
        t.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.template_group_shares s
          WHERE s.template_id = t.id
            AND user_in_group(auth.uid(), s.group_id)
        )
      )
  )
);

-- ---- dataset_quality_rules ----
DROP POLICY IF EXISTS "View dataset rule attachments" ON public.dataset_quality_rules;

CREATE POLICY "View dataset rule attachments via dataset visibility"
ON public.dataset_quality_rules
FOR SELECT
TO authenticated
USING (
  is_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.data_versions v
    WHERE v.dataset_name = dataset_quality_rules.dataset_name
      AND (
        v.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.dataset_group_shares s
          WHERE s.dataset_version_id = v.id
            AND user_in_group(auth.uid(), s.group_id)
        )
      )
  )
);
