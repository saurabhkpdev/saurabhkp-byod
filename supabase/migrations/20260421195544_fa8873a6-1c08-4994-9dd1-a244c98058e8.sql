ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_login_ip TEXT,
  ADD COLUMN IF NOT EXISTS last_login_user_agent TEXT;