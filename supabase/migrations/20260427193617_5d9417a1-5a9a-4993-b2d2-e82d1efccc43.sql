-- Helper: is user a member of a group? (SECURITY DEFINER avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.user_in_group(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE user_id = _user_id AND group_id = _group_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('sys_admin','role_admin','super_admin')
  );
$$;

CREATE TABLE public.custom_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'general' CHECK (category IN ('general','geographical')),
  required_columns text[] NOT NULL DEFAULT '{}',
  optional_columns text[] NOT NULL DEFAULT '{}',
  sample_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  client_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, client_id)
);

ALTER TABLE public.custom_templates ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER custom_templates_set_updated_at
BEFORE UPDATE ON public.custom_templates
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.template_group_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.custom_templates(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  shared_by uuid NOT NULL,
  shared_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, group_id)
);

ALTER TABLE public.template_group_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner, admin, or shared-group members can view templates"
ON public.custom_templates FOR SELECT TO authenticated
USING (
  owner_id = auth.uid()
  OR public.is_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.template_group_shares s
    WHERE s.template_id = custom_templates.id
      AND public.user_in_group(auth.uid(), s.group_id)
  )
);

CREATE POLICY "Authenticated can create their own templates"
ON public.custom_templates FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owner or admin can update templates"
ON public.custom_templates FOR UPDATE TO authenticated
USING (owner_id = auth.uid() OR public.is_admin(auth.uid()))
WITH CHECK (owner_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Owner or admin can delete templates"
ON public.custom_templates FOR DELETE TO authenticated
USING (owner_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "View shares for visible templates"
ON public.template_group_shares FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.custom_templates t
    WHERE t.id = template_group_shares.template_id
      AND (
        t.owner_id = auth.uid()
        OR public.is_admin(auth.uid())
        OR public.user_in_group(auth.uid(), template_group_shares.group_id)
      )
  )
);

CREATE POLICY "Owner or admin can add shares"
ON public.template_group_shares FOR INSERT TO authenticated
WITH CHECK (
  shared_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.custom_templates t
    WHERE t.id = template_group_shares.template_id
      AND (t.owner_id = auth.uid() OR public.is_admin(auth.uid()))
  )
);

CREATE POLICY "Owner or admin can remove shares"
ON public.template_group_shares FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.custom_templates t
    WHERE t.id = template_group_shares.template_id
      AND (t.owner_id = auth.uid() OR public.is_admin(auth.uid()))
  )
);

CREATE TABLE public.system_template_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system_template_id text NOT NULL UNIQUE,
  name text,
  description text,
  category text CHECK (category IN ('general','geographical')),
  required_columns text[],
  optional_columns text[],
  sample_data jsonb,
  updated_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.system_template_overrides ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER system_template_overrides_set_updated_at
BEFORE UPDATE ON public.system_template_overrides
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "All authenticated can read system overrides"
ON public.system_template_overrides FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins manage system overrides"
ON public.system_template_overrides FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.dataset_group_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_version_id uuid NOT NULL REFERENCES public.data_versions(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  shared_by uuid NOT NULL,
  shared_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (dataset_version_id, group_id)
);

ALTER TABLE public.dataset_group_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View dataset shares for accessible datasets"
ON public.dataset_group_shares FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.data_versions v
    WHERE v.id = dataset_group_shares.dataset_version_id
      AND (
        v.user_id = auth.uid()
        OR public.is_admin(auth.uid())
        OR public.user_in_group(auth.uid(), dataset_group_shares.group_id)
      )
  )
);

CREATE POLICY "Owner or admin can add dataset shares"
ON public.dataset_group_shares FOR INSERT TO authenticated
WITH CHECK (
  shared_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.data_versions v
    WHERE v.id = dataset_group_shares.dataset_version_id
      AND (v.user_id = auth.uid() OR public.is_admin(auth.uid()))
  )
);

CREATE POLICY "Owner or admin can remove dataset shares"
ON public.dataset_group_shares FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.data_versions v
    WHERE v.id = dataset_group_shares.dataset_version_id
      AND (v.user_id = auth.uid() OR public.is_admin(auth.uid()))
  )
);

CREATE POLICY "Admins or shared-group members can view data_versions"
ON public.data_versions FOR SELECT TO authenticated
USING (
  public.is_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.dataset_group_shares s
    WHERE s.dataset_version_id = data_versions.id
      AND public.user_in_group(auth.uid(), s.group_id)
  )
);

CREATE INDEX IF NOT EXISTS idx_custom_templates_owner ON public.custom_templates(owner_id);
CREATE INDEX IF NOT EXISTS idx_template_group_shares_template ON public.template_group_shares(template_id);
CREATE INDEX IF NOT EXISTS idx_template_group_shares_group ON public.template_group_shares(group_id);
CREATE INDEX IF NOT EXISTS idx_dataset_group_shares_dataset ON public.dataset_group_shares(dataset_version_id);
CREATE INDEX IF NOT EXISTS idx_dataset_group_shares_group ON public.dataset_group_shares(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members(group_id);