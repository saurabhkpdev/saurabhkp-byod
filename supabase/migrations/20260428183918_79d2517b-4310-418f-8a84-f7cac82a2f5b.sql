-- Restrict quality_rule_sets management to admins only (was: any owner)
DROP POLICY IF EXISTS "Authenticated can create own rule sets" ON public.quality_rule_sets;
DROP POLICY IF EXISTS "Owner or admin can update rule sets" ON public.quality_rule_sets;
DROP POLICY IF EXISTS "Owner or admin can delete rule sets" ON public.quality_rule_sets;
DROP POLICY IF EXISTS "View own, admin, or global rule sets" ON public.quality_rule_sets;

CREATE POLICY "All authenticated can view rule sets"
  ON public.quality_rule_sets FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can create rule sets"
  ON public.quality_rule_sets FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) AND owner_id = auth.uid());

CREATE POLICY "Admins can update rule sets"
  ON public.quality_rule_sets FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete rule sets"
  ON public.quality_rule_sets FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- Many-to-many: templates <-> quality rule sets
CREATE TABLE public.template_quality_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.custom_templates(id) ON DELETE CASCADE,
  rule_set_id uuid NOT NULL REFERENCES public.quality_rule_sets(id) ON DELETE CASCADE,
  attached_by uuid NOT NULL,
  attached_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, rule_set_id)
);

ALTER TABLE public.template_quality_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View template rule attachments"
  ON public.template_quality_rules FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can attach rules to templates"
  ON public.template_quality_rules FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) AND attached_by = auth.uid());

CREATE POLICY "Admins can detach rules from templates"
  ON public.template_quality_rules FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- Many-to-many: datasets (by name) <-> quality rule sets
-- Use dataset_name (string) so attachments persist across versions
CREATE TABLE public.dataset_quality_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_name text NOT NULL,
  rule_set_id uuid NOT NULL REFERENCES public.quality_rule_sets(id) ON DELETE CASCADE,
  attached_by uuid NOT NULL,
  attached_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (dataset_name, rule_set_id)
);

ALTER TABLE public.dataset_quality_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View dataset rule attachments"
  ON public.dataset_quality_rules FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can attach rules to datasets"
  ON public.dataset_quality_rules FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) AND attached_by = auth.uid());

CREATE POLICY "Admins can detach rules from datasets"
  ON public.dataset_quality_rules FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE INDEX idx_tqr_template ON public.template_quality_rules(template_id);
CREATE INDEX idx_tqr_rule ON public.template_quality_rules(rule_set_id);
CREATE INDEX idx_dqr_dataset ON public.dataset_quality_rules(dataset_name);
CREATE INDEX idx_dqr_rule ON public.dataset_quality_rules(rule_set_id);