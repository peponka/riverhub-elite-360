-- ViaBarcazas: user_profiles becomes the only authoritative account profile.
-- profiles remains temporarily as a synchronized compatibility table for
-- legacy dashboards. Execute once in Supabase SQL Editor after deployment.

BEGIN;

ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS fcm_token TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Legacy columns are kept only while old dashboard screens are migrated.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fcm_token TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Preserve legacy contact and notification data without replacing the
-- canonical company or role already stored in user_profiles.
UPDATE public.user_profiles up
SET
  email = COALESCE(up.email, (SELECT p.email FROM public.profiles p WHERE p.id = up.user_id), au.email),
  full_name = COALESCE(up.full_name, (SELECT p.full_name FROM public.profiles p WHERE p.id = up.user_id)),
  phone = COALESCE(up.phone, (SELECT p.phone FROM public.profiles p WHERE p.id = up.user_id)),
  job_title = COALESCE(up.job_title, (SELECT p.job_title FROM public.profiles p WHERE p.id = up.user_id)),
  avatar_url = COALESCE(up.avatar_url, (SELECT p.avatar_url FROM public.profiles p WHERE p.id = up.user_id)),
  fcm_token = COALESCE(up.fcm_token, (SELECT p.fcm_token FROM public.profiles p WHERE p.id = up.user_id)),
  is_active = COALESCE(up.is_active, (SELECT p.is_active FROM public.profiles p WHERE p.id = up.user_id), true),
  last_login = COALESCE(up.last_login, (SELECT p.last_login FROM public.profiles p WHERE p.id = up.user_id)),
  permissions = COALESCE(up.permissions, (SELECT p.permissions FROM public.profiles p WHERE p.id = up.user_id), '{}'::jsonb),
  updated_at = NOW()
FROM auth.users au
WHERE au.id = up.user_id;

CREATE INDEX IF NOT EXISTS idx_user_profiles_fcm_token
  ON public.user_profiles(fcm_token)
  WHERE fcm_token IS NOT NULL;

-- The existing signup trigger creates the company and canonical profile.
-- This follow-up trigger stores the remaining contact metadata from both the
-- web and mobile registration flows without trusting any client role value.
CREATE OR REPLACE FUNCTION public.enrich_user_profile_from_auth_metadata()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  metadata JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
BEGIN
  UPDATE public.user_profiles
  SET
    email = NEW.email,
    full_name = COALESCE(NULLIF(BTRIM(metadata->>'full_name'), ''), full_name),
    phone = COALESCE(NULLIF(BTRIM(metadata->>'phone'), ''), phone),
    job_title = COALESCE(NULLIF(BTRIM(metadata->>'job_title'), ''), job_title)
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS zz_enrich_user_profile_metadata ON auth.users;
CREATE TRIGGER zz_enrich_user_profile_metadata
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.enrich_user_profile_from_auth_metadata();

-- Browser users can update only their contact details. Company, role, active
-- state and permissions remain server-managed even when a legacy policy exists.
CREATE OR REPLACE FUNCTION public.protect_user_profile_security_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND (
    NEW.company_id IS DISTINCT FROM OLD.company_id OR
    NEW.role IS DISTINCT FROM OLD.role OR
    NEW.is_active IS DISTINCT FROM OLD.is_active OR
    NEW.permissions IS DISTINCT FROM OLD.permissions OR
    NEW.user_id IS DISTINCT FROM OLD.user_id
  ) THEN
    RAISE EXCEPTION 'No se permite modificar permisos ni empresa desde el cliente';
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_user_profile_security_fields ON public.user_profiles;
CREATE TRIGGER protect_user_profile_security_fields
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_user_profile_security_fields();

-- Mirror canonical data to the old table until remaining legacy screens stop
-- reading it. This prevents the two records from diverging again.
CREATE OR REPLACE FUNCTION public.sync_legacy_profile_from_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, full_name, company_id, role, job_title, phone, avatar_url,
    fcm_token, is_active, last_login, permissions, created_at, updated_at
  ) VALUES (
    NEW.user_id, NEW.email, NEW.full_name, NEW.company_id::text, NEW.role,
    NEW.job_title, NEW.phone, NEW.avatar_url, NEW.fcm_token, NEW.is_active,
    NEW.last_login, NEW.permissions, COALESCE(NEW.created_at, NOW()), NOW()
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    company_id = EXCLUDED.company_id,
    role = EXCLUDED.role,
    job_title = EXCLUDED.job_title,
    phone = EXCLUDED.phone,
    avatar_url = EXCLUDED.avatar_url,
    fcm_token = EXCLUDED.fcm_token,
    is_active = EXCLUDED.is_active,
    last_login = EXCLUDED.last_login,
    permissions = EXCLUDED.permissions,
    updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_legacy_profile_from_user_profile ON public.user_profiles;
CREATE TRIGGER sync_legacy_profile_from_user_profile
  AFTER INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_legacy_profile_from_user_profile();

-- Older mobile versions may still save names or FCM tokens to profiles.
-- Accept only those non-sensitive fields and copy them into user_profiles.
CREATE OR REPLACE FUNCTION public.sync_contact_from_legacy_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  UPDATE public.user_profiles
  SET
    email = COALESCE(NEW.email, email),
    full_name = COALESCE(NEW.full_name, full_name),
    phone = COALESCE(NEW.phone, phone),
    job_title = COALESCE(NEW.job_title, job_title),
    avatar_url = COALESCE(NEW.avatar_url, avatar_url),
    fcm_token = COALESCE(NEW.fcm_token, fcm_token)
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_contact_from_legacy_profile ON public.profiles;
CREATE TRIGGER sync_contact_from_legacy_profile
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_contact_from_legacy_profile();

COMMIT;

SELECT 'user_profiles is now the canonical account profile' AS status;
