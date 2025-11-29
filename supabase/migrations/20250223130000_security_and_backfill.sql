/*
  # Security Hardening & Profile Backfill

  ## Query Description:
  1. Updates the increment_prompt_count function to set a secure search_path (Fixes Security Advisory).
  2. Backfills profiles for any existing users to ensure prompt limits apply to everyone.

  ## Metadata:
  - Schema-Category: "Safe"
  - Impact-Level: "Low"
*/

-- 1. Secure the function by setting a fixed search_path
CREATE OR REPLACE FUNCTION public.increment_prompt_count()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.profiles
  SET prompt_count = prompt_count + 1
  WHERE id = auth.uid();
END;
$$;

-- 2. Backfill profiles for existing users who might be missing them
INSERT INTO public.profiles (id, email, full_name)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', 'User')
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
