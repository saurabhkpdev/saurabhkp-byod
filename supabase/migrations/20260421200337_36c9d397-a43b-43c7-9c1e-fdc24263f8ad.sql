-- 1. Add new enum values
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sys_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'role_admin';