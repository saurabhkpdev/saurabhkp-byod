
-- Drop the overly permissive policy
DROP POLICY "Users can view all profiles" ON public.profiles;

-- Users can view their own profile; admins can view all
CREATE POLICY "Users can view own profile, admins all"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
