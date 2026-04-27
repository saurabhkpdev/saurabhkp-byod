
CREATE TABLE public.quality_rule_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  scope text NOT NULL CHECK (scope IN ('template','dataset','global')),
  scope_key text,
  rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  owner_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_quality_rule_sets_scope ON public.quality_rule_sets(scope, scope_key);
CREATE INDEX idx_quality_rule_sets_owner ON public.quality_rule_sets(owner_id);

ALTER TABLE public.quality_rule_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own, admin, or global rule sets"
  ON public.quality_rule_sets FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid() OR public.is_admin(auth.uid()) OR scope = 'global');

CREATE POLICY "Authenticated can create own rule sets"
  ON public.quality_rule_sets FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owner or admin can update rule sets"
  ON public.quality_rule_sets FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (owner_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Owner or admin can delete rule sets"
  ON public.quality_rule_sets FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE TRIGGER quality_rule_sets_updated_at
  BEFORE UPDATE ON public.quality_rule_sets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
