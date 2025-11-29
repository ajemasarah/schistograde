/*
# Security Fixes and Profile Backfill

## Query Description: 
1. Secures the `increment_prompt_count` function by setting a fixed search_path, addressing the security advisory.
2. Ensures the `handle_new_user` trigger function is also secure.
3. Backfills profiles for any users in `auth.users` that might be missing from `public.profiles` to ensure the app logic works for everyone.

## Metadata:
- Schema-Category: "Safe"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Security Implications:
- Fixes "Function Search Path Mutable" warning.
- Ensures all users have a profile for RLS and logic application.
*/

-- Secure the increment_prompt_count function
CREATE OR REPLACE FUNCTION public.increment_prompt_count()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET prompt_count = prompt_count + 1
  WHERE id = auth.uid();
END;
$$;

-- Secure the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

-- Ensure the trigger exists and is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Backfill missing profiles for existing users (Safe operation)
INSERT INTO public.profiles (id, email)
SELECT id, email
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
