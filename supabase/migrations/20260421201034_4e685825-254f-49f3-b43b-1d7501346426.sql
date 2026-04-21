-- Update get_user_roles helper
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS app_role[]
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF _user_id != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('sys_admin','role_admin','super_admin')
  ) THEN
    RETURN ARRAY['user']::app_role[];
  END IF;

  RETURN COALESCE(
    (SELECT array_agg(role) FROM public.user_roles WHERE user_id = _user_id),
    ARRAY['user']::app_role[]
  );
END;
$function$;

-- Update has_role helper
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF _user_id != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('sys_admin','role_admin','super_admin')
  ) THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$function$;

-- user_roles: super_admin OR role_admin can manage
DROP POLICY IF EXISTS "Role admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Role admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Role admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles or role admins all" ON public.user_roles;

CREATE POLICY "Role admins or super admins can delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'role_admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Role admins or super admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'role_admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Role admins or super admins can update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'role_admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users view own roles, role/super admins all" ON public.user_roles
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'role_admin')
    OR public.has_role(auth.uid(), 'super_admin')
  );

-- profiles: super_admin OR role_admin can view all
DROP POLICY IF EXISTS "Users can view own profile, role admins all" ON public.profiles;

CREATE POLICY "Users view own profile, role/super admins all" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR public.has_role(auth.uid(), 'role_admin')
    OR public.has_role(auth.uid(), 'super_admin')
  );

-- template_load_configs: super_admin OR sys_admin can manage
DROP POLICY IF EXISTS "Sys admins can manage load configs" ON public.template_load_configs;

CREATE POLICY "Sys or super admins can manage load configs" ON public.template_load_configs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'sys_admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'sys_admin') OR public.has_role(auth.uid(), 'super_admin'));