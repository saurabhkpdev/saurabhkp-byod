DROP POLICY IF EXISTS "Admins can manage load configs" ON public.template_load_configs;

CREATE POLICY "Sys admins can manage load configs" ON public.template_load_configs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'sys_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'sys_admin'));