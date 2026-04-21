-- 1. Migrate existing admins -> sys_admin
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'sys_admin'::app_role
FROM public.user_roles
WHERE role = 'admin'
ON CONFLICT (user_id, role) DO NOTHING;

-- Remove the old admin role from those users
DELETE FROM public.user_roles WHERE role = 'admin';

-- 2. Update get_user_roles helper (no admin reference needed, but refresh to be safe)
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS app_role[]
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF _user_id != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('sys_admin','role_admin')
  ) THEN
    RETURN ARRAY['user']::app_role[];
  END IF;

  RETURN COALESCE(
    (SELECT array_agg(role) FROM public.user_roles WHERE user_id = _user_id),
    ARRAY['user']::app_role[]
  );
END;
$function$;

-- 3. Update has_role to allow either sys_admin or role_admin to inspect others
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF _user_id != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('sys_admin','role_admin')
  ) THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$function$;

-- 4. Update RLS policies on user_roles - only role_admin manages
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Role admins can delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'role_admin'));

CREATE POLICY "Role admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'role_admin'));

CREATE POLICY "Role admins can update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'role_admin'));

CREATE POLICY "Users can view own roles or role admins all" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'role_admin'));

-- 5. Update profile SELECT policy - role_admin can view all profiles for user mgmt
DROP POLICY IF EXISTS "Users can view own profile, admins all" ON public.profiles;

CREATE POLICY "Users can view own profile, role admins all" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'role_admin'));