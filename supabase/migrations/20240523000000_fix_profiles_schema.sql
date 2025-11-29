/*
  # Fix Profiles Schema and Policies
  
  ## Query Description:
  This migration resolves the "policy already exists" error by safely dropping existing policies before recreating them. 
  It ensures the `profiles` table has all required columns for the premium features and prompt limits.
  
  ## Metadata:
  - Schema-Category: "Safe"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  
  ## Structure Details:
  - Table: public.profiles
  - Columns: prompt_count, is_premium, subscription_plan
  - Policies: "Users can view own profile", "Users can update own profile"
  - Functions: increment_prompt_count, handle_new_user
*/

-- 1. Safely create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  prompt_count INTEGER DEFAULT 0,
  is_premium BOOLEAN DEFAULT FALSE,
  subscription_plan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add columns if they don't exist (Idempotent check)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'prompt_count') THEN
        ALTER TABLE public.profiles ADD COLUMN prompt_count INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_premium') THEN
        ALTER TABLE public.profiles ADD COLUMN is_premium BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_plan') THEN
        ALTER TABLE public.profiles ADD COLUMN subscription_plan TEXT;
    END IF;
END $$;

-- 3. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies to avoid "policy already exists" error
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 5. Recreate Policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 6. Function to increment prompt count securely (Security Definer allows bypassing RLS for this specific action)
CREATE OR REPLACE FUNCTION increment_prompt_count()
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET prompt_count = COALESCE(prompt_count, 0) + 1
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, prompt_count, is_premium)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    0,
    FALSE
  )
  ON CONFLICT (id) DO NOTHING; -- Handle case where profile might already exist
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safely recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
