ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS theme text,
  ADD COLUMN IF NOT EXISTS color_palette jsonb;