
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  added_by UUID NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

CREATE INDEX idx_group_members_user ON public.group_members(user_id);
CREATE INDEX idx_group_members_group ON public.group_members(group_id);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- groups policies
CREATE POLICY "Authenticated users can view groups"
  ON public.groups FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Role/Super admins can insert groups"
  ON public.groups FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'role_admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Role/Super admins can update groups"
  ON public.groups FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'role_admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Role/Super admins can delete groups"
  ON public.groups FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'role_admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- group_members policies
CREATE POLICY "Authenticated users can view group members"
  ON public.group_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Role/Super admins can insert group members"
  ON public.group_members FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'role_admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Role/Super admins can delete group members"
  ON public.group_members FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'role_admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- updated_at trigger for groups
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
