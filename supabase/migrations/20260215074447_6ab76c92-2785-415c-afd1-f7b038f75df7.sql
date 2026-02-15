
-- Create enum for load strategies
CREATE TYPE public.load_strategy AS ENUM ('truncate_load', 'merge_upsert', 'append_only');

-- Create table for template load configurations
CREATE TABLE public.template_load_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id TEXT NOT NULL,
  template_name TEXT NOT NULL,
  load_strategy load_strategy NOT NULL DEFAULT 'append_only',
  primary_key_columns TEXT[] NOT NULL DEFAULT '{}',
  validation_rules JSONB NOT NULL DEFAULT '[]',
  auto_version BOOLEAN NOT NULL DEFAULT true,
  allow_user_override BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(template_id)
);

-- Enable RLS
ALTER TABLE public.template_load_configs ENABLE ROW LEVEL SECURITY;

-- Admins can manage load configs
CREATE POLICY "Admins can manage load configs"
ON public.template_load_configs
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- All authenticated users can read load configs
CREATE POLICY "Users can read load configs"
ON public.template_load_configs
FOR SELECT
TO authenticated
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_template_load_configs_updated_at
BEFORE UPDATE ON public.template_load_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
