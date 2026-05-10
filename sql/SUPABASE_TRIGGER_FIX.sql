-- Phase 1: Database Supabase Clean-Up & Re-creation of Triggers

-- 1. Drop the existing trigger and function if they exist to start fresh
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Recreate the precise function mapping auth.users to public.profiles
-- We will assign users to the main test company ID to ensure there are no orphan profiles.
-- By default or hardcoded default we can ensure they land correctly.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  default_company_id uuid := '4af26be7-00f9-4f26-aebf-dc9b611e0822'; -- ID exacto de RiverHub Global
BEGIN
  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    email,
    role,
    company_id,
    fcm_token,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'tripulante'),
    COALESCE((NEW.raw_user_meta_data->>'company_id')::uuid, default_company_id),
    NULL,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- 3. Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- You must run this SQL snippet in the Supabase SQL Editor.
